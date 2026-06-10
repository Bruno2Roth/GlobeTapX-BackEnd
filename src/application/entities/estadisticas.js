export default class estadisticas {
    constructor(data = {}) {
        this.ID                  = data.ID || null;
        this.IDUsuario           = data.IDUsuario || null;
        this.paisesVisitados     = data.paisesVisitados || 0;
        this.expediciones        = data.expediciones || 0;
        this.eventosAsistidos    = data.eventosAsistidos || 0;
        this.continentesVisitados = data.continentesVisitados || 0;
        this.diasViajando        = data.diasViajando || 0;
        this.nivelViajero        = data.nivelViajero || 1;
        this.ultimaUbicacion     = data.ultimaUbicacion || null;
        this.fechaActualizacion  = data.fechaActualizacion || new Date();
    }
}