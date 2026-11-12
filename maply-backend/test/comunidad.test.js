// Tests de votos, comentarios, favoritos y notificaciones con la base simulada.
// Correr con: npm test
process.env.ADMIN_ROL_ID = '3';
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

const pool = { respuestas: [], consultas: [] };
pool.query = async (sql, params) => {
  pool.consultas.push({ sql, params });
  const r = pool.respuestas.shift();
  if (r instanceof Error) throw r;
  return [r ?? []];
};
require.cache[path.resolve(__dirname, '../src/config/db.js')] = { exports: pool };
const comunidad = require('../src/controllers/comunidadController');
const reportes = require('../src/controllers/reportesController');

function preparar(...respuestas) {
  pool.respuestas = respuestas;
  pool.consultas = [];
  const res = { codigo: 200, cuerpo: null };
  res.status = (c) => ((res.codigo = c), res);
  res.json = (b) => ((res.cuerpo = b), res);
  return res;
}
const autor = { id_usuario: 7, id_rol: 2 };
const otro = { id_usuario: 8, id_rol: 2 };
const admin = { id_usuario: 1, id_rol: 3 };

test('votar: no se puede votar el reporte propio', async () => {
  const res = preparar([{ id_usuario: 7 }]);
  await comunidad.votarReporte({ params: { id: 5 }, body: { valor: 1 }, usuario: autor }, res);
  assert.strictEqual(res.codigo, 403);
  assert.strictEqual(pool.consultas.length, 1, 'no debe guardar el voto');
});

test('votar: un voto nuevo se guarda (o reemplaza al anterior) y devuelve los totales', async () => {
  const res = preparar([{ id_usuario: 7 }], { affectedRows: 1 }, [{ positivos: '3', negativos: '1', mio: 1 }]);
  await comunidad.votarReporte({ params: { id: 5 }, body: { valor: 1 }, usuario: otro }, res);
  assert.match(pool.consultas[1].sql, /ON DUPLICATE KEY UPDATE/);
  assert.deepStrictEqual(res.cuerpo, { votos_positivos: 3, votos_negativos: 1, mi_voto: 1 });
});

test('votar: valor 0 saca el voto', async () => {
  const res = preparar([{ id_usuario: 7 }], { affectedRows: 1 }, [{ positivos: 0, negativos: 0, mio: 0 }]);
  await comunidad.votarReporte({ params: { id: 5 }, body: { valor: 0 }, usuario: otro }, res);
  assert.match(pool.consultas[1].sql, /^DELETE FROM voto_reporte/);
  assert.strictEqual(res.cuerpo.mi_voto, 0);
});

test('votar: un reporte inexistente responde 404', async () => {
  const res = preparar([]);
  await comunidad.votarReporte({ params: { id: 99 }, body: { valor: 1 }, usuario: otro }, res);
  assert.strictEqual(res.codigo, 404);
});

test('comentarios: nunca devuelven el id del autor y marcan cuál es propio', async () => {
  const res = preparar([
    { id_comentario: 1, id_usuario: 7, contenido: 'ya se normalizó', fecha: 'x' },
    { id_comentario: 2, id_usuario: 9, contenido: 'sigue igual', fecha: 'y' },
  ]);
  await comunidad.getComentarios({ params: { id: 5 }, usuario: autor }, res);
  assert.ok(res.cuerpo.every((c) => !('id_usuario' in c)));
  assert.deepStrictEqual(res.cuerpo.map((c) => c.es_propio), [true, false]);
  assert.deepStrictEqual(res.cuerpo.map((c) => c.puede_eliminar), [true, false]);
});

test('comentarios: el administrador puede eliminar cualquiera', async () => {
  const res = preparar([{ id_comentario: 2, id_usuario: 9, contenido: 'spam', fecha: 'y' }]);
  await comunidad.getComentarios({ params: { id: 5 }, usuario: admin }, res);
  assert.strictEqual(res.cuerpo[0].puede_eliminar, true);
});

test('comentar: en un reporte eliminado responde 404 sin insertar', async () => {
  const res = preparar([]);
  await comunidad.crearComentario({ params: { id: 5 }, body: { contenido: 'hola' }, usuario: otro }, res);
  assert.strictEqual(res.codigo, 404);
  assert.strictEqual(pool.consultas.length, 1);
});

test('comentar: publica y devuelve el comentario como propio', async () => {
  const res = preparar([{ 1: 1 }], { insertId: 40 });
  await comunidad.crearComentario({ params: { id: 5 }, body: { contenido: 'ya no hay fila' }, usuario: otro }, res);
  assert.strictEqual(res.codigo, 201);
  assert.strictEqual(res.cuerpo.id_comentario, 40);
  assert.deepStrictEqual(pool.consultas[1].params, [5, 8, 'ya no hay fila']);
});

test('eliminar comentario: otro usuario no puede, el admin sí', async () => {
  let res = preparar([{ id_usuario: 7 }]);
  await comunidad.eliminarComentario({ params: { id: 5, id_comentario: 40 }, usuario: otro }, res);
  assert.strictEqual(res.codigo, 403);

  res = preparar([{ id_usuario: 7 }], { affectedRows: 1 });
  await comunidad.eliminarComentario({ params: { id: 5, id_comentario: 40 }, usuario: admin }, res);
  assert.strictEqual(res.codigo, 200);
  assert.match(pool.consultas[1].sql, /UPDATE comentario SET activo = 0/);
});

test('favoritos: guardar un lugar inexistente responde 404', async () => {
  const errorFk = Object.assign(new Error('fk'), { code: 'ER_NO_REFERENCED_ROW_2' });
  const res = preparar(errorFk);
  await comunidad.agregarFavorito({ params: { id_lugar: 999 }, usuario: otro }, res);
  assert.strictEqual(res.codigo, 404);
});

test('favoritos: guardar dos veces el mismo lugar no falla', async () => {
  const res = preparar({ affectedRows: 0 });
  await comunidad.agregarFavorito({ params: { id_lugar: 3 }, usuario: otro }, res);
  assert.strictEqual(res.codigo, 200);
  assert.match(pool.consultas[0].sql, /ON DUPLICATE KEY UPDATE/);
});

test('publicar un reporte notifica a quienes tienen el lugar en favoritos, menos al autor', async () => {
  const res = preparar([], { insertId: 87 }, { affectedRows: 2 });
  await reportes.crearReporte({ body: { id_lugar: 3, categoria_reporte: 'demora', contenido: '' }, usuario: autor }, res);
  assert.strictEqual(res.codigo, 201);
  assert.match(pool.consultas[2].sql, /INSERT INTO notificacion/);
  assert.deepStrictEqual(pool.consultas[2].params, [87, 3, 7]);
});

test('si fallan las notificaciones, el reporte igual se publica', async () => {
  const res = preparar([], { insertId: 88 }, new Error('ER_NO_SUCH_TABLE'));
  await reportes.crearReporte({ body: { id_lugar: 3, categoria_reporte: 'demora', contenido: '' }, usuario: autor }, res);
  assert.strictEqual(res.codigo, 201);
});

test('notificaciones: solo las de quien pregunta, con leida como booleano', async () => {
  const res = preparar([{ id_notificacion: 1, id_reporte: 87, tipo: 'reporte_favorito', leida: 0, lugar_nombre: 'Banco', categoria_reporte: 'demora' }]);
  await comunidad.getNotificaciones({ usuario: otro }, res);
  assert.deepStrictEqual(pool.consultas[0].params, [8]);
  assert.strictEqual(res.cuerpo[0].leida, false);
});
