class PreferenciaUsuario {
    constructor({
        id,
        idUsuario,
        idCategoria,
        nivelPreferencia
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
            idCategoria !== null &&
            typeof idCategoria !== "number"
        ) {
            throw new Error("El idCategoria debe ser un número");
        }

        if (typeof nivelPreferencia !== "number") {
            throw new Error("El nivel de preferencia debe ser un número");
        }

        if (nivelPreferencia < 1) {
            throw new Error("El nivel de preferencia no puede ser menor a 1");
        }

        this.id = id;
        this.idUsuario = idUsuario;
        this.idCategoria = idCategoria;
        this.nivelPreferencia = nivelPreferencia;
    }

    aumentarPreferencia() {
        this.nivelPreferencia++;
    }

    disminuirPreferencia() {
        if (this.nivelPreferencia > 1) {
            this.nivelPreferencia--;
        }
    }
}

module.exports = PreferenciaUsuario;