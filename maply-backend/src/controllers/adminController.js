const pool = require('../config/db');

// Bloquear = baja lógica (activo = 0). El middleware de auth ya rechaza las
// cuentas inactivas en cada pedido, así que el bloqueo rige al instante,
// aunque el usuario tenga un token vigente.
async function bloquearUsuario(req, res) {
  const id = req.params.id;
  const { bloqueado } = req.body;
  if (id === req.usuario.id_usuario) return res.status(400).json({ error: 'No podés bloquear tu propia cuenta' });
  try {
    const [resultado] = await pool.query('UPDATE usuario SET activo = ? WHERE id_usuario = ?', [bloqueado ? 0 : 1, id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ id_usuario: id, bloqueado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
}

module.exports = { bloquearUsuario };
