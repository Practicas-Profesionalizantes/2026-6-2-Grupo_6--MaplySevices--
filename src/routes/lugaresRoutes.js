const express = require('express');
const router = express.Router();
const lugaresController = require('../controllers/lugaresController');
const { verifyToken } = require('../middleware/auth');

router.get('/', lugaresController.getLugares);
router.post('/', verifyToken, lugaresController.createLugar);

module.exports = router;
