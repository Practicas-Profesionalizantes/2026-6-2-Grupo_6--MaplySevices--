// Tests unitarios del controlador de lugares, sin base de datos:
// se reemplaza el pool de MySQL por uno falso antes de cargar el controlador.
// Correr con: npm test
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
const lugares = require('../src/controllers/lugaresController');

function respuestaFalsa() {
  const res = { codigo: 200, cuerpo: null, headers: {} };
  res.status = (c) => ((res.codigo = c), res);
  res.json = (b) => ((res.cuerpo = b), res);
  res.set = (k, v) => ((res.headers[k] = v), res);
  return res;
}

function preparar(...respuestas) {
  pool.respuestas = respuestas;
  pool.consultas = [];
  return respuestaFalsa();
}

test('listar: sin ubicación ordena por nombre y no calcula distancia', async () => {
  const res = preparar([{ id_lugar: 1, nombre: 'Banco' }]);
  await lugares.getLugares({ query: {} }, res);
  const { sql, params } = pool.consultas[0];
  assert.match(sql, /ORDER BY nombre ASC/);
  assert.doesNotMatch(sql, /distancia_km/);
  assert.deepStrictEqual(params, [100, 0]);
  assert.strictEqual(res.cuerpo.length, 1);
});

test('listar: con lat y lng ordena por cercanía', async () => {
  const res = preparar([]);
  await lugares.getLugares({ query: { lat: '-34.57', lng: '-58.48' } }, res);
  const { sql, params } = pool.consultas[0];
  assert.match(sql, /AS distancia_km/);
  assert.match(sql, /ORDER BY distancia_km IS NULL, distancia_km ASC/);
  assert.deepStrictEqual(params.slice(0, 3), [-34.57, -34.57, -58.48]);
});

test('listar: coordenadas inválidas se ignoran y vuelve al orden por nombre', async () => {
  const res = preparar([]);
  await lugares.getLugares({ query: { lat: '200', lng: 'abc' } }, res);
  assert.match(pool.consultas[0].sql, /ORDER BY nombre ASC/);
});

test('listar: combina cercanía con filtro de categoría y búsqueda', async () => {
  const res = preparar([]);
  await lugares.getLugares({ query: { lat: '-34.6', lng: '-58.4', categoria: 'hospital', q: 'Pirovano' } }, res);
  const { sql, params } = pool.consultas[0];
  assert.match(sql, /categoria = \?/);
  assert.match(sql, /nombre LIKE \?/);
  assert.deepStrictEqual(params, [-34.6, -34.6, -58.4, 'hospital', '%Pirovano%', 100, 0]);
});

test('listar: respeta la paginación', async () => {
  const res = preparar([]);
  await lugares.getLugares({ query: { pagina: '3', limite: '20' } }, res);
  assert.deepStrictEqual(pool.consultas[0].params, [20, 40]);
  assert.strictEqual(res.headers['X-Pagina'], '3');
});

test('crear lugar: devuelve 201 con el id nuevo', async () => {
  const res = preparar({ insertId: 42 });
  await lugares.createLugar({ body: { nombre: 'Farmacia Centro', categoria: 'comercio', latitud: -34.6, longitud: -58.4 } }, res);
  assert.strictEqual(res.codigo, 201);
  assert.strictEqual(res.cuerpo.id_lugar, 42);
  assert.strictEqual(res.cuerpo.direccion, null);
});

test('listar: si falla la base responde 500 sin detalles', async () => {
  const res = preparar(new Error('ECONNREFUSED'));
  const errorOriginal = console.error;
  console.error = () => {};
  await lugares.getLugares({ query: {} }, res);
  console.error = errorOriginal;
  assert.strictEqual(res.codigo, 500);
  assert.doesNotMatch(res.cuerpo.error, /ECONNREFUSED/);
});
