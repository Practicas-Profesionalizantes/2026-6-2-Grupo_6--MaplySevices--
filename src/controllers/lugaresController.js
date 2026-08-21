const pool = require('../config/db');

// Sin auth: elegir un lugar para reportar tiene que poder verse sin estar
// logueado (recién se pide login al efectivamente publicar el reporte).
async function getLugares(req, res) {
  try {
    const { categoria } = req.query;
    const condiciones = ['activo = 1'];
    const params = [];
    if (categoria) {
      condiciones.push('categoria = ?');
      params.push(categoria);
    }
    const [filas] = await pool.query(
      `SELECT id_lugar, nombre, categoria, latitud, longitud, direccion
       FROM lugar
       WHERE ${condiciones.join(' AND ')}
       ORDER BY nombre ASC`,
      params
    );
    res.json(filas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los lugares' });
  }
}

module.exports = { getLugares };
