// Conexión a MySQL (XAMPP) usando un pool — evita abrir/cerrar una
// conexión nueva en cada request.
require('dotenv').config();
const mysql = require('mysql2/promise');

// En producción (Aiven) la base usa otro puerto y exige conexión cifrada:
// DB_PORT y DB_SSL_CA (el certificado "CA certificate" que da Aiven, pegado
// completo en la variable). En local con XAMPP no hace falta ninguno.
const ssl = process.env.DB_SSL_CA
  ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  // Explícito a propósito: si el SQL se importó con un cliente que no
  // declaró bien el charset (pasó en las pruebas, con phpMyAdmin/CLI en
  // modo latin1 por defecto), esto evita que además la lectura desde
  // Node vuelva a mezclar codificaciones con los acentos.
  charset: 'utf8mb4',
  ssl,
});

module.exports = pool;
