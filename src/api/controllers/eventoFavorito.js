class EventoFavorito {
  constructor({
    id,
    idUsuario,
    idEvento,
    fechaAgregado
  }) {
    this.id = id;
    this.idUsuario = idUsuario;
    this.idEvento = idEvento;
    this.fechaAgregado = fechaAgregado;
  }
}

module.exports = EventoFavorito;