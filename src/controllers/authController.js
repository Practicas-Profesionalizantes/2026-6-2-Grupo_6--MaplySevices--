// Este controlador no estaba subido al repo todavía (authRoutes.js ya lo
// importaba, pero controllers/authController.js no existía). Se armó acá
// para que las rutas de registro/login/logout que ya tenían diseñadas
// efectivamente funcionen.
//
// Ajustado a la base REAL de Brune (confirmado con DESCRIBE usuario / rol):
// `usuario` tiene `id_rol INT` que es FK a una tabla `rol` aparte
// (id_rol, nombre_rol, descripcion) — no un ENUM de texto. El id_rol que
// se asigna en el registro sale de DEFAULT_ROL_ID (.env), así el código no
// tiene que asumir a qué número corresponde "usuario común" en tu tabla
// rol — lo define quien la llenó. Revisá con `SELECT * FROM rol;` cuál es
// el id correcto y ajustalo en el .env si hace falta (por defecto: 2).
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const ROL_POR_DEFECTO = Number(process.env.DEFAULT_ROL_ID) || 2;

async function register(req, res) {
  const { nombre, email, contrasena, telefono } = req.body;
  try {
    const [existentes] = await pool.query('SELECT id_usuario FROM usuario WHERE email = ?', [email]);
    if (existentes.length > 0) {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }
    const hash = await bcrypt.hash(contrasena, 10);
    const [resultado] = await pool.query(
      'INSERT INTO usuario (nombre, email, contrasena_hash, id_rol, telefono, activo) VALUES (?, ?, ?, ?, ?, 1)',
      [nombre, email, hash, ROL_POR_DEFECTO, telefono ?? null]
    );
    return res.status(201).json({ id_usuario: resultado.insertId, nombre, email });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

async function login(req, res) {
  const { email, contrasena } = req.body;
  try {
    const [filas] = await pool.query('SELECT * FROM usuario WHERE email = ? AND activo = 1', [email]);
    const usuario = filas[0];
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });

    const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!coincide) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, id_rol: usuario.id_rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      token,
      usuario: { id_usuario: usuario.id_usuario, nombre: usuario.nombre, email: usuario.email },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

async function logout(req, res) {
  try {
    const token = req.headers.authorization.replace('Bearer ', '');
    const payload = jwt.decode(token);
    const expiracion = payload?.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO tokens_revocados (token, id_usuario, fecha_revocacion, fecha_expiracion) VALUES (?, ?, NOW(), ?)',
      [token, req.usuario.id_usuario, expiracion]
    );
    return res.json({ mensaje: 'Sesión cerrada' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al cerrar sesión' });
  }
}

module.exports = { register, login, logout };
