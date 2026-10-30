// Rutas de administración. Todas piden token y rol de administrador.
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');
const { idParam, validar } = require('../validators/userRegistration');

// id de la tabla `rol` que corresponde al administrador (revisar con `SELECT * FROM rol;`).
const ADMIN_ROL_ID = Number(process.env.ADMIN_ROL_ID) || 1;

// El rol se lee de la base en verifyToken, así que si a alguien le sacan
// el rol de admin pierde el acceso en el momento.
function soloAdmin(req, res, next) {
  if (req.usuario.id_rol !== ADMIN_ROL_ID) return res.status(403).json({ error: 'Solo para administradores' });
  next();
}

router.use(verifyToken, soloAdmin);

// PATCH /api/admin/usuarios/:id/bloqueo  { bloqueado: true | false }
router.patch('/usuarios/:id/bloqueo', idParam('id'), body('bloqueado').isBoolean().toBoolean(), validar, adminController.bloquearUsuario);

module.exports = router;
