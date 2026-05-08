class CategoriaEmergencia {
    constructor({
        id,
        nombre,
        descripcion
    }) {

        if (typeof id !== "number") {
            throw new Error("El id debe ser un número");
        }

        if (typeof nombre !== "string") {
            throw new Error("El nombre debe ser texto");
        }

        if (nombre.length > 50) {
            throw new Error("El nombre no puede superar 50 caracteres");
        }

        if (
            descripcion !== null &&
            typeof descripcion !== "string"
        ) {
            throw new Error("La descripción debe ser texto");
        }

        if (
            descripcion &&
            descripcion.length > 200
        ) {
            throw new Error("La descripción no puede superar 200 caracteres");
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

module.exports = CategoriaEmergencia;