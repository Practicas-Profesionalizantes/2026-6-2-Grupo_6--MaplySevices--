// Lo que los Términos le prometen al usuario registrado además de publicar:
// votar reportes, comentarlos, guardar lugares en favoritos y recibir una
// notificación cuando alguien reporta en uno de esos lugares.
const pool = require('../config/db');
const { esAdmin } = require('../config/roles');

// --- Votos -------------------------------------------------------------

// Totales de un reporte y el voto de quien mira (0 si no votó o no tiene sesión).
async function contarVotos(idReporte, idUsuario) {
  const [[fila]] = await pool.query(
    `SELECT COALESCE(SUM(valor = 1), 0) AS positivos,
            COALESCE(SUM(valor = -1), 0) AS negativos,
            COALESCE(MAX(CASE WHEN id_usuario = ? THEN valor END), 0) AS mio
     FROM voto_reporte WHERE id_reporte = ?`,
    [idUsuario ?? 0, idReporte]
  );
  return { votos_positivos: Number(fila.positivos), votos_negativos: Number(fila.negativos), mi_voto: Number(fila.mio) };
}

// PUT /api/reportes/:id/voto  { valor: 1 | -1 | 0 }   (0 = sacar el voto)
// Un voto por persona (clave primaria reporte + usuario): votar de nuevo lo cambia.
async function votarReporte(req, res) {
  const id = req.params.id;
  const yo = req.usuario.id_usuario;
  const { valor } = req.body;
  try {
    const [filas] = await pool.query('SELECT id_usuario FROM reporte WHERE id_reporte = ? AND activo = 1', [id]);
    if (!filas[0]) return res.status(404).json({ error: 'Reporte no encontrado' });
    if (filas[0].id_usuario === yo) return res.status(403).json({ error: 'No podés votar tu propio reporte' });

    if (valor === 0) {
      await pool.query('DELETE FROM voto_reporte WHERE id_reporte = ? AND id_usuario = ?', [id, yo]);
    } else {
      await pool.query(
        'INSERT INTO voto_reporte (id_reporte, id_usuario, valor) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE valor = ?, fecha = NOW()',
        [id, yo, valor, valor]
      );
    }
    res.json(await contarVotos(id, yo));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el voto' });
  }
}

// --- Comentarios -------------------------------------------------------

// GET /api/reportes/:id/comentarios — público. Igual que los reportes, nunca
// se devuelve quién escribió cada comentario: solo si es de quien mira.
async function getComentarios(req, res) {
  try {
    const [filas] = await pool.query(
      `SELECT id_comentario, id_usuario, contenido, fecha FROM comentario
       WHERE id_reporte = ? AND activo = 1 ORDER BY fecha ASC LIMIT 100`,
      [req.params.id]
    );
    const admin = esAdmin(req.usuario);
    res.json(
      filas.map(({ id_usuario, ...c }) => {
        const propio = !!req.usuario && req.usuario.id_usuario === id_usuario;
        return { ...c, es_propio: propio, puede_eliminar: propio || admin };
      })
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los comentarios' });
  }
}

// POST /api/reportes/:id/comentarios  { contenido }
async function crearComentario(req, res) {
  const id = req.params.id;
  try {
    const [reporte] = await pool.query('SELECT 1 FROM reporte WHERE id_reporte = ? AND activo = 1', [id]);
    if (!reporte[0]) return res.status(404).json({ error: 'Reporte no encontrado' });
    const [resultado] = await pool.query(
      'INSERT INTO comentario (id_reporte, id_usuario, contenido) VALUES (?, ?, ?)',
      [id, req.usuario.id_usuario, req.body.contenido]
    );
    res.status(201).json({
      id_comentario: resultado.insertId,
      contenido: req.body.contenido,
      fecha: new Date().toISOString(),
      es_propio: true,
      puede_eliminar: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al publicar el comentario' });
  }
}

// DELETE /api/reportes/:id/comentarios/:id_comentario — el autor o un admin (baja lógica).
async function eliminarComentario(req, res) {
  const { id, id_comentario } = req.params;
  try {
    const [filas] = await pool.query(
      'SELECT id_usuario FROM comentario WHERE id_comentario = ? AND id_reporte = ? AND activo = 1',
      [id_comentario, id]
    );
    if (!filas[0]) return res.status(404).json({ error: 'Comentario no encontrado' });
    if (filas[0].id_usuario !== req.usuario.id_usuario && !esAdmin(req.usuario)) {
      return res.status(403).json({ error: 'Solo podés eliminar tus propios comentarios' });
    }
    await pool.query('UPDATE comentario SET activo = 0 WHERE id_comentario = ?', [id_comentario]);
    res.json({ mensaje: 'Comentario eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el comentario' });
  }
}

// --- Favoritos ---------------------------------------------------------

// GET /api/favoritos — los lugares guardados, el último primero.
async function getFavoritos(req, res) {
  try {
    const [filas] = await pool.query(
      `SELECT l.id_lugar, l.nombre, l.categoria, l.latitud, l.longitud, l.direccion
       FROM favorito f JOIN lugar l ON l.id_lugar = f.id_lugar
       WHERE f.id_usuario = ? AND l.activo = 1
       ORDER BY f.fecha_guardado DESC`,
      [req.usuario.id_usuario]
    );
    res.json(filas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los favoritos' });
  }
}

// PUT /api/favoritos/:id_lugar — guardar (si ya estaba, no pasa nada).
// No se usa INSERT IGNORE porque también silenciaría el error de un lugar inexistente.
async function agregarFavorito(req, res) {
  try {
    await pool.query(
      'INSERT INTO favorito (id_usuario, id_lugar) VALUES (?, ?) ON DUPLICATE KEY UPDATE id_lugar = id_lugar',
      [req.usuario.id_usuario, req.params.id_lugar]
    );
    res.json({ id_lugar: req.params.id_lugar, favorito: true });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({ error: 'Lugar no encontrado' });
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el favorito' });
  }
}

// DELETE /api/favoritos/:id_lugar
async function quitarFavorito(req, res) {
  try {
    await pool.query('DELETE FROM favorito WHERE id_usuario = ? AND id_lugar = ?', [req.usuario.id_usuario, req.params.id_lugar]);
    res.json({ id_lugar: req.params.id_lugar, favorito: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al quitar el favorito' });
  }
}

// --- Notificaciones ----------------------------------------------------

// Se llama al publicar un reporte: avisa a quienes tienen ese lugar en
// favoritos (menos al autor). Si falla, el reporte igual queda publicado.
async function notificarFavoritos(idReporte, idLugar, idAutor) {
  try {
    await pool.query(
      `INSERT INTO notificacion (id_usuario, id_reporte, mensaje, tipo)
       SELECT f.id_usuario, ?, LEFT(CONCAT('Nuevo reporte en ', l.nombre), 255), 'reporte_favorito'
       FROM favorito f JOIN lugar l ON l.id_lugar = f.id_lugar
       WHERE f.id_lugar = ? AND f.id_usuario <> ?`,
      [idReporte, idLugar, idAutor]
    );
  } catch (error) {
    console.error('No se pudieron crear las notificaciones:', error.message);
  }
}

// GET /api/notificaciones — las últimas 50, con el lugar y la categoría del
// reporte para que la app arme el texto en el idioma elegido.
async function getNotificaciones(req, res) {
  try {
    const [filas] = await pool.query(
      `SELECT n.id_notificacion, n.id_reporte, n.tipo, n.leida, n.fecha_notificacion,
              l.nombre AS lugar_nombre, r.categoria_reporte
       FROM notificacion n
       LEFT JOIN reporte r ON r.id_reporte = n.id_reporte
       LEFT JOIN lugar l ON l.id_lugar = r.id_lugar
       WHERE n.id_usuario = ?
       ORDER BY n.fecha_notificacion DESC
       LIMIT 50`,
      [req.usuario.id_usuario]
    );
    res.json(filas.map((n) => ({ ...n, leida: !!n.leida })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las notificaciones' });
  }
}

// PATCH /api/notificaciones/leidas — marca todas como leídas.
async function marcarLeidas(req, res) {
  try {
    await pool.query('UPDATE notificacion SET leida = 1 WHERE id_usuario = ? AND leida = 0', [req.usuario.id_usuario]);
    res.json({ mensaje: 'Notificaciones leídas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar las notificaciones' });
  }
}

module.exports = {
  contarVotos,
  votarReporte,
  getComentarios,
  crearComentario,
  eliminarComentario,
  getFavoritos,
  agregarFavorito,
  quitarFavorito,
  notificarFavoritos,
  getNotificaciones,
  marcarLeidas,
};
