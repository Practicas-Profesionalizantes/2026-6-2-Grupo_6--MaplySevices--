// Este archivo ya existía en el repo (Documentación branch) pero estaba
// vacío — authRoutes.js ya lo importaba esperando estas dos exportaciones.
// Se completó acá con las reglas básicas de registro.
const { body, validationResult } = require('express-validator');

const registrationValidationRules = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().withMessage('Email inválido'),
  body('contrasena')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres'),
];

function validateUserRegistration(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }
  next();
}

module.exports = { registrationValidationRules, validateUserRegistration };
