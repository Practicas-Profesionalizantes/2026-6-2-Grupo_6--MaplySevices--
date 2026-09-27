// Registro, login, logout y borrado de cuenta.
// `usuario.id_rol` es FK a la tabla `rol`; el id que se asigna al registrarse
// sale de DEFAULT_ROL_ID en el .env (revisar con `SELECT * FROM rol;`).
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const ROL_POR_DEFECTO = Number(process.env.DEFAULT_ROL_ID) || 2;
const DURACION_TOKEN = '1d';
// Hash falso para comparar cuando el email no existe: así la respuesta tarda
// lo mismo y no se puede adivinar qué emails tienen cuenta midiendo el tiempo.
const HASH_FALSO = bcrypt.hashSync('maply-no-existe', 10);

function tokenDelHeader(req) {
  return req.headers.authorization.slice('Bearer '.length);
}

async function register(req, res) {
  const { nombre, email, contrasena, telefono } = req.body;
  try {
    const [existentes] = await pool.query('SELECT id_usuario FROM usuario WHERE email = ?', [email]);
    if (existentes.length > 0) {
      return res.status(409).json({ error: 'No se pudo crear la cuenta con ese email' });
    }
    const hash = await bcrypt.hash(contrasena, 12);
    const [resultado] = await pool.query(
      'INSERT INTO usuario (nombre, email, contrasena_hash, id_rol, telefono, activo) VALUES (?, ?, ?, ?, ?, 1)',
      [nombre, email, hash, ROL_POR_DEFECTO, telefono || null]
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
    const [filas] = await pool.query(
      'SELECT id_usuario, id_rol, nombre, email, contrasena_hash, fecha_registro FROM usuario WHERE email = ? AND activo = 1',
      [email]
    );
    const usuario = filas[0];
    const coincide = await bcrypt.compare(contrasena, usuario ? usuario.contrasena_hash : HASH_FALSO);
    if (!usuario || !coincide) return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const token = jwt.sign({ id_usuario: usuario.id_usuario, id_rol: usuario.id_rol }, process.env.JWT_SECRET, {
      expiresIn: DURACION_TOKEN,
      algorithm: 'HS256',
    });
    return res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        fecha_registro: usuario.fecha_registro,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

async function logout(req, res) {
  try {
    const token = tokenDelHeader(req);
    await pool.query(
      'INSERT INTO tokens_revocados (token, id_usuario, fecha_revocacion, fecha_expiracion) VALUES (?, ?, NOW(), ?)',
      [token, req.usuario.id_usuario, new Date(req.usuario.exp * 1000)]
    );
    // Limpieza: los tokens ya vencidos no hace falta seguir guardándolos.
    await pool.query('DELETE FROM tokens_revocados WHERE fecha_expiracion < NOW()');
    return res.json({ mensaje: 'Sesión cerrada' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al cerrar sesión' });
  }
}

// DELETE /api/auth/cuenta — borra al usuario. Las FK con ON DELETE CASCADE
// se llevan sus reportes, favoritos, notificaciones y tokens revocados.
async function borrarCuenta(req, res) {
  try {
    const [filas] = await pool.query('SELECT contrasena_hash FROM usuario WHERE id_usuario = ?', [req.usuario.id_usuario]);
    if (!filas[0] || !(await bcrypt.compare(req.body.contrasena, filas[0].contrasena_hash))) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    // Se borran explícitamente reportes y tokens por si en la base real
    // alguna FK no tiene ON DELETE CASCADE. Todo o nada (transacción).
    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();
      await conexion.query('DELETE FROM reporte WHERE id_usuario = ?', [req.usuario.id_usuario]);
      await conexion.query('DELETE FROM tokens_revocados WHERE id_usuario = ?', [req.usuario.id_usuario]);
      await conexion.query('DELETE FROM usuario WHERE id_usuario = ?', [req.usuario.id_usuario]);
      await conexion.commit();
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
    return res.json({ mensaje: 'Cuenta eliminada' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
}

module.exports = { register, login, logout, borrarCuenta };
