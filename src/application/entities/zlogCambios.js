export default class zlogCambios {
    constructor(IDUsuario, accion, tipoEntidad, IDEntidad, diferencia, fechaCreacion) {
        this.IDUsuario      = IDUsuario;
        this.accion         = accion;
        this.tipoEntidad    = tipoEntidad;
        this.IDEntidad      = IDEntidad;
        this.diferencia     = diferencia;
        this.fechaCreacion  = fechaCreacion;
    }
}