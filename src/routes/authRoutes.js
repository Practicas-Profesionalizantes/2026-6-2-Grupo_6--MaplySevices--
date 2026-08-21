// src/routes/authRoutes.js
// Define las rutas HTTP de autenticación y las conecta con los controladores
// Las rutas NO contienen lógica de negocio: solo enlazan endpoints con los controladores.
//
// Este archivo es el mismo que ya estaba en el repo (Documentación branch,
// suelto en la raíz) — se movió a su lugar real (src/routes/) y se le
// agregó el logout, que faltaba, usando la tabla tokens_revocados.

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// 1. IMPORTAMOS LAS REGLAS DE VALIDACIÓN:
const { registrationValidationRules, validateUserRegistration } = require('../validators/userRegistration');

// POST /api/auth/register -> Crear nuevo usuario
// 2. INSERTAMOS LAS VALIDACIONES EN EL MEDIO DE LA RUTA:
router.post(
    '/register',
    registrationValidationRules, // Primero chequea las reglas (email válido, contraseña de 8 letras, etc.)
    validateUserRegistration, // Si hay errores, frena acá y avisa al usuario
    authController.register // Si todo está perfecto, recién ahí pasa al controlador
);

// POST /api/auth/login -> Autenticar usuario existente
router.post('/login', authController.login);

// POST /api/auth/logout -> Invalida el token actual (lo suma a tokens_revocados)
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
