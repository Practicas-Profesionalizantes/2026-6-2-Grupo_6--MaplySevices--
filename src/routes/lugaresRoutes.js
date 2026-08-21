const express = require('express');
const router = express.Router();
const lugaresController = require('../controllers/lugaresController');

router.get('/', lugaresController.getLugares);

module.exports = router;
