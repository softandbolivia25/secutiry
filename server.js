const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { actualizarVencidas, generarCobranzasMes } = require('./src/controllers/cobranzas.controller');

const pool = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');
const zonasRoutes = require('./src/routes/zonas.routes');
const clientesRoutes = require('./src/routes/clientes.routes');
const cobranzasRoutes = require('./src/routes/cobranzas.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const importarRoutes = require('./src/routes/importar.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/zonas', zonasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/cobranzas', cobranzasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/importar', importarRoutes);

// Cada día a medianoche — actualiza estados vencidos
cron.schedule('0 0 * * *', () => {
    console.log('🔄 Cron: actualizando cobranzas vencidas...')
    actualizarVencidas()
})

// El 1ro de cada mes a las 00:01 — genera cobranzas nuevas
cron.schedule('1 0 1 * *', () => {
    console.log('🔄 Cron: generando cobranzas del mes...')
    generarCobranzasMes({ body: {} }, { json: console.log })
})

const ejecutarAlIniciar = async () => {
    console.log('🚀 Iniciando cálculos automáticos...')

    // 1. Actualizar cobranzas vencidas
    await actualizarVencidas()

    // 2. Verificar si ya se generaron las cobranzas del mes actual
    const periodoActual = new Date().toISOString().slice(0, 7)
    const { rows } = await require('./src/config/db').query(
        'SELECT COUNT(*) FROM cobranzas WHERE periodo = $1',
        [periodoActual]
    )

    if (parseInt(rows[0].count) === 0) {
        console.log(`📋 No hay cobranzas para ${periodoActual}, generando...`)
        await generarCobranzasMes(
            { body: { periodo: periodoActual } },
            { json: (data) => console.log(`✅ ${data.mensaje} — Generadas: ${data.generadas}`) }
        )
    } else {
        console.log(`✅ Cobranzas de ${periodoActual} ya existen (${rows[0].count} registros)`)
    }
}

// Ejecutar al iniciar
ejecutarAlIniciar().catch(err => console.error('Error al iniciar cálculos:', err.message))

app.get('/', (req, res) => {
    res.send('API de Security funcionando correctamente');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});