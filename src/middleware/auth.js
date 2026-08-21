// Verifica el JWT Y consulta la tabla tokens_revocados (la blacklist que
// ya diseñaron para el logout) antes de dar por válido un token.
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Falta el token de autenticación' });

  const token = header.replace('Bearer ', '');
  try {
    const [revocado] = await pool.query('SELECT id FROM tokens_revocados WHERE token = ?', [token]);
    if (revocado.length > 0) return res.status(401).json({ error: 'Token revocado, iniciá sesión de nuevo' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { verifyToken };
