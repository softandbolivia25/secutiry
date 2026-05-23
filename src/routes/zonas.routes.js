const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getZonas, getZonaById, crearZona, editarZona, desactivarZona } = require('../controllers/zonas.controller');



router.get('/', auth, getZonas)
router.get('/:id', auth, getZonaById)
router.post('/', auth, crearZona)
router.put('/:id', auth, editarZona)
router.delete('/:id', auth, desactivarZona)

module.exports = router