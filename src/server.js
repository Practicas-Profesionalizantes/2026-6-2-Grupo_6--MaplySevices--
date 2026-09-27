require('dotenv').config();

// Sin un secreto fuerte cualquiera puede fabricar tokens: mejor no arrancar.
const secreto = process.env.JWT_SECRET || '';
if (secreto.length < 32 || /cambi|ejemplo|random|texto/i.test(secreto)) {
  console.error('JWT_SECRET falta o es el de ejemplo. Generá uno con:');
  console.error('  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const lugaresRoutes = require('./routes/lugaresRoutes');

const app = express();
// Solo con un proxy real adelante (TRUST_PROXY=1 en el .env). Sin proxy, confiar
// en X-Forwarded-For deja que cualquiera invente su IP y esquive los rate limits.
app.set('trust proxy', Number(process.env.TRUST_PROXY) || false);
app.use(helmet()); // headers de seguridad + saca x-powered-by

// La app nativa no manda Origin, así que pasa. Solo se restringe la versión web (navegador).
const origenes = (process.env.CORS_ORIGINS || 'http://localhost:8081').split(',').map((o) => o.trim());
app.use(cors({ origin: (origin, cb) => cb(null, !origin || origenes.includes(origin)) }));

app.use(express.json({ limit: '10kb' }));
// Límite general: 100 pedidos por minuto por IP (login/registro tienen uno más estricto).
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));

app.get('/', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/lugares', lugaresRoutes);

app.use((req, res) => res.status(404).json({ error: 'No encontrado' }));
// Nunca devolver stack traces ni errores de la base al cliente.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Pedido demasiado grande' });
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Maply Services escuchando en http://localhost:${PORT}`);
});
