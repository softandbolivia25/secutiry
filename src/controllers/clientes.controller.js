const pool = require('../config/db')

// Controlador para obtener todos los clientes activos
const getClientes = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*, z.nombre AS zona_nombre
             FROM clientes c
             JOIN zonas z ON c.zona_id = z.id
             WHERE c.activo = true
             ORDER BY c.id`
        )
        res.json(result.rows)
    } catch (err) {
        console.error('Error al obtener clientes:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para obtener un cliente específico
const getClienteById = async (req, res) => {
    const { id } = req.params
    try {
        const result = await pool.query(
            `SELECT c.*, z.nombre AS zona_nombre
             FROM clientes c
             JOIN zonas z ON c.zona_id = z.id
             WHERE c.id = $1`,
            [id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' })
        }
        res.json(result.rows[0])
    } catch (err) {
        console.error('Error al obtener cliente:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para obtener clientes por zona
const getClientesByZona = async (req, res) => {
    const { zonaId } = req.params
    try {
        const result = await pool.query(
            `SELECT c.*, z.nombre AS zona_nombre
             FROM clientes c
             JOIN zonas z ON c.zona_id = z.id
             WHERE c.zona_id = $1 AND c.activo = true
             ORDER BY c.apellido, c.nombre`,
            [zonaId]
        )
        res.json(result.rows)
    } catch (err) {
        console.error('Error al obtener clientes por zona:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para crear clientes
const crearCliente = async (req, res) => {
    const { nombre, apellido, telefono, direccion, zona_id, monto_mensual, dia_vencimiento } = req.body

    if (!nombre || !apellido || !zona_id || !monto_mensual || !dia_vencimiento) {
        return res.status(400).json({ error: 'Los campos nombre, apellido, zona_id, monto_mensual y dia_vencimiento son requeridos' })
    }

    if (dia_vencimiento < 1 || dia_vencimiento > 31) {
        return res.status(400).json({ error: 'El día de vencimiento debe estar entre 1 y 31' })
    }

    try {
        const result = await pool.query(
            `INSERT INTO clientes (nombre, apellido, telefono, direccion, zona_id, monto_mensual, dia_vencimiento)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [nombre.trim(), apellido.trim(), telefono?.trim() || null, direccion?.trim() || null, zona_id, monto_mensual, dia_vencimiento]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error('Error al crear cliente:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para editar clientes
const editarCliente = async (req, res) => {
    const { id } = req.params
    const { nombre, apellido, telefono, direccion, zona_id, monto_mensual, dia_vencimiento } = req.body

    if (!nombre || !apellido || !zona_id || !monto_mensual || !dia_vencimiento) {
        return res.status(400).json({ error: 'Los campos nombre, apellido, zona_id, monto_mensual y dia_vencimiento son requeridos' })
    }

    if (dia_vencimiento < 1 || dia_vencimiento > 31) {
        return res.status(400).json({ error: 'El día de vencimiento debe estar entre 1 y 31' })
    }

    try {
        const result = await pool.query(
            `UPDATE clientes
             SET nombre = $1, apellido = $2, telefono = $3, direccion = $4, zona_id = $5, monto_mensual = $6, dia_vencimiento = $7
             WHERE id = $8 RETURNING *`,
            [nombre.trim(), apellido.trim(), telefono?.trim() || null, direccion?.trim() || null, zona_id, monto_mensual, dia_vencimiento, id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' })
        }
        res.json(result.rows[0])
    } catch (err) {
        console.error('Error al editar cliente:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para eliminar clientes (No elimina solo desactiva)
const desactivarCliente = async (req, res) => {
    const { id } = req.params
    try {
        const result = await pool.query(
            'UPDATE clientes SET activo = FALSE WHERE id = $1 RETURNING *',
            [id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' })
        }
        res.json({ mensaje: 'Cliente desactivado correctamente' })
    } catch (err) {
        console.error('Error al desactivar cliente:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

module.exports = {
    getClientes,
    getClienteById,
    getClientesByZona,
    crearCliente,
    editarCliente,
    desactivarCliente
}
