class Multimedia {
    constructor({
        id,
        idEntidad,
        tipoEntidad,
        urlImagen,
        esPrincipal,
        fechaCarga
    }) {

        if (typeof id !== "number") {
            throw new Error("El id debe ser un número");
        }

        if (typeof idEntidad !== "number") {
            throw new Error("El idEntidad debe ser un número");
        }

        if (typeof tipoEntidad !== "string") {
            throw new Error("El tipoEntidad debe ser texto");
        }

        if (tipoEntidad.length > 20) {
            throw new Error("El tipoEntidad no puede superar 20 caracteres");
        }

        const tiposValidos = [
            "PAIS",
            "EVENTO",
            "USUARIO"
        ];

        if (!tiposValidos.includes(tipoEntidad)) {
            throw new Error("El tipoEntidad no es válido");
        }

        if (typeof urlImagen !== "string") {
            throw new Error("La urlImagen debe ser texto");
        }

        if (urlImagen.length > 500) {
            throw new Error("La urlImagen no puede superar 500 caracteres");
        }

        if (typeof esPrincipal !== "boolean") {
            throw new Error("esPrincipal debe ser true o false");
        }

        if (isNaN(new Date(fechaCarga))) {
            throw new Error("La fechaCarga es inválida");
        }

        this.id = id;
        this.idEntidad = idEntidad;
        this.tipoEntidad = tipoEntidad;
        this.urlImagen = urlImagen;
        this.esPrincipal = esPrincipal;
        this.fechaCarga = fechaCarga;
    }

    marcarComoPrincipal() {
        this.esPrincipal = true;
    }
}

module.exports = Multimedia;