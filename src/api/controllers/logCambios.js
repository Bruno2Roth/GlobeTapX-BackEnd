class LogCambios {
    constructor({
        id,
        idUsuario,
        accion,
        tipoEntidad,
        idEntidad,
        diferencia,
        fechaCreacion
    }) {

        if (typeof id !== "number") {
            throw new Error("El id debe ser un número");
        }

        if (
            idUsuario !== null &&
            typeof idUsuario !== "number"
        ) {
            throw new Error("El idUsuario debe ser un número");
        }

        if (
            accion !== null &&
            typeof accion !== "string"
        ) {
            throw new Error("La acción debe ser texto");
        }

        if (
            accion &&
            accion.length > 50
        ) {
            throw new Error("La acción no puede superar 50 caracteres");
        }

        if (
            tipoEntidad !== null &&
            typeof tipoEntidad !== "string"
        ) {
            throw new Error("El tipoEntidad debe ser texto");
        }

        if (
            tipoEntidad &&
            tipoEntidad.length > 50
        ) {
            throw new Error("El tipoEntidad no puede superar 50 caracteres");
        }

        if (
            idEntidad !== null &&
            typeof idEntidad !== "number"
        ) {
            throw new Error("El idEntidad debe ser un número");
        }

        if (
            diferencia !== null &&
            typeof diferencia !== "string"
        ) {
            throw new Error("La diferencia debe ser texto");
        }

        if (isNaN(new Date(fechaCreacion))) {
            throw new Error("La fechaCreacion es inválida");
        }

        this.id = id;
        this.idUsuario = idUsuario;
        this.accion = accion;
        this.tipoEntidad = tipoEntidad;
        this.idEntidad = idEntidad;
        this.diferencia = diferencia;
        this.fechaCreacion = fechaCreacion;
    }

    esEliminacion() {
        return (
            this.accion !== null &&
            this.accion.toUpperCase() === "DELETE"
        );
    }
}

module.exports = LogCambios;