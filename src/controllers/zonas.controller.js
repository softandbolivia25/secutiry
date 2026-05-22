/*const pool = require('../config/db')

// Controlador para obtener todas las zonas con totales del mes actual
const getZonas = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vista_zonas_totales')
        res.json(result.rows)
    } catch (err) {
        console.error('Error al obtener zonas:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para obtener una zona específica
const getZonaById = async (req, res) => {
    const { id } = req.params
    try {
        const result = await pool.query(
            'SELECT * FROM vista_zonas_totales WHERE zona_id = $1',
            [id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Zona no encontrada' })
        }
        res.json(result.rows[0])
    } catch (err) {
        console.error('Error al obtener zona:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para crear zonas
const crearZona = async (req, res) => {
    const { nombre } = req.body
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es requerido' })
    }
    try {
        const result = await pool.query(
            'INSERT INTO zonas (nombre) VALUES ($1) RETURNING *',
            [nombre.trim()]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error('Error al crear zona:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para editar zonas
const editarZona = async (req, res) => {
    const { id } = req.params
    const { nombre } = req.body
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es requerido' })
    }
    try {
        const result = await pool.query(
            'UPDATE zonas SET nombre = $1 WHERE id = $2 RETURNING *',
            [nombre.trim(), id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Zona no encontrada' })
        }
        res.json(result.rows[0])
    } catch (err) {
        console.error('Error al editar zona:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

// Controlador para eliminar zonas(No elimina solo desactiva)
const desactivarZona = async (req, res) => {
    const { id } = req.params
    try {
        const result = await pool.query(
            'UPDATE zonas SET activo = FALSE WHERE id = $1 RETURNING *',
            [id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Zona no encontrada' })
        }
        res.json({ mensaje: 'Zona desactivada correctamente' })
    } catch (err) {
        console.error('Error al desactivar zona:', err.message)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
};

module.exports = {
    getZonas,
    getZonaById,
    crearZona,
    editarZona,
    desactivarZona
};*/