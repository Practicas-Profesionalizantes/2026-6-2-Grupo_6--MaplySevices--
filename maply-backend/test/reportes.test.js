// Tests unitarios del controlador de reportes (SCRUM-353), sin base de datos:
// se reemplaza el pool de MySQL por uno falso antes de cargar el controlador.
// Correr con: npm test
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Pool falso: cada test define qué devuelve cada consulta.
const pool = { respuestas: [], consultas: [] };
pool.query = async (sql, params) => {
  pool.consultas.push({ sql, params });
  const r = pool.respuestas.shift();
  if (r instanceof Error) throw r;
  return [r ?? []];
};
require.cache[path.resolve(__dirname, '../src/config/db.js')] = { exports: pool };
const reportes = require('../src/controllers/reportesController');

function respuestaFalsa() {
  const res = { codigo: 200, cuerpo: null };
  res.status = (c) => ((res.codigo = c), res);
  res.json = (b) => ((res.cuerpo = b), res);
  return res;
}

function preparar(...respuestas) {
  pool.respuestas = respuestas;
  pool.consultas = [];
  return respuestaFalsa();
}

test('estado actual: sin reportes en la última hora devuelve estado null', async () => {
  const res = preparar([]);
  await reportes.getEstadoActualLugar({ params: { id_lugar: 3 } }, res);
  assert.strictEqual(res.cuerpo.estado, null);
  assert.strictEqual(res.cuerpo.total_reportes, 0);
});

test('estado actual: gana la categoría más reportada y suma el total', async () => {
  const res = preparar([
    { categoria_reporte: 'mucha_fila', total: 4 },
    { categoria_reporte: 'demora', total: 1 },
  ]);
  await reportes.getEstadoActualLugar({ params: { id_lugar: 3 } }, res);
  assert.strictEqual(res.cuerpo.estado, 'mucha_fila');
  assert.strictEqual(res.cuerpo.total_reportes, 5);
  assert.strictEqual(res.cuerpo.desglose.length, 2);
});

test('estado actual: si falla la base responde 500 sin detalles', async () => {
  const res = preparar(new Error('ECONNREFUSED'));
  const errorOriginal = console.error;
  console.error = () => {};
  await reportes.getEstadoActualLugar({ params: { id_lugar: 3 } }, res);
  console.error = errorOriginal;
  assert.strictEqual(res.codigo, 500);
  assert.doesNotMatch(res.cuerpo.error, /ECONNREFUSED/);
});

const pedidoReporte = { usuario: { id_usuario: 7 }, body: { id_lugar: 3, categoria_reporte: 'demora', contenido: 'Mucha gente' } };

test('crear reporte: un usuario no puede reportar el mismo lugar dos veces en una hora', async () => {
  const res = preparar([{ 1: 1 }]);
  await reportes.crearReporte(pedidoReporte, res);
  assert.strictEqual(res.codigo, 429);
  assert.strictEqual(pool.consultas.length, 1, 'no debe intentar el INSERT');
});

test('crear reporte: si no reportó en la última hora lo publica', async () => {
  const res = preparar([], { insertId: 87 });
  await reportes.crearReporte(pedidoReporte, res);
  assert.strictEqual(res.codigo, 201);
  assert.strictEqual(res.cuerpo.id_reporte, 87);
  assert.deepStrictEqual(pool.consultas[1].params.slice(0, 2), [7, 3]);
});

test('crear reporte: un lugar inexistente responde 400', async () => {
  const errorFk = Object.assign(new Error('fk'), { code: 'ER_NO_REFERENCED_ROW_2' });
  const res = preparar([], errorFk);
  await reportes.crearReporte(pedidoReporte, res);
  assert.strictEqual(res.codigo, 400);
});

test('listar reportes: nunca devuelve el id del autor', async () => {
  const res = preparar([
    { id_reporte: 1, id_lugar: 3, contenido: 'x', categoria_reporte: 'cerrado', fecha_registro: '2026-10-29', lugar_nombre: 'Banco', lugar_latitud: -34.6, lugar_longitud: -58.4 },
  ]);
  await reportes.getReportes({}, res);
  assert.ok(!('id_usuario' in res.cuerpo[0]));
  assert.strictEqual(res.cuerpo[0].lugar.nombre, 'Banco');
  assert.doesNotMatch(pool.consultas[0].sql, /id_usuario/);
});

const lugares = require('../src/controllers/lugaresController');

test('lugares: pagina con LIMIT/OFFSET y topea el límite en 100', async () => {
  const res = preparar([]);
  res.set = () => res;
  await lugares.getLugares({ query: { pagina: '3', limite: '500' } }, res);
  assert.deepStrictEqual(pool.consultas[0].params.slice(-2), [100, 200]);
});
