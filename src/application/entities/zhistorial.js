export default class Historial {
    constructor(IDUsuario, query, dispositivo, fecha) {
        this.IDUsuario   = IDUsuario;
        this.query       = query;
        this.dispositivo = dispositivo;
        this.fecha       = fecha;
    }
}