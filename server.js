const express = require('express');
const cors = require('cors');

const pool = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');
const zonasRoutes = require('./src/routes/zonas.routes');
const clientesRoutes = require('./src/routes/clientes.routes');
const cobranzasRoutes = require('./src/routes/cobranzas.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/zonas', zonasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/cobranzas', cobranzasRoutes);


app.get('/', (req, res) => {
    res.send('API de Security funcionando correctamente');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});