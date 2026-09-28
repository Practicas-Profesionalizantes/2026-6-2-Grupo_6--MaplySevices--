const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
// Anti spam: máximo 30 publicaciones por hora por USUARIO (va después de
// verifyToken). Por IP no alcanza: cambiar de red o de datos móviles lo esquiva.
const porUsuario = (req) => String(req.usuario.id_usuario);
const limitePublicar = rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, keyGenerator: porUsuario, message: { error: 'Publicaste demasiado seguido. Probá más tarde.' } });
const limiteDenunciar = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, keyGenerator: porUsuario, message: { error: 'Denunciaste demasiado seguido. Probá más tarde.' } });
const reportesController = require('../controllers/reportesController');
const { query } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { reporteRules, denunciaRules, idParam, validar } = require('../validators/userRegistration');

router.get('/', reportesController.getReportes);
// Ruta específica antes que "/:id" para que "/lugar/5/estado-actual" no
// intente matchear como si "lugar" fuera un id de reporte.
router.get('/lugar/:id_lugar/estado-actual', idParam('id_lugar'), validar, reportesController.getEstadoActualLugar);
router.get('/:id', idParam('id'), validar, reportesController.getReporteById);
// Traducir cuesta cuota del servicio externo: tope por IP (no pide login).
const limiteTraducir = rateLimit({ windowMs: 60 * 60 * 1000, limit: 60, message: { error: 'Demasiadas traducciones seguidas. Probá más tarde.' } });
router.get('/:id/traduccion', limiteTraducir, idParam('id'), query('idioma').isIn(['es', 'en']), validar, reportesController.traducirReporte);
router.post('/', verifyToken, limitePublicar, reporteRules, validar, reportesController.crearReporte);
router.post('/:id/denuncias', verifyToken, limiteDenunciar, idParam('id'), denunciaRules, validar, reportesController.denunciarReporte);

module.exports = router;
