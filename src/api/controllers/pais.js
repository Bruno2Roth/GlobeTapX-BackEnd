class Pais {
    constructor({
        id,
        nombre,
        descripcion
    }) {

        if (typeof id !== "number") {
            throw new Error("El id debe ser un número");
        }

        if (
            nombre !== null &&
            typeof nombre !== "string"
        ) {
            throw new Error("El nombre debe ser texto");
        }

        if (
            nombre &&
            nombre.length > 100
        ) {
            throw new Error("El nombre no puede superar 100 caracteres");
        }

        if (
            descripcion !== null &&
            typeof descripcion !== "string"
        ) {
            throw new Error("La descripción debe ser texto");
        }

        if (
            descripcion &&
            descripcion.length > 500
        ) {
            throw new Error("La descripción no puede superar 500 caracteres");
        }

        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    tieneDescripcion() {
        return (
            this.descripcion !== null &&
            this.descripcion.trim() !== ""
        );
    }
}

module.exports = Pais;