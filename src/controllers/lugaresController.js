const pool = require('../config/db');

// Sin auth: elegir un lugar para reportar tiene que poder verse sin estar
// logueado (recién se pide login al efectivamente publicar el reporte).
async function getLugares(req, res) {
  try {
    const { categoria, q } = req.query;
    const condiciones = ['activo = 1'];
    const params = [];
    if (categoria) {
      condiciones.push('categoria = ?');
      params.push(categoria);
    }
    // Búsqueda por texto libre (nombre del lugar). Se usa desde el buscador
    // de "Elegir lugar" en el Frontend, con debounce del lado del cliente
    // para no mandar un request por cada tecla.
    if (q && q.trim()) {
      condiciones.push('nombre LIKE ?');
      params.push(`%${q.trim()}%`);
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

// POST /api/lugares — dar de alta un lugar nuevo. Requiere estar logueado
// (verifyToken en la ruta); no hace falta ser admin: cualquier usuario
// registrado puede proponer un lugar, en línea con el modelo comunitario
// de la app (ver "fase intermedia sin costo" de la auditoría de julio).
async function createLugar(req, res) {
  try {
    const { nombre, categoria, latitud, longitud, direccion } = req.body;
    if (!nombre || !categoria) {
      return res.status(400).json({ error: 'nombre y categoria son obligatorios' });
    }
    const [resultado] = await pool.query(
      'INSERT INTO lugar (nombre, categoria, latitud, longitud, direccion, activo) VALUES (?, ?, ?, ?, ?, 1)',
      [nombre, categoria, latitud ?? null, longitud ?? null, direccion ?? null]
    );
    res.status(201).json({
      id_lugar: resultado.insertId,
      nombre,
      categoria,
      latitud: latitud ?? null,
      longitud: longitud ?? null,
      direccion: direccion ?? null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el lugar' });
  }
}

module.exports = { getLugares, createLugar };
