export default class preferenciasUsuario {
    constructor(IDUsuario, IDCategoria, nivelPreferencia) {
        this.IDUsuario = IDUsuario;
        this.IDCategoria = IDCategoria;
        this.nivelPreferencia = nivelPreferencia;
    }
} {

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
}