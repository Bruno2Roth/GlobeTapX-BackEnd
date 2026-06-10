export default class registroEstadisticas {
    constructor(data = {}) {
        this.ID = data.ID || null;
        this.IDUsuario = data.IDUsuario || null;
        this.tipoEvento = data.tipoEvento || '';
        this.detalle = data.detalle || null;
        this.fecha = data.fecha || new Date();
    }
}
