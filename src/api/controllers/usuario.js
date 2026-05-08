class Usuario {
    constructor({
        id,
        nombre,
        mail,
        contrasena,
        nombreCompleto,
        numeroContacto,
        idTipoAdmin,
        esPremium
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

        if (typeof mail !== "string") {
            throw new Error("El mail debe ser texto");
        }

        if (mail.length > 320) {
            throw new Error("El mail no puede superar 320 caracteres");
        }

        if (!mail.includes("@")) {
            throw new Error("El mail no es válido");
        }

        if (contrasena !== null && typeof contrasena !== "string") {
            throw new Error("La contraseña debe ser texto");
        }

        if (contrasena && contrasena.length > 50) {
            throw new Error("La contraseña no puede superar 50 caracteres");
        }

        if (
            nombreCompleto !== null &&
            typeof nombreCompleto !== "string"
        ) {
            throw new Error("El nombre completo debe ser texto");
        }

        if (
            nombreCompleto &&
            nombreCompleto.length > 100
        ) {
            throw new Error("El nombre completo no puede superar 100 caracteres");
        }

        if (
            numeroContacto !== null &&
            typeof numeroContacto !== "string"
        ) {
            throw new Error("El número de contacto debe ser texto");
        }

        if (
            numeroContacto &&
            numeroContacto.length > 50
        ) {
            throw new Error("El número de contacto no puede superar 50 caracteres");
        }

        if (
            idTipoAdmin !== null &&
            typeof idTipoAdmin !== "number"
        ) {
            throw new Error("El idTipoAdmin debe ser un número");
        }

        if (typeof esPremium !== "boolean") {
            throw new Error("esPremium debe ser true o false");
        }

        this.id = id;
        this.nombre = nombre;
        this.mail = mail;
        this.contrasena = contrasena;
        this.nombreCompleto = nombreCompleto;
        this.numeroContacto = numeroContacto;
        this.idTipoAdmin = idTipoAdmin;
        this.esPremium = esPremium;
    }

    esAdmin() {
        return this.idTipoAdmin !== null;
    }

    activarPremium() {
        this.esPremium = true;
    }
}

module.exports = Usuario;