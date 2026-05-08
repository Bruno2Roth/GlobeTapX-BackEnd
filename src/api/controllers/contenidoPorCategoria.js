class ContenidoPorCategoria {
    constructor({
        id,
        idPais,
        idCategoria,
        titulo,
        contenido,
        creadoPor,
        fechaCreacion
    }) {

        if (typeof id !== "number") {
            throw new Error("El id debe ser un número");
        }

        if (
            idPais !== null &&
            typeof idPais !== "number"
        ) {
            throw new Error("El idPais debe ser un número");
        }

        if (
            idCategoria !== null &&
            typeof idCategoria !== "number"
        ) {
            throw new Error("El idCategoria debe ser un número");
        }

        if (
            titulo !== null &&
            typeof titulo !== "string"
        ) {
            throw new Error("El título debe ser texto");
        }

        if (
            titulo &&
            titulo.length > 100
        ) {
            throw new Error("El título no puede superar 100 caracteres");
        }

        if (
            contenido !== null &&
            typeof contenido !== "string"
        ) {
            throw new Error("El contenido debe ser texto");
        }

        if (
            creadoPor !== null &&
            typeof creadoPor !== "number"
        ) {
            throw new Error("El creadoPor debe ser un número");
        }

        if (isNaN(new Date(fechaCreacion))) {
            throw new Error("La fechaCreacion es inválida");
        }

        this.id = id;
        this.idPais = idPais;
        this.idCategoria = idCategoria;
        this.titulo = titulo;
        this.contenido = contenido;
        this.creadoPor = creadoPor;
        this.fechaCreacion = fechaCreacion;
    }

    tieneContenido() {
        return (
            this.contenido !== null &&
            this.contenido.trim() !== ""
        );
    }
}

module.exports = ContenidoPorCategoria;