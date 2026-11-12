// Tests de eliminar reportes (MVP-06 y MVP-07) con la base simulada.
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

test('eliminar: el autor elimina su propio reporte (baja lógica)', async () => {
  const res = preparar([{ id_usuario: 7 }], { affectedRows: 1 });
  await reportes.eliminarReporte({ params: { id: 87 }, usuario: autor }, res);
  assert.strictEqual(res.codigo, 200);
  assert.match(pool.consultas[1].sql, /UPDATE reporte SET activo = 0/);
  assert.strictEqual(pool.consultas.length, 2, 'no toca las denuncias');
});

test('eliminar: otro usuario no puede eliminar un reporte ajeno', async () => {
  const res = preparar([{ id_usuario: 7 }]);
  await reportes.eliminarReporte({ params: { id: 87 }, usuario: otro }, res);
  assert.strictEqual(res.codigo, 403);
  assert.strictEqual(pool.consultas.length, 1, 'no debe hacer el UPDATE');
});

test('eliminar: el administrador elimina cualquier reporte y resuelve sus denuncias', async () => {
  const res = preparar([{ id_usuario: 7 }], { affectedRows: 1 }, { affectedRows: 2 });
  await reportes.eliminarReporte({ params: { id: 87 }, usuario: admin }, res);
  assert.strictEqual(res.codigo, 200);
  assert.match(pool.consultas[2].sql, /UPDATE denuncia SET estado = 'revisada'/);
});

test('eliminar: un reporte inexistente o ya eliminado responde 404', async () => {
  const res = preparar([]);
  await reportes.eliminarReporte({ params: { id: 999 }, usuario: autor }, res);
  assert.strictEqual(res.codigo, 404);
});

const filaReporte = { id_reporte: 87, id_usuario: 7, id_lugar: 3, contenido: 'x', categoria_reporte: 'demora', fecha_registro: '2026-11-01', lugar_nombre: 'Banco', lugar_categoria: 'banco', lugar_latitud: 1, lugar_longitud: 2 };

test('detalle: el autor ve puede_eliminar y nunca se devuelve id_usuario', async () => {
  const res = preparar([filaReporte]);
  await reportes.getReporteById({ params: { id: 87 }, usuario: autor }, res);
  assert.strictEqual(res.cuerpo.es_propio, true);
  assert.strictEqual(res.cuerpo.puede_eliminar, true);
  assert.strictEqual('id_usuario' in res.cuerpo, false);
});

test('detalle: un visitante y otro usuario no pueden eliminar; el admin sí', async () => {
  let res = preparar([filaReporte]);
  await reportes.getReporteById({ params: { id: 87 } }, res);
  assert.strictEqual(res.cuerpo.puede_eliminar, false);
  res = preparar([filaReporte]);
  await reportes.getReporteById({ params: { id: 87 }, usuario: otro }, res);
  assert.strictEqual(res.cuerpo.puede_eliminar, false);
  res = preparar([filaReporte]);
  await reportes.getReporteById({ params: { id: 87 }, usuario: admin }, res);
  assert.strictEqual(res.cuerpo.puede_eliminar, true);
  assert.strictEqual(res.cuerpo.es_propio, false);
});
