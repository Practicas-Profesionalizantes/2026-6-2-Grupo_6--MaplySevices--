// Lo personal de cada usuario: lugares favoritos y notificaciones. Todo pide sesión.
const express = require('express');
const router = express.Router();
const comunidad = require('../controllers/comunidadController');
const { verifyToken } = require('../middleware/auth');
const { idParam, validar } = require('../validators/userRegistration');

router.get('/favoritos', verifyToken, comunidad.getFavoritos);
router.put('/favoritos/:id_lugar', verifyToken, idParam('id_lugar'), validar, comunidad.agregarFavorito);
router.delete('/favoritos/:id_lugar', verifyToken, idParam('id_lugar'), validar, comunidad.quitarFavorito);

router.get('/notificaciones', verifyToken, comunidad.getNotificaciones);
router.patch('/notificaciones/leidas', verifyToken, comunidad.marcarLeidas);

module.exports = router;
