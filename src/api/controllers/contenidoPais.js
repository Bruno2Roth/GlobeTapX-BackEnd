class ContenidoPais {
    constructor({
        id,
        idPais,
        idCategoria,
        nombre,
        descripcion,
        creadoPorID
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
            nombre !== null &&
            typeof nombre !== "string"
        ) {
            throw new Error("El nombre debe ser texto");
        }

        if (
            nombre &&
            nombre.length > 50
        ) {
            throw new Error("El nombre no puede superar 50 caracteres");
        }

        if (
            descripcion !== null &&
            typeof descripcion !== "string"
        ) {
            throw new Error("La descripción debe ser texto");
        }

        if (
            creadoPorID !== null &&
            typeof creadoPorID !== "number"
        ) {
            throw new Error("El creadoPorID debe ser un número");
        }

        this.id = id;
        this.idPais = idPais;
        this.idCategoria = idCategoria;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.creadoPorID = creadoPorID;
    }

    tieneDescripcion() {
        return (
            this.descripcion !== null &&
            this.descripcion.trim() !== ""
        );
    }
}

module.exports = ContenidoPais;