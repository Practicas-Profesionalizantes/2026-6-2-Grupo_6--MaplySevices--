// Solo para desarrollo: cambia la contraseña de una cuenta directo en la base
// (todavía no hay "olvidé mi contraseña" en la app).
// Uso: node scripts/reset-password.js tu@mail.com
require('dotenv').config();
const readline = require('readline/promises');
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

(async () => {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) throw new Error('Uso: node scripts/reset-password.js tu@mail.com');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const nueva = await rl.question('Contraseña nueva (8+ caracteres, letra y número): ');
  rl.close();
  // Mismas reglas que el registro (src/validators/userRegistration.js).
  if (nueva.length < 8 || nueva.length > 72 || !/[A-Za-z]/.test(nueva) || !/\d/.test(nueva)) {
    throw new Error('La contraseña debe tener entre 8 y 72 caracteres, con al menos una letra y un número');
  }

  const [r] = await pool.query('UPDATE usuario SET contrasena_hash = ? WHERE email = ?', [await bcrypt.hash(nueva, 12), email]);
  console.log(r.affectedRows ? 'Listo, ya podés iniciar sesión con la contraseña nueva.' : 'No existe una cuenta con ese email.');
})()
  .catch((e) => console.error(e.message))
  .finally(() => pool.end());
