class AgendaUsuario {
    constructor({
        id,
        idUsuario,
        idEvento,
        interes,
        recordatorio
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
            idEvento !== null &&
            typeof idEvento !== "number"
        ) {
            throw new Error("El idEvento debe ser un número");
        }

        if (typeof interes !== "boolean") {
            throw new Error("interes debe ser true o false");
        }

        if (
            recordatorio !== null &&
            isNaN(new Date(recordatorio))
        ) {
            throw new Error("La fecha de recordatorio es inválida");
        }

        this.id = id;
        this.idUsuario = idUsuario;
        this.idEvento = idEvento;
        this.interes = interes;
        this.recordatorio = recordatorio;
    }

    activarInteres() {
        this.interes = true;
    }

    desactivarInteres() {
        this.interes = false;
    }

    tieneRecordatorio() {
        return this.recordatorio !== null;
    }
}

module.exports = AgendaUsuario;