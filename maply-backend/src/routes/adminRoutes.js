// Rutas de administración. Todas piden token y rol de administrador.
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');
const { idParam, validar } = require('../validators/userRegistration');

const { esAdmin } = require('../config/roles');

// El rol se lee de la base en verifyToken, así que si a alguien le sacan
// el rol de admin pierde el acceso en el momento.
function soloAdmin(req, res, next) {
  if (!esAdmin(req.usuario)) return res.status(403).json({ error: 'Solo para administradores' });
  next();
}

router.use(verifyToken, soloAdmin);

// PATCH /api/admin/usuarios/:id/bloqueo  { bloqueado: true | false }
router.patch('/usuarios/:id/bloqueo', idParam('id'), body('bloqueado').isBoolean().toBoolean(), validar, adminController.bloquearUsuario);

module.exports = router;
