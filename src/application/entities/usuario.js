export default class usuario {
    constructor(nombre, mail, contrasena, nombreCompleto, numeroContacto, IDTipoAdmin, esPremium, paisactual, fotoPerfil, isAdmin) {
        this.nombre            = nombre;
        this.contrasena        = contrasena;
        this.mail              = mail;
        this.nombreCompleto    = nombreCompleto;
        this.numeroContacto    = numeroContacto;
        this.IDTipoAdmin    = IDTipoAdmin;
        this.esPremium    = esPremium;
        this.paisactual    = paisactual;
        this.fotoPerfil    = fotoPerfil;
        this.isAdmin       = isAdmin;
    }
}
