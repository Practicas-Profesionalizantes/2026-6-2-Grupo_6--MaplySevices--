const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verifyToken } = require('../middleware/auth');

router.get('/', reportesController.getReportes);
// Ruta específica antes que "/:id" para que "/lugar/5/estado-actual" no
// intente matchear como si "lugar" fuera un id de reporte.
router.get('/lugar/:id_lugar/estado-actual', reportesController.getEstadoActualLugar);
router.get('/:id', reportesController.getReporteById);
router.post('/', verifyToken, reportesController.crearReporte);

module.exports = router;
