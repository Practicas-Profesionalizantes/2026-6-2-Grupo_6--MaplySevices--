const pool = require('../config/db');

async function getReportes(req, res) {
  try {
    const [filas] = await pool.query(
      `SELECT r.*, l.nombre AS lugar_nombre, l.latitud AS lugar_latitud, l.longitud AS lugar_longitud
       FROM reporte r
       JOIN lugar l ON r.id_lugar = l.id_lugar
       WHERE r.activo = 1
       ORDER BY r.fecha_registro DESC`
    );
    const reportes = filas.map((f) => ({
      ...f,
      lugar: { nombre: f.lugar_nombre, latitud: f.lugar_latitud, longitud: f.lugar_longitud },
    }));
    res.json(reportes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los reportes' });
  }
}

async function getReporteById(req, res) {
  try {
    const [filas] = await pool.query('SELECT * FROM reporte WHERE id_reporte = ?', [req.params.id]);
    if (!filas[0]) return res.status(404).json({ error: 'Reporte no encontrado' });
    res.json(filas[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el reporte' });
  }
}

async function crearReporte(req, res) {
  const { id_lugar, contenido, categoria_reporte } = req.body;
  try {
    const [resultado] = await pool.query(
      'INSERT INTO reporte (id_usuario, id_lugar, contenido, categoria_reporte, fecha_registro, activo) VALUES (?, ?, ?, ?, NOW(), 1)',
      [req.usuario.id_usuario, id_lugar, contenido, categoria_reporte]
    );
    res.status(201).json({ id_reporte: resultado.insertId, id_lugar, contenido, categoria_reporte });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el reporte' });
  }
}

module.exports = { getReportes, getReporteById, crearReporte };
