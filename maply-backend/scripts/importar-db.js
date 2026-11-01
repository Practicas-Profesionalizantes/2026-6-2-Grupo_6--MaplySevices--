// Importa un dump .sql (por ejemplo, el exportado de XAMPP con mysqldump)
// en una base MySQL en la nube (Aiven). Se usa una sola vez al hacer el deploy.
//
// Uso (desde maply-backend/, después de npm install):
//   DB_HOST=<host> DB_PORT=<puerto> DB_USER=avnadmin node scripts/importar-db.js <archivo.sql> [ca.pem]
// La contraseña se pide por consola para que no quede en el historial.
const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql2/promise');

async function main() {
  const [archivo, ca] = process.argv.slice(2);
  if (!archivo || !process.env.DB_HOST) {
    console.log('Uso: DB_HOST=<host> DB_PORT=<puerto> DB_USER=<usuario> node scripts/importar-db.js <archivo.sql> [ca.pem]');
    process.exit(1);
  }
  const password = process.env.DB_PASSWORD ?? await preguntar('Contraseña de la base: ');

  // mysqldump usa "DELIMITER ;;" para los triggers; el servidor no entiende
  // esa palabra (es del cliente de consola), así que se saca antes de enviar.
  const sql = fs.readFileSync(archivo, 'utf8')
    .split(/\r?\n/)
    .filter((linea) => !/^DELIMITER\s/i.test(linea.trim()))
    .join('\n')
    .replace(/;;/g, ';');

  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'avnadmin',
    password,
    charset: 'utf8mb4',
    multipleStatements: true,
    ssl: ca ? { ca: fs.readFileSync(ca, 'utf8') } : undefined,
  });
  console.log('Conectado. Importando...');
  await conexion.query(sql);
  const [tablas] = await conexion.query('SHOW TABLES FROM maply_services');
  const [[lugares]] = await conexion.query('SELECT COUNT(*) AS total FROM maply_services.lugar');
  console.log(`Listo: ${tablas.length} tablas, ${lugares.total} lugares.`);
  await conexion.end();
}

function preguntar(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((ok) => rl.question(texto, (r) => { rl.close(); ok(r.trim()); }));
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
