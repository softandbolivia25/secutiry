const pool = require('../config/db');

//Controlador de resumen general del mes
// Devuelve: total a cobrar, total cobrado, cobranzas vencidas, total clientes activos
const getResumenGeneral = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(DISTINCT c.id) AS total_clientes,
                COALESCE(SUM(c.monto_mensual), 0) AS total_a_cobrar,
                COALESCE(SUM(CASE WHEN co.estado = 'pagado' THEN co.monto ELSE 0 END), 0) AS total_cobrado,
                COUNT(CASE WHEN co.estado = 'vencido' THEN 1 END) AS total_vencidas
            FROM clientes c
            LEFT JOIN cobranzas co
                   ON co.cliente_id = c.id
                  AND co.periodo = TO_CHAR(NOW(), 'YYYY-MM')
            WHERE c.activo = true
        `)
        res.json(result.rows[0])
    } catch (err) {
        console.error('Error en resumen general:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
};

// Controlador de recaudacion por zona
// Cobrado vs pendientes por zona en el mes actual
const getRecaudacionPorZona = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                z.id   AS zona_id,
                z.nombre AS zona,
                COUNT(c.id) AS total_clientes,
                COALESCE(SUM(c.monto_mensual), 0) AS total_a_cobrar,
                COALESCE(SUM(CASE WHEN co.estado = 'pagado' THEN co.monto ELSE 0 END), 0) AS total_cobrado,
                COALESCE(SUM(CASE WHEN co.estado IN ('pendiente', 'vencido') THEN co.monto ELSE 0 END), 0) AS total_pendiente,
                COALESCE(SUM(CASE WHEN co.estado = 'vencido' THEN co.monto ELSE 0 END), 0) AS total_vencido
            FROM zonas z
            LEFT JOIN clientes c ON c.zona_id = z.id AND c.activo = true
            LEFT JOIN cobranzas co ON co.cliente_id = c.id
                                  AND co.periodo = TO_CHAR(NOW(), 'YYYY-MM')
            WHERE z.activo = true
            GROUP BY z.id, z.nombre
            ORDER BY total_cobrado DESC
        `)
        res.json(result.rows)
    } catch (err) {
        console.error('Error en recaudación por zona:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador de estado de cobranzas del mes
// Cantidad y monto por estado: pendiente / pagado / vencido
const getEstadoDelMes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                estado,
                COUNT(*) AS cantidad,
                SUM(monto) AS monto_total
            FROM cobranzas
            WHERE periodo = TO_CHAR(NOW(), 'YYYY-MM')
            GROUP BY estado
            ORDER BY estado
        `)

        const estados = { pendiente: null, pagado: null, vencido: null }
        result.rows.forEach(r => { estados[r.estado] = r })

        const respuesta = Object.entries(estados).map(([estado, datos]) => ({
            estado,
            cantidad: Number(datos?.cantidad ?? 0),
            monto_total: Number(datos?.monto_total ?? 0),
        }))

        res.json(respuesta)
    } catch (err) {
        console.error('Error en estado del mes:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
};

// Controlador de evolucion mensual (ultimos 6 meses)
// Monto cobrado mes a mes
const getEvolucionMensual = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                periodo,
                TO_CHAR(TO_DATE(periodo, 'YYYY-MM'), 'Mon YYYY') AS periodo_label,
                COUNT(*) AS total_cobranzas,
                COALESCE(SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END), 0) AS total_cobrado,
                COALESCE(SUM(monto), 0) AS total_emitido
            FROM cobranzas
            WHERE periodo >= TO_CHAR(NOW() - INTERVAL '5 months', 'YYYY-MM')
              AND periodo <= TO_CHAR(NOW(), 'YYYY-MM')
            GROUP BY periodo
            ORDER BY periodo ASC
        `)
        res.json(result.rows)
    } catch (err) {
        console.error('Error en evolución mensual:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
};

// Controlador de TOP clientes morosos
// Clientes con mas dias de mora acumulados (max 10)
const getTopMorosos = async (req, res) => {
    const limite = parseInt(req.query.limite) || 10

    try {
        const result = await pool.query(`
            SELECT
                c.id AS cliente_id,
                c.nombre || ' ' || c.apellido AS cliente,
                c.telefono,
                z.nombre AS zona,
                COUNT(co.id) AS cobranzas_morosas,
                COALESCE(SUM(co.dias_mora), 0) AS dias_mora_total,
                COALESCE(MAX(co.dias_mora), 0) AS dias_mora_max,
                COALESCE(SUM(CASE WHEN co.estado = 'vencido' THEN co.monto ELSE 0 END), 0) AS monto_adeudado
            FROM clientes c
            JOIN zonas z ON z.id = c.zona_id
            JOIN cobranzas co ON co.cliente_id = c.id
            WHERE c.activo = true
              AND co.estado = 'vencido'
              AND co.dias_mora > 0
            GROUP BY c.id, c.nombre, c.apellido, c.telefono, z.nombre
            ORDER BY dias_mora_total DESC
            LIMIT $1
        `, [limite])

        res.json(result.rows)
    } catch (err) {
        console.error('Error en top morosos:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador de cobranzas proximas a vencer (proximos 7 dias)
// Lista de cobranzas pendientes que vencen pronto
const getProximasAVencer = async (req, res) => {
    const dias = parseInt(req.query.dias) || 7

    try {
        const result = await pool.query(`
            SELECT
                co.id AS cobranza_id,
                c.id AS cliente_id,
                c.nombre || ' ' || c.apellido AS cliente,
                c.telefono,
                z.nombre AS zona,
                co.periodo,
                co.monto,
                co.fecha_vencimiento,
                (co.fecha_vencimiento - CURRENT_DATE) AS dias_restantes
            FROM cobranzas co
            JOIN clientes c ON c.id = co.cliente_id
            JOIN zonas z ON z.id = c.zona_id
            WHERE co.estado = 'pendiente'
              AND co.fecha_vencimiento BETWEEN CURRENT_DATE AND (CURRENT_DATE + ($1 || ' days')::interval)
              AND c.activo = true
            ORDER BY co.fecha_vencimiento ASC
        `, [dias])

        res.json(result.rows)
    } catch (err) {
        console.error('Error en próximas a vencer:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

module.exports = {
    getResumenGeneral,
    getRecaudacionPorZona,
    getEstadoDelMes,
    getEvolucionMensual,
    getTopMorosos,
    getProximasAVencer
};