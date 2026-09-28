// src/routes/authRoutes.js
// Define las rutas HTTP de autenticación y las conecta con los controladores.

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { registrationValidationRules, validateUserRegistration, loginRules, olvideRules, restablecerRules, validar } = require('../validators/userRegistration');

// Anti fuerza bruta: 5 intentos fallidos cada 15 minutos por IP.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos. Probá de nuevo en 15 minutos.' },
});
// Anti creación masiva de cuentas: 5 registros por hora por IP.
const limiteRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { error: 'Demasiados registros desde esta conexión. Probá más tarde.' },
});

router.post('/register', limiteRegistro, registrationValidationRules, validateUserRegistration, authController.register);
router.post('/login', limiteLogin, loginRules, validar, authController.login);
router.post('/logout', verifyToken, authController.logout);
// Olvidé mi contraseña. Mismo tope que el registro para no usarlo de spam de mails.
router.post('/olvide-contrasena', limiteRegistro, olvideRules, validar, authController.olvideContrasena);
router.post('/restablecer-contrasena', limiteLogin, restablecerRules, validar, authController.restablecerContrasena);
// Borrar cuenta (lo exigen Apple/Google y la Ley 25.326): pide la contraseña de nuevo.
router.delete('/cuenta', verifyToken, limiteLogin, loginRules.slice(1), validar, authController.borrarCuenta);

module.exports = router;
