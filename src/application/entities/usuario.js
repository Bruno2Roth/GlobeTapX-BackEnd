export default class usuario {
    constructor(nombre, mail, contrasena, fecha_nacimiento, nombreCompleto, numeroContacto, IDTipoAdmin, ESPremium, paisactual) {
        this.nombre            = nombre;
        this.contrasena        = contrasena;
        this.mail              = mail;
        this.fecha_nacimiento  = fecha_nacimiento;
        this.nombreCompleto    = nombreCompleto;
        this.numeroContacto    = numeroContacto;
        this.IDTipoAdmin    = IDTipoAdmin;
        this.ESPremium    = ESPremium;
        this.paisactual    = paisactual;
    }
}
