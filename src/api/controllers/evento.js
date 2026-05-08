class EventoPais {
  constructor({
    id,
    idPais,
    idCategoria,
    nombre,
    descripcion,
    fechaInicio,
    fechaFin,
    ubicacion
  }) {

    if (typeof id !== "number") {
      throw new Error("El id debe ser un número");
    }

    if (typeof idPais !== "number") {
      throw new Error("El idPais debe ser un número");
    }

    if (typeof idCategoria !== "number") {
      throw new Error("El idCategoria debe ser un número");
    }

    if (typeof nombre !== "string") {
      throw new Error("El nombre debe ser texto");
    }

    if (nombre.length > 50) {
      throw new Error("El nombre no puede superar 50 caracteres");
    }

    if (typeof descripcion !== "string") {
      throw new Error("La descripción debe ser texto");
    }

    if (typeof ubicacion !== "string") {
      throw new Error("La ubicación debe ser texto");
    }

    if (ubicacion.length > 255) {
      throw new Error("La ubicación no puede superar 255 caracteres");
    }

    if (isNaN(new Date(fechaInicio))) {
      throw new Error("La fecha de inicio es inválida");
    }

    if (isNaN(new Date(fechaFin))) {
      throw new Error("La fecha de fin es inválida");
    }

    this.id = id;
    this.idPais = idPais;
    this.idCategoria = idCategoria;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.ubicacion = ubicacion;
  }

  estaActivo() {
    const hoy = new Date();

    return (
      hoy >= new Date(this.fechaInicio) &&
      hoy <= new Date(this.fechaFin)
    );
  }

  yaFinalizo() {
    return new Date() > new Date(this.fechaFin);
  }
}

module.exports = EventoPais;