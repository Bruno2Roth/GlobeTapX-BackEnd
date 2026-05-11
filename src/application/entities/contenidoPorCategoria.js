export default class contenidoPorCategoria {
    constructor(IDPais, IDCategoria, titulo, contenido, creadoPor, fechaCreacion) {
        this.IDPais         = IDPais;
        this.IDCategoria    = IDCategoria;
        this.titulo         = titulo;
        this.contenido      = contenido;
        this.creadoPor      = creadoPor;
        this.fechaCreacion  = fechaCreacion;
    }
}