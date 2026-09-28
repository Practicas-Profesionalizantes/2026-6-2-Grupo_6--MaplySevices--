// Reglas de validación. Todo lo que llega del cliente se chequea acá antes
// de tocar la base: tipo (string, no objeto), largo y formato.
const { body, param, validationResult } = require('express-validator');

// Mismos valores que los ENUM de la base (y que src/constants del Frontend).
const CATEGORIAS_REPORTE = ['mucha_fila', 'lugar_lleno', 'cerrado', 'demora', 'atencion_rapida', 'poco_movimiento', 'cambio_recorrido', 'otro'];
const CATEGORIAS_LUGAR = ['hospital', 'banco', 'restaurante', 'transporte', 'comercio', 'oficina_publica', 'otro'];

const email = () => body('email').isString().trim().isEmail().isLength({ max: 150 }).toLowerCase().withMessage('Email inválido');

const registrationValidationRules = [
  body('nombre').isString().trim().isLength({ min: 1, max: 100 }).withMessage('El nombre es obligatorio (máx. 100)'),
  email(),
  // bcrypt ignora lo que pasa de 72 bytes: se corta acá para que no haya sorpresas.
  body('contrasena')
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage('La contraseña debe tener entre 8 y 72 caracteres')
    .matches(/[A-Za-z]/)
    .withMessage('La contraseña debe tener al menos una letra y un número')
    .matches(/\d/)
    .withMessage('La contraseña debe tener al menos una letra y un número'),
  body('telefono').optional({ values: 'falsy' }).isString().trim().matches(/^[0-9+\-\s()]{6,20}$/).withMessage('Teléfono inválido'),
  body('acepta_terminos').equals('true').withMessage('Tenés que aceptar los términos y la política de privacidad'),
];

const loginRules = [email(), body('contrasena').isString().isLength({ min: 1, max: 72 })];

const olvideRules = [email()];
// La contraseña nueva sigue las mismas reglas que en el registro.
const restablecerRules = [
  email(),
  body('codigo').isString().trim().matches(/^\d{6}$/).withMessage('El código tiene 6 números'),
  registrationValidationRules[2],
];

const reporteRules = [
  body('id_lugar').isInt({ min: 1 }).toInt(),
  body('categoria_reporte').isIn(CATEGORIAS_REPORTE),
  body('contenido').optional({ values: 'null' }).isString().trim().isLength({ max: 500 }),
];

const lugarRules = [
  body('nombre').isString().trim().isLength({ min: 2, max: 150 }),
  body('categoria').isIn(CATEGORIAS_LUGAR),
  body('latitud').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }).toFloat(),
  body('longitud').optional({ values: 'null' }).isFloat({ min: -180, max: 180 }).toFloat(),
  body('direccion').optional({ values: 'null' }).isString().trim().isLength({ max: 255 }),
];

const denunciaRules = [body('motivo').isString().trim().isLength({ min: 3, max: 255 })];

const idParam = (nombre) => param(nombre).isInt({ min: 1 }).toInt();

function validateUserRegistration(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    // Solo el mensaje: no se devuelve el valor recibido (podría ser la contraseña).
    const { msg } = errores.array()[0];
    return res.status(400).json({ error: msg === 'Invalid value' ? 'Datos inválidos' : msg });
  }
  next();
}

module.exports = {
  registrationValidationRules,
  validateUserRegistration,
  validar: validateUserRegistration,
  loginRules,
  olvideRules,
  restablecerRules,
  reporteRules,
  lugarRules,
  denunciaRules,
  idParam,
};
