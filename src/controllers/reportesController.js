const pool = require('../config/db');

async function getReportes(req, res) {
  try {
    const [filas] = await pool.query(
      // Columnas explícitas: nunca devolver id_usuario (quién publicó cada reporte).
      `SELECT r.id_reporte, r.id_lugar, r.contenido, r.categoria_reporte, r.fecha_registro,
              l.nombre AS lugar_nombre, l.latitud AS lugar_latitud, l.longitud AS lugar_longitud
       FROM reporte r
       JOIN lugar l ON r.id_lugar = l.id_lugar
       WHERE r.activo = 1
       ORDER BY r.fecha_registro DESC
       LIMIT 200`
    );
    const reportes = filas.map(({ lugar_nombre, lugar_latitud, lugar_longitud, ...f }) => ({
      ...f,
      lugar: { nombre: lugar_nombre, latitud: lugar_latitud, longitud: lugar_longitud },
    }));
    res.json(reportes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los reportes' });
  }
}

async function getReporteById(req, res) {
  try {
    // Sin id_usuario, igual que en getReportes.
    const [filas] = await pool.query(
      `SELECT r.id_reporte, r.id_lugar, r.contenido, r.categoria_reporte, r.fecha_registro,
              l.nombre AS lugar_nombre, l.categoria AS lugar_categoria, l.latitud AS lugar_latitud, l.longitud AS lugar_longitud
       FROM reporte r
       JOIN lugar l ON r.id_lugar = l.id_lugar
       WHERE r.id_reporte = ? AND r.activo = 1`,
      [req.params.id]
    );
    if (!filas[0]) return res.status(404).json({ error: 'Reporte no encontrado' });
    const { lugar_nombre, lugar_categoria, lugar_latitud, lugar_longitud, ...reporte } = filas[0];
    res.json({
      ...reporte,
      lugar: { nombre: lugar_nombre, categoria: lugar_categoria, latitud: lugar_latitud, longitud: lugar_longitud },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el reporte' });
  }
}

async function crearReporte(req, res) {
  const { id_lugar, contenido, categoria_reporte } = req.body;
  try {
    // Un reporte por usuario por lugar por hora: frena el farmeo de karma
    // (cada reporte suma +1 por trigger) y que una sola persona domine el estado actual.
    const [recientes] = await pool.query(
      'SELECT 1 FROM reporte WHERE id_usuario = ? AND id_lugar = ? AND fecha_registro >= (NOW() - INTERVAL 1 HOUR) LIMIT 1',
      [req.usuario.id_usuario, id_lugar]
    );
    if (recientes.length > 0) {
      return res.status(429).json({ error: 'Ya reportaste este lugar en la última hora' });
    }
    const [resultado] = await pool.query(
      'INSERT INTO reporte (id_usuario, id_lugar, contenido, categoria_reporte, fecha_registro, activo) VALUES (?, ?, ?, ?, NOW(), 1)',
      [req.usuario.id_usuario, id_lugar, contenido ?? '', categoria_reporte]
    );
    res.status(201).json({ id_reporte: resultado.insertId, id_lugar, contenido, categoria_reporte });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Ese lugar no existe' });
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

// POST /api/reportes/:id/denuncias  { motivo }
// Cada usuario denuncia un reporte una sola vez. Con DENUNCIAS_PARA_OCULTAR
// denunciantes distintos el reporte se oculta solo (baja lógica, activo = 0) y
// queda en `denuncia` con estado 'pendiente' para que un admin lo revise.
// Lo exige Apple (guía 1.2) para apps con contenido publicado por usuarios.
// ponytail: umbral fijo; si hay abuso de denuncias, ponderar por karma del denunciante.
const DENUNCIAS_PARA_OCULTAR = 3;

async function denunciarReporte(req, res) {
  const id_reporte = req.params.id;
  try {
    const [reporte] = await pool.query('SELECT 1 FROM reporte WHERE id_reporte = ? AND activo = 1', [id_reporte]);
    if (!reporte[0]) return res.status(404).json({ error: 'Reporte no encontrado' });

    await pool.query(
      `INSERT INTO denuncia (id_reporte, id_usuario_denunciante, motivo)
       SELECT ?, ?, ? FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM denuncia WHERE id_reporte = ? AND id_usuario_denunciante = ?)`,
      [id_reporte, req.usuario.id_usuario, req.body.motivo, id_reporte, req.usuario.id_usuario]
    );

    const [[{ total }]] = await pool.query(
      "SELECT COUNT(DISTINCT id_usuario_denunciante) AS total FROM denuncia WHERE id_reporte = ? AND estado <> 'desestimada'",
      [id_reporte]
    );
    if (total >= DENUNCIAS_PARA_OCULTAR) {
      await pool.query('UPDATE reporte SET activo = 0 WHERE id_reporte = ?', [id_reporte]);
    }
    res.status(201).json({ mensaje: 'Gracias, vamos a revisar este reporte' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar la denuncia' });
  }
}

// --- "Ver traducción" -------------------------------------------------
// MyMemory: gratis y sin clave (límite ~5000 caracteres/día por IP). Para
// mejor calidad, cambiar solo esta función por DeepL o Google Translate.
// La app es es/en, así que el idioma de origen es "el otro".
async function traducirTexto(texto, idioma) {
  const origen = idioma === 'en' ? 'es' : 'en';
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=${origen}|${idioma}`;
  const respuesta = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const datos = await respuesta.json();
  if (datos.responseStatus !== 200 || !datos.responseData?.translatedText) {
    throw new Error(`MyMemory: ${datos.responseDetails || respuesta.status}`);
  }
  return datos.responseData.translatedText;
}

// GET /api/reportes/:id/traduccion?idioma=en — traduce una vez y guarda.
async function traducirReporte(req, res) {
  const { id } = req.params;
  const { idioma } = req.query;
  try {
    const [cache] = await pool.query('SELECT texto FROM traduccion_reporte WHERE id_reporte = ? AND idioma = ?', [id, idioma]);
    if (cache[0]) return res.json({ texto: cache[0].texto });

    const [filas] = await pool.query('SELECT contenido FROM reporte WHERE id_reporte = ? AND activo = 1', [id]);
    if (!filas[0]) return res.status(404).json({ error: 'Reporte no encontrado' });

    const texto = await traducirTexto(filas[0].contenido, idioma);
    await pool.query('INSERT IGNORE INTO traduccion_reporte (id_reporte, idioma, texto) VALUES (?, ?, ?)', [id, idioma, texto.slice(0, 1000)]);
    res.json({ texto });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'No se pudo traducir ahora. Probá más tarde.' });
  }
}

module.exports = { getReportes, getReporteById, crearReporte, getEstadoActualLugar, denunciarReporte, traducirReporte };
