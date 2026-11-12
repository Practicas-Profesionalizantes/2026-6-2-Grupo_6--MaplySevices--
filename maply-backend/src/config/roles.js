// id de la tabla `rol` que corresponde al administrador (revisar con `SELECT * FROM rol;`).
// En la base actual es 3; se configura con ADMIN_ROL_ID en el .env.
const ADMIN_ROL_ID = Number(process.env.ADMIN_ROL_ID) || 1;

const esAdmin = (usuario) => !!usuario && usuario.id_rol === ADMIN_ROL_ID;

module.exports = { ADMIN_ROL_ID, esAdmin };
