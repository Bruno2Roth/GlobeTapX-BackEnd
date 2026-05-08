class Historial {
    constructor({
        id,
        idUsuario,
        query,
        dispositivo,
        fecha
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
            query !== null &&
            typeof query !== "string"
        ) {
            throw new Error("La query debe ser texto");
        }

        if (
            query &&
            query.length > 500
        ) {
            throw new Error("La query no puede superar 500 caracteres");
        }

        if (
            dispositivo !== null &&
            typeof dispositivo !== "string"
        ) {
            throw new Error("El dispositivo debe ser texto");
        }

        if (
            dispositivo &&
            dispositivo.length > 50
        ) {
            throw new Error("El dispositivo no puede superar 50 caracteres");
        }

        if (isNaN(new Date(fecha))) {
            throw new Error("La fecha es inválida");
        }

        this.id = id;
        this.idUsuario = idUsuario;
        this.query = query;
        this.dispositivo = dispositivo;
        this.fecha = fecha;
    }

    esMobile() {
        return (
            this.dispositivo !== null &&
            (
                this.dispositivo.includes("iPhone") ||
                this.dispositivo.includes("Android")
            )
        );
    }
}

module.exports = Historial;