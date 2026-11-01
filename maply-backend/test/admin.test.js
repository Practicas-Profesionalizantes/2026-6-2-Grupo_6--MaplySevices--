// Tests del bloqueo de usuarios (SCRUM-369) con la base simulada.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

const pool = { respuesta: null, consultas: [] };
pool.query = async (sql, params) => (pool.consultas.push({ sql, params }), [pool.respuesta]);
require.cache[path.resolve(__dirname, '../src/config/db.js')] = { exports: pool };
const { bloquearUsuario } = require('../src/controllers/adminController');

const res = () => {
  const r = { codigo: 200 };
  r.status = (c) => ((r.codigo = c), r);
  r.json = (b) => ((r.cuerpo = b), r);
  return r;
};

test('bloquear pone activo = 0', async () => {
  pool.respuesta = { affectedRows: 1 };
  const r = res();
  await bloquearUsuario({ params: { id: 12 }, body: { bloqueado: true }, usuario: { id_usuario: 1 } }, r);
  assert.strictEqual(r.codigo, 200);
  assert.deepStrictEqual(pool.consultas.at(-1).params, [0, 12]);
});

test('un admin no puede bloquearse a sí mismo', async () => {
  const r = res();
  await bloquearUsuario({ params: { id: 1 }, body: { bloqueado: true }, usuario: { id_usuario: 1 } }, r);
  assert.strictEqual(r.codigo, 400);
});

test('usuario inexistente responde 404', async () => {
  pool.respuesta = { affectedRows: 0 };
  const r = res();
  await bloquearUsuario({ params: { id: 999 }, body: { bloqueado: false }, usuario: { id_usuario: 1 } }, r);
  assert.strictEqual(r.codigo, 404);
});
