export default class paisInfo {
    constructor({
        ID = null,
        IDPais = null,
        documentacion = null,
        reglas = null,
        vidaDiaria = null,
        paisNombre = null,
        ...rest
    } = {}) {
        this.ID = ID;
        this.IDPais = IDPais;
        this.documentacion = documentacion;
        this.reglas = reglas;
        this.vidaDiaria = vidaDiaria;
        this.paisNombre = paisNombre;
        Object.assign(this, rest);
    }
}
