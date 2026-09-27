const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
// Anti spam: máximo 10 lugares nuevos por hora por USUARIO (va después de verifyToken).
const limitePublicar = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, keyGenerator: (req) => String(req.usuario.id_usuario), message: { error: 'Creaste demasiados lugares seguidos. Probá más tarde.' } });
const lugaresController = require('../controllers/lugaresController');
const { verifyToken } = require('../middleware/auth');
const { lugarRules, validar } = require('../validators/userRegistration');

router.get('/', lugaresController.getLugares);
router.post('/', verifyToken, limitePublicar, lugarRules, validar, lugaresController.createLugar);

module.exports = router;
