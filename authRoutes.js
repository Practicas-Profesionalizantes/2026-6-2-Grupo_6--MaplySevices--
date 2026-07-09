// src/routes/authRoutes.js
// Define las rutas HTTP de autenticación y las conecta con los controladores
// Las rutas NO contienen lógica de negocio: solo enlazan endpoints con ...

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 1. IMPORTAMOS LAS REGLAS DE VALIDACIÓN QUE CREASTE HOY:
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

module.exports = router;