// Verifica el JWT, que no esté en tokens_revocados (logout) y que el
// usuario siga existiendo y activo (si un admin lo bloquea, pierde acceso ya).
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Devuelve { usuario } si el token es válido, o { error } con el motivo.
async function leerUsuario(header) {
  if (!header || !header.startsWith('Bearer ')) return { error: 'Falta el token de autenticación' };

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    const [revocado] = await pool.query('SELECT id FROM tokens_revocados WHERE token = ?', [token]);
    if (revocado.length > 0) return { error: 'Sesión cerrada, iniciá sesión de nuevo' };

    const [usuario] = await pool.query('SELECT id_rol FROM usuario WHERE id_usuario = ? AND activo = 1', [payload.id_usuario]);
    if (!usuario[0]) return { error: 'Cuenta inactiva o eliminada' };

    // El rol se lee de la base, no del token: si cambia, rige al instante.
    return { usuario: { ...payload, id_rol: usuario[0].id_rol } };
  } catch (error) {
    return { error: 'Token inválido o expirado' };
  }
}

async function verifyToken(req, res, next) {
  const { usuario, error } = await leerUsuario(req.headers.authorization);
  if (error) return res.status(401).json({ error });
  req.usuario = usuario;
  next();
}

// Para rutas públicas que muestran algo extra a quien tiene sesión (por
// ejemplo, el botón "Eliminar" en sus propios reportes). Sin token, o con
// uno inválido, sigue como visitante en lugar de responder 401.
async function usuarioOpcional(req, res, next) {
  const { usuario } = await leerUsuario(req.headers.authorization);
  if (usuario) req.usuario = usuario;
  next();
}

module.exports = { verifyToken, usuarioOpcional };
