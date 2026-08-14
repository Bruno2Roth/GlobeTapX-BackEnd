import { createClient } from '@supabase/supabase-js';
import https from 'node:https';

/**
 * Configuración centralizada de Supabase Storage.
 *
 * Las variables sensibles nunca se exponen en respuestas HTTP. La clave
 * service_role se utiliza exclusivamente en el backend para acceder al
 * bucket privado configurado en SUPABASE_STORAGE_BUCKET.
 */

function deriveSupabaseUrlFromS3Endpoint(endpoint) {
    if (!endpoint) return null;

    const match = String(endpoint).match(/^https?:\/\/([^.]+)\.storage\.supabase\.co/i);
    return match ? `https://${match[1]}.supabase.co` : null;
}

function deriveSupabaseUrlFromDatabaseUrl(connectionString) {
    if (!connectionString) return null;

    try {
        const hostname = new URL(connectionString).hostname;
        const match = hostname.match(/^db\.([^.]+)\.supabase\.co$/i);
        return match ? `https://${match[1]}.supabase.co` : null;
    } catch {
        return null;
    }
}

function isEnabled(value, defaultValue = true) {
    if (value === undefined || value === null || value === '') return defaultValue;
    return String(value).trim().toLowerCase() === 'true';
}

/**
 * Fetch HTTPS compatible con Supabase JS.
 *
 * Algunas redes de desarrollo interceptan HTTPS con un certificado propio.
 * Solo se permite omitir esa validación cuando el entorno lo pide
 * explícitamente mediante SUPABASE_TLS_REJECT_UNAUTHORIZED=false.
 */
function createSupabaseFetch(rejectUnauthorized) {
    const agent = new https.Agent({ rejectUnauthorized });

    return async (input, init = {}) => {
        const request = new Request(input, init);
        const url = new URL(request.url);
        const headers = {};

        request.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const body = ['GET', 'HEAD'].includes(request.method)
            ? null
            : Buffer.from(await request.arrayBuffer());

        // Algunos proxies TLS cierran los DELETE con body chunked. Enviar
        // explícitamente Content-Length mantiene compatible la API de
        // Supabase Storage con esas redes.
        if (body) {
            headers['content-length'] = String(body.byteLength);
            delete headers['transfer-encoding'];
        }

        return new Promise((resolve, reject) => {
            const clientRequest = https.request(url, {
                method: request.method,
                headers,
                agent,
            }, (response) => {
                const chunks = [];

                response.on('data', chunk => chunks.push(chunk));
                response.on('end', () => {
                    resolve(new Response(Buffer.concat(chunks), {
                        status: response.statusCode,
                        statusText: response.statusMessage,
                        headers: response.headers,
                    }));
                });
            });

            clientRequest.on('error', reject);

            if (request.signal) {
                if (request.signal.aborted) {
                    clientRequest.destroy(new Error('La solicitud fue cancelada'));
                    return;
                }

                request.signal.addEventListener('abort', () => {
                    clientRequest.destroy(new Error('La solicitud fue cancelada'));
                }, { once: true });
            }

            if (body) clientRequest.write(body);
            clientRequest.end();
        });
    };
}

const s3Endpoint = process.env.SUPABASE_STORAGE_S3_ENDPOINT;
const supabaseUrl = process.env.SUPABASE_URL?.trim()
    || deriveSupabaseUrlFromS3Endpoint(s3Endpoint)
    || deriveSupabaseUrlFromDatabaseUrl(process.env.DATABASE_URL);
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || process.env.SUPABASE_SECRET_KEY?.trim();
const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
const isPublic = isEnabled(process.env.SUPABASE_STORAGE_PUBLIC, false);
const rejectUnauthorized = isEnabled(process.env.SUPABASE_TLS_REJECT_UNAUTHORIZED, true);

const missing = [];
if (!supabaseUrl) missing.push('SUPABASE_URL o una URL derivable');
if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (!bucket) missing.push('SUPABASE_STORAGE_BUCKET');

const clientOptions = {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
};

if (!rejectUnauthorized) {
    clientOptions.global = { fetch: createSupabaseFetch(false) };
}

const client = supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, clientOptions)
    : null;

export default {
    client,
    supabaseUrl,
    bucket,
    isPublic,
    rejectUnauthorized,
    missing,
    configured: Boolean(client && bucket && missing.length === 0),
};
