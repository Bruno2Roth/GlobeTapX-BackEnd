const Usuario = require("../../application/models/usuario");

async function obtenerUsuarioPorId(id) {
    const resultado = await db.query(
        "SELECT * FROM Usuario WHERE ID = @id"
    );

    const usuarioDB = resultado.recordset[0];

    return new Usuario({
        id: usuarioDB.ID,
        nombre: usuarioDB.nombre,
        mail: usuarioDB.mail,
        contrasena: usuarioDB.contrasena,
        nombreCompleto: usuarioDB.nombreCompleto,
        numeroContacto: usuarioDB.numeroContacto,
        idTipoAdmin: usuarioDB.IDTipoAdmin,
        esPremium: usuarioDB.esPremium
    });
}

module.exports = {
    obtenerUsuarioPorId
};