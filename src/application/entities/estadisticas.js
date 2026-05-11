export default class estadisticas {
    constructor(IDUsuario, paisesVisitados, kilometrosRecorridos, expediciones, ultimaUbicacion, fechaActualizacion) {
        this.IDUsuario           = IDUsuario;
        this.paisesVisitados     = paisesVisitados;
        this.kilometrosRecorridos = kilometrosRecorridos;
        this.expediciones        = expediciones;
        this.ultimaUbicacion     = ultimaUbicacion;
        this.fechaActualizacion  = fechaActualizacion;
    }
}