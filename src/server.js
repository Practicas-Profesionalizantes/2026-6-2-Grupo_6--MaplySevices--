require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const lugaresRoutes = require('./routes/lugaresRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, mensaje: 'API de Maply Services corriendo' }));
app.use('/api/auth', authRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/lugares', lugaresRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Maply Services escuchando en http://localhost:${PORT}`);
});
