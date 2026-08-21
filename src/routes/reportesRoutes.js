const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verifyToken } = require('../middleware/auth');

router.get('/', reportesController.getReportes);
router.get('/:id', reportesController.getReporteById);
router.post('/', verifyToken, reportesController.crearReporte);

module.exports = router;
