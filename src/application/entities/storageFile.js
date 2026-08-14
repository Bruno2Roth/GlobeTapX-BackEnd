/**
 * Metadata de un archivo almacenado en Supabase Storage.
 *
 * No representa una tabla propia: el path se persiste en Usuario.fotoPerfil
 * y el contenido binario vive en el bucket externo.
 */
export default class storageFile {
    constructor({ bucket, path, url, originalName, mimeType, size, usuarioId }) {
        this.bucket = bucket;
        this.path = path;
        this.url = url;
        this.originalName = originalName || null;
        this.mimeType = mimeType || null;
        this.size = size || 0;
        this.usuarioId = usuarioId;
    }

    /** Permite serializar la entidad sin incluir buffers ni credenciales. */
    toJSON() {
        return {
            bucket: this.bucket,
            path: this.path,
            url: this.url,
            originalName: this.originalName,
            mimeType: this.mimeType,
            size: this.size,
            usuarioId: this.usuarioId,
        };
    }
}
