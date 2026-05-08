class ContactoEmergencia {
    constructor({
        id,
        idPais,
        idCategoriaEmergencia,
        nombre,
        telefono,
        creadoPor
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
            idCategoriaEmergencia !== null &&
            typeof idCategoriaEmergencia !== "number"
        ) {
            throw new Error("El idCategoriaEmergencia debe ser un número");
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
            telefono !== null &&
            typeof telefono !== "string"
        ) {
            throw new Error("El teléfono debe ser texto");
        }

        if (
            telefono &&
            telefono.length > 50
        ) {
            throw new Error("El teléfono no puede superar 50 caracteres");
        }

        if (
            creadoPor !== null &&
            typeof creadoPor !== "number"
        ) {
            throw new Error("El creadoPor debe ser un número");
        }

        this.id = id;
        this.idPais = idPais;
        this.idCategoriaEmergencia = idCategoriaEmergencia;
        this.nombre = nombre;
        this.telefono = telefono;
        this.creadoPor = creadoPor;
    }

    tieneTelefono() {
        return (
            this.telefono !== null &&
            this.telefono.trim() !== ""
        );
    }
}

module.exports = ContactoEmergencia;