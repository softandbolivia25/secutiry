const pool = require('../config/db')

// Controlador para obtener todas las cobranzas
const getCobranzas = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT co.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, z.nombre AS zona_nombre
             FROM cobranzas co
             JOIN clientes c ON co.cliente_id = c.id
             JOIN zonas z ON c.zona_id = z.id
             ORDER BY co.fecha_vencimiento DESC`
        )
        res.json(result.rows)
    } catch (err) {
        console.error('Error al obtener cobranzas:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para obtener una cobranza específica
const getCobranzaById = async (req, res) => {
    const { id } = req.params
    try {
        const result = await pool.query(
            `SELECT co.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, z.nombre AS zona_nombre
             FROM cobranzas co
             JOIN clientes c ON co.cliente_id = c.id
             JOIN zonas z ON c.zona_id = z.id
             WHERE co.id = $1`,
            [id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cobranza no encontrada' })
        }
        res.json(result.rows[0])
    } catch (err) {
        console.error('Error al obtener cobranza:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para obtener cobranzas por cliente
const getCobranzasByCliente = async (req, res) => {
    const { clienteId } = req.params
    try {
        const result = await pool.query(
            `SELECT co.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
             FROM cobranzas co
             JOIN clientes c ON co.cliente_id = c.id
             WHERE co.cliente_id = $1
             ORDER BY co.fecha_vencimiento DESC`,
            [clienteId]
        )
        res.json(result.rows)
    } catch (err) {
        console.error('Error al obtener cobranzas del cliente:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para obtener cobranzas por estado (pendiente, pagado, vencido)
const getCobranzasByEstado = async (req, res) => {
    const { estado } = req.params
    const estadosValidos = ['pendiente', 'pagado', 'vencido']

    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido. Debe ser: pendiente, pagado o vencido' })
    }

    try {
        const result = await pool.query(
            `SELECT co.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, z.nombre AS zona_nombre
             FROM cobranzas co
             JOIN clientes c ON co.cliente_id = c.id
             JOIN zonas z ON c.zona_id = z.id
             WHERE co.estado = $1
             ORDER BY co.fecha_vencimiento DESC`,
            [estado]
        )
        res.json(result.rows)
    } catch (err) {
        console.error('Error al obtener cobranzas por estado:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para crear cobranzas
const crearCobranza = async (req, res) => {
    const { cliente_id, periodo, monto, fecha_vencimiento, observacion } = req.body

    if (!cliente_id || !periodo || !monto || !fecha_vencimiento) {
        return res.status(400).json({ error: 'Los campos cliente_id, periodo, monto y fecha_vencimiento son requeridos' })
    }

    try {
        const result = await pool.query(
            `INSERT INTO cobranzas (cliente_id, periodo, monto, fecha_vencimiento, observacion)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [cliente_id, periodo.trim(), monto, fecha_vencimiento, observacion?.trim() || null]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error('Error al crear cobranza:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para editar cobranzas
const editarCobranza = async (req, res) => {
    const { id } = req.params
    const { cliente_id, periodo, monto, fecha_vencimiento, observacion } = req.body

    if (!cliente_id || !periodo || !monto || !fecha_vencimiento) {
        return res.status(400).json({ error: 'Los campos cliente_id, periodo, monto y fecha_vencimiento son requeridos' })
    }

    try {
        const result = await pool.query(
            `UPDATE cobranzas
             SET cliente_id = $1, periodo = $2, monto = $3, fecha_vencimiento = $4, observacion = $5
             WHERE id = $6 RETURNING *`,
            [cliente_id, periodo.trim(), monto, fecha_vencimiento, observacion?.trim() || null, id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cobranza no encontrada' })
        }
        res.json(result.rows[0])
    } catch (err) {
        console.error('Error al editar cobranza:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para registrar pago
const registrarPago = async (req, res) => {
    const { id } = req.params
    const { fecha_pago, metodo_pago } = req.body

    if (!fecha_pago) {
        return res.status(400).json({ error: 'La fecha de pago es requerida' })
    }

    const metodo = metodo_pago || 'efectivo'
    const metodosValidos = ['efectivo', 'qr']
    if (!metodosValidos.includes(metodo)) {
        return res.status(400).json({ error: 'Método de pago inválido. Debe ser: efectivo o qr' })
    }

    try {
        const result = await pool.query(
            `UPDATE cobranzas
             SET estado       = 'pagado',
                 fecha_pago   = $1,
                 metodo_pago  = $2,
                 dias_mora    = GREATEST(0, $1::date - fecha_vencimiento)
             WHERE id = $3 RETURNING *`,
            [fecha_pago, metodo, id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cobranza no encontrada' })
        }
        res.json({ mensaje: 'Pago registrado correctamente', cobranza: result.rows[0] })
    } catch (err) {
        console.error('Error al registrar pago:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para eliminar cobranza
const eliminarCobranza = async (req, res) => {
    const { id } = req.params
    try {
        const result = await pool.query(
            'DELETE FROM cobranzas WHERE id = $1 RETURNING *',
            [id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cobranza no encontrada' })
        }
        res.json({ mensaje: 'Cobranza eliminada correctamente' })
    } catch (err) {
        console.error('Error al eliminar cobranza:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
};

// Generar cobranzas masivas para todos los clientes activos del mes actual
const generarCobranzasMes = async (req, res) => {
    const periodo = req.body.periodo || new Date().toISOString().slice(0, 7)

    try {
        const clientes = await pool.query(`
            SELECT id, monto_mensual, dia_vencimiento 
            FROM clientes 
            WHERE activo = true
        `)

        let generadas = 0
        let omitidas = 0

        for (const cliente of clientes.rows) {
            const fecha_vencimiento = `${periodo}-${String(cliente.dia_vencimiento).padStart(2, '0')}`

            try {
                await pool.query(`
                    INSERT INTO cobranzas (cliente_id, periodo, monto, fecha_vencimiento)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (cliente_id, periodo) DO NOTHING
                `, [cliente.id, periodo, cliente.monto_mensual, fecha_vencimiento])

                generadas++
            } catch {
                omitidas++
            }
        }

        res.json({
            mensaje: `Cobranzas generadas para el periodo ${periodo}`,
            generadas,
            omitidas,
        })
    } catch (err) {
        console.error('Error al generar cobranzas:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Actualizar estados vencidos
const actualizarVencidas = async () => {
    try {
        const result = await pool.query(`
            UPDATE cobranzas
            SET estado    = 'vencido',
                dias_mora = GREATEST(0, CURRENT_DATE - fecha_vencimiento)
            WHERE estado = 'pendiente'
              AND fecha_vencimiento < CURRENT_DATE
        `)
        console.log(`✅ Estados actualizados: ${result.rowCount} cobranzas vencidas`)
    } catch (err) {
        console.error('❌ Error al actualizar vencidas:', err.message)
    }
}

module.exports = {
    getCobranzas,
    getCobranzaById,
    getCobranzasByCliente,
    getCobranzasByEstado,
    crearCobranza,
    editarCobranza,
    registrarPago,
    eliminarCobranza,
    generarCobranzasMes,
    actualizarVencidas
};
