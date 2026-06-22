export default class usuario {
    constructor(nombre, mail, contrasena, nombreCompleto, numeroContacto, IDTipoAdmin, ESPremium, paisactual, fotoPerfil, IsAdmin) {
        this.nombre            = nombre;
        this.contrasena        = contrasena;
        this.mail              = mail;
        this.nombreCompleto    = nombreCompleto;
        this.numeroContacto    = numeroContacto;
        this.IDTipoAdmin    = IDTipoAdmin;
        this.ESPremium    = ESPremium;
        this.paisactual    = paisactual;
        this.fotoPerfil    = fotoPerfil;
        this.IsAdmin       = IsAdmin;
    }
}
