const express = require('express')
const router = express.Router()
const multer = require('multer')
const auth = require('../middlewares/auth')
const { importarClientes } = require('../controllers/importar.controller')

// Multer en memoria — no guarda el archivo en disco
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // máx 5MB
    fileFilter: (req, file, cb) => {
        const validos = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ]
        if (validos.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Solo se aceptan archivos .xlsx o .xls'))
        }
    }
})

router.post('/clientes', auth, upload.single('archivo'), importarClientes)

module.exports = router