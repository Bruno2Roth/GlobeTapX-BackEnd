import { createClient } from '@supabase/supabase-js';
import https from 'node:https';

const positiveInteger = (value, fallback) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

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
 * Fetch compatible with Supabase JS and with a hard timeout. This path is
 * used only when development explicitly disables TLS verification.
 */
function createSupabaseFetch(rejectUnauthorized, timeoutMs) {
    const agent = new https.Agent({ rejectUnauthorized });

    return async (input, init = {}) => {
        const request = new Request(input, init);
        const url = new URL(request.url);
        const headers = {};
        let timer;

        request.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const body = ['GET', 'HEAD'].includes(request.method)
            ? null
            : Buffer.from(await request.arrayBuffer());

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
                    clearTimeout(timer);
                    resolve(new Response(Buffer.concat(chunks), {
                        status: response.statusCode,
                        statusText: response.statusMessage,
                        headers: response.headers,
                    }));
                });
            });

            clientRequest.on('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });

            const abortRequest = () => clientRequest.destroy(new Error('Storage request aborted'));
            if (request.signal) {
                if (request.signal.aborted) {
                    abortRequest();
                    return;
                }

                request.signal.addEventListener('abort', abortRequest, { once: true });
            }

            timer = setTimeout(() => {
                clientRequest.destroy(Object.assign(new Error('Storage request timed out'), { code: 'ETIMEDOUT' }));
            }, timeoutMs);

            if (body) clientRequest.write(body);
            clientRequest.end();
        });
    };
}

function createTimedFetch(baseFetch, timeoutMs) {
    return async (input, init = {}) => {
        const timeoutController = new AbortController();
        const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);
        const externalSignal = init.signal;
        let signal = timeoutController.signal;

        if (externalSignal) {
            signal = AbortSignal.any
                ? AbortSignal.any([externalSignal, timeoutController.signal])
                : externalSignal;
        }

        try {
            return await baseFetch(input, { ...init, signal });
        } finally {
            clearTimeout(timeout);
        }
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
const timeoutMs = positiveInteger(process.env.STORAGE_TIMEOUT_MS, 8000);
const signedUrlTtlSeconds = positiveInteger(process.env.SIGNED_URL_TTL_SECONDS, 900);

const missing = [];
if (!supabaseUrl) missing.push('SUPABASE_URL');
if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (!bucket) missing.push('SUPABASE_STORAGE_BUCKET');

const clientOptions = {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    global: {
        fetch: rejectUnauthorized
            ? createTimedFetch(globalThis.fetch.bind(globalThis), timeoutMs)
            : createSupabaseFetch(false, timeoutMs),
    },
};

const client = supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, clientOptions)
    : null;

export default {
    client,
    supabaseUrl,
    bucket,
    isPublic,
    rejectUnauthorized,
    timeoutMs,
    signedUrlTtlSeconds,
    missing,
    configured: Boolean(client && bucket),
};
