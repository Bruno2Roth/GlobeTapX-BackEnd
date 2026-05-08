class Ubicacion {
    constructor({
        id,
        idUsuario,
        posicion,
        ultimaActualizacion
    }) {

        if (typeof id !== "number") {
            throw new Error("El id debe ser un número");
        }

        if (typeof idUsuario !== "number") {
            throw new Error("El idUsuario debe ser un número");
        }

        if (
            typeof posicion !== "object" &&
            typeof posicion !== "string"
        ) {
            throw new Error("La posición debe ser un objeto o texto");
        }

        if (isNaN(new Date(ultimaActualizacion))) {
            throw new Error("La fecha de actualización es inválida");
        }

        this.id = id;
        this.idUsuario = idUsuario;
        this.posicion = posicion;
        this.ultimaActualizacion = ultimaActualizacion;
    }

    actualizarPosicion(nuevaPosicion) {
        this.posicion = nuevaPosicion;
        this.ultimaActualizacion = new Date();
    }
}

module.exports = Ubicacion;