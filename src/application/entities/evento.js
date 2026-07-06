export default class Evento {
    constructor(nombre, descripcion, fechaInicio, fechaFin, ubicacion, IDPais, imagen, IDCategoria, activo = true) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.ubicacion = ubicacion;
        this.IDPais = IDPais;
        this.imagen = imagen;
        this.IDCategoria = IDCategoria;
        this.activo = activo;
    }
}
