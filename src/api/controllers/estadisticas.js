class Estadisticas {
    constructor({
        id,
        idUsuario,
        paisesVisitados,
        kilometrosRecorridos,
        expediciones,
        ultimaUbicacion,
        fechaActualizacion
    }) {

        if (typeof id !== "number") {
            throw new Error("El id debe ser un número");
        }

        if (typeof idUsuario !== "number") {
            throw new Error("El idUsuario debe ser un número");
        }

        if (typeof paisesVisitados !== "number") {
            throw new Error("paisesVisitados debe ser un número");
        }

        if (paisesVisitados < 0) {
            throw new Error("paisesVisitados no puede ser negativo");
        }

        if (typeof kilometrosRecorridos !== "number") {
            throw new Error("kilometrosRecorridos debe ser un número");
        }

        if (kilometrosRecorridos < 0) {
            throw new Error("kilometrosRecorridos no puede ser negativo");
        }

        if (typeof expediciones !== "number") {
            throw new Error("expediciones debe ser un número");
        }

        if (expediciones < 0) {
            throw new Error("expediciones no puede ser negativo");
        }

        if (
            ultimaUbicacion !== null &&
            typeof ultimaUbicacion !== "string"
        ) {
            throw new Error("ultimaUbicacion debe ser texto");
        }

        if (
            ultimaUbicacion &&
            ultimaUbicacion.length > 150
        ) {
            throw new Error("ultimaUbicacion no puede superar 150 caracteres");
        }

        if (isNaN(new Date(fechaActualizacion))) {
            throw new Error("La fechaActualizacion es inválida");
        }

        this.id = id;
        this.idUsuario = idUsuario;
        this.paisesVisitados = paisesVisitados;
        this.kilometrosRecorridos = kilometrosRecorridos;
        this.expediciones = expediciones;
        this.ultimaUbicacion = ultimaUbicacion;
        this.fechaActualizacion = fechaActualizacion;
    }

    agregarKilometros(km) {
        this.kilometrosRecorridos += km;
    }

    sumarPaisVisitado() {
        this.paisesVisitados++;
    }

    sumarExpedicion() {
        this.expediciones++;
    }
}

module.exports = Estadisticas;