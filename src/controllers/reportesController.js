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

// GET /api/reportes/lugar/:id_lugar/estado-actual
// Algoritmo básico que resume/"promedia" los reportes de la última hora
// para un lugar: agrupa por categoria_reporte y toma la más repetida como
// el estado actual (ej: si 4 de 5 reportes de la última hora dicen
// "mucha_fila", el estado actual del lugar es "mucha_fila"). Se usa en la
// vista de detalle del lugar para mostrar la métrica de espera vigente,
// en vez de solo la lista cruda de reportes.
async function getEstadoActualLugar(req, res) {
  try {
    const { id_lugar } = req.params;
    const [filas] = await pool.query(
      `SELECT categoria_reporte, COUNT(*) AS total
       FROM reporte
       WHERE id_lugar = ? AND activo = 1 AND fecha_registro >= (NOW() - INTERVAL 1 HOUR)
       GROUP BY categoria_reporte
       ORDER BY total DESC`,
      [id_lugar]
    );

    if (filas.length === 0) {
      return res.json({
        id_lugar: Number(id_lugar),
        estado: null,
        total_reportes: 0,
        mensaje: 'Sin reportes en la última hora',
      });
    }

    const totalReportes = filas.reduce((acumulado, fila) => acumulado + fila.total, 0);
    res.json({
      id_lugar: Number(id_lugar),
      estado: filas[0].categoria_reporte, // categoría más repetida en la última hora
      total_reportes: totalReportes,
      desglose: filas, // por si el Frontend quiere mostrar el detalle, no solo el ganador
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calcular el estado actual del lugar' });
  }
}

module.exports = { getReportes, getReporteById, crearReporte, getEstadoActualLugar };
