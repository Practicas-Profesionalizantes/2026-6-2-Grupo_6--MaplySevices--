// Convierte una cuenta ya registrada en administrador (rol 3 = admin).
// La cuenta se crea normal desde la app; después se corre esto una vez.
//
// En la nube (Aiven), desde maply-backend/:
//   DB_HOST=<host> DB_PORT=<puerto> DB_USER=avnadmin node scripts/hacer-admin.js <email> ../ca.pem
// En local (XAMPP):
//   DB_HOST=localhost DB_USER=root DB_PASSWORD= node scripts/hacer-admin.js <email>
// Para sacarle el rol, agregar --quitar al final.
const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql2/promise');

async function main() {
  const args = process.argv.slice(2);
  const quitar = args.includes('--quitar');
  const [email, ca] = args.filter((a) => a !== '--quitar');
  if (!email || !process.env.DB_HOST) {
    console.log('Uso: DB_HOST=<host> DB_PORT=<puerto> DB_USER=<usuario> node scripts/hacer-admin.js <email> [ca.pem] [--quitar]');
    process.exit(1);
  }
  const password = process.env.DB_PASSWORD ?? (await preguntar('Contraseña de la base: '));
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'avnadmin',
    password,
    database: process.env.DB_NAME || 'maply_services',
    ssl: ca ? { ca: fs.readFileSync(ca, 'utf8') } : undefined,
  });
  const rol = quitar ? Number(process.env.DEFAULT_ROL_ID) || 2 : Number(process.env.ADMIN_ROL_ID) || 3;
  const [resultado] = await conexion.query('UPDATE usuario SET id_rol = ? WHERE email = ?', [rol, email.trim().toLowerCase()]);
  await conexion.end();
  if (resultado.affectedRows === 0) {
    console.log(`No hay ninguna cuenta con el email ${email}. Registrala primero desde la app.`);
    process.exit(1);
  }
  console.log(quitar ? `${email} ya no es administrador.` : `Listo: ${email} ahora es administrador.`);
}

function preguntar(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((ok) => rl.question(texto, (r) => { rl.close(); ok(r.trim()); }));
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
