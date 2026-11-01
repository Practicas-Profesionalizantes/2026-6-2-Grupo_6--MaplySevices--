// Verifica el JWT, que no esté en tokens_revocados (logout) y que el
// usuario siga existiendo y activo (si un admin lo bloquea, pierde acceso ya).
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Falta el token de autenticación' });

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    const [revocado] = await pool.query('SELECT id FROM tokens_revocados WHERE token = ?', [token]);
    if (revocado.length > 0) return res.status(401).json({ error: 'Sesión cerrada, iniciá sesión de nuevo' });

    const [usuario] = await pool.query('SELECT id_rol FROM usuario WHERE id_usuario = ? AND activo = 1', [payload.id_usuario]);
    if (!usuario[0]) return res.status(401).json({ error: 'Cuenta inactiva o eliminada' });

    // El rol se lee de la base, no del token: si cambia, rige al instante.
    req.usuario = { ...payload, id_rol: usuario[0].id_rol };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { verifyToken };
