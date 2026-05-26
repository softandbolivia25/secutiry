const pool = require('../config/db')
const XLSX = require('xlsx')

const importarClientes = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo' })
    }

    try {
        // Leer el Excel desde el buffer
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
        const hoja = workbook.Sheets[workbook.SheetNames[0]]
        const filas = XLSX.utils.sheet_to_json(hoja)

        if (filas.length === 0) {
            return res.status(400).json({ error: 'El archivo está vacío' })
        }

        let importados = 0
        let omitidos = 0
        const zonas_creadas = []
        const errores = []

        for (let i = 0; i < filas.length; i++) {
            const fila = filas[i]
            const nroFila = i + 2 // +2 porque la fila 1 es el header

            try {
                const { nombre, apellido, telefono, direccion, zona_id, monto_mensual, dia_vencimiento } = fila

                // Validar campos obligatorios
                if (!nombre || !apellido || !zona_id || !monto_mensual || !dia_vencimiento) {
                    errores.push(`Fila ${nroFila}: faltan campos obligatorios`)
                    omitidos++
                    continue
                }

                if (dia_vencimiento < 1 || dia_vencimiento > 31) {
                    errores.push(`Fila ${nroFila}: día de vencimiento inválido (${dia_vencimiento})`)
                    omitidos++
                    continue
                }

                // Buscar o crear la zona
                const nombreZona = String(zona_id).trim()
                let zonaResult = await pool.query(
                    'SELECT id FROM zonas WHERE LOWER(nombre) = LOWER($1)',
                    [nombreZona]
                )

                let zonaId
                if (zonaResult.rows.length > 0) {
                    zonaId = zonaResult.rows[0].id
                } else {
                    // Crear la zona automáticamente
                    const nuevaZona = await pool.query(
                        'INSERT INTO zonas (nombre) VALUES ($1) RETURNING id',
                        [nombreZona]
                    )
                    zonaId = nuevaZona.rows[0].id
                    if (!zonas_creadas.includes(nombreZona)) {
                        zonas_creadas.push(nombreZona)
                    }
                }

                // Insertar el cliente (ON CONFLICT para no duplicar)
                await pool.query(`
                    INSERT INTO clientes 
                        (nombre, apellido, telefono, direccion, zona_id, monto_mensual, dia_vencimiento)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT DO NOTHING
                `, [
                    String(nombre).trim(),
                    String(apellido).trim(),
                    telefono ? String(telefono).trim() : null,
                    direccion ? String(direccion).trim() : null,
                    zonaId,
                    Number(monto_mensual),
                    Number(dia_vencimiento)
                ])

                importados++

            } catch (err) {
                errores.push(`Fila ${nroFila}: ${err.message}`)
                omitidos++
            }
        }

        res.json({
            mensaje: `Importación completada`,
            total_filas: filas.length,
            importados,
            omitidos,
            zonas_creadas,
            errores: errores.slice(0, 20), // máximo 20 errores para no saturar
        })

    } catch (err) {
        console.error('Error al importar:', err.message)
        res.status(500).json({ error: 'Error al procesar el archivo Excel' })
    }
}

module.exports = { importarClientes }