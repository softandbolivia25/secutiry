const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getCobranzas, getCobranzaById, getCobranzasByCliente, getCobranzasByEstado, crearCobranza, editarCobranza, registrarPago, eliminarCobranza } = require('../controllers/cobranzas.controller');



router.get('/', auth, getCobranzas)
router.get('/:id', auth, getCobranzaById)
router.get('/cliente/:clienteId', auth, getCobranzasByCliente)
router.get('/estado/:estado', auth, getCobranzasByEstado)
router.post('/', auth, crearCobranza)
router.put('/:id', auth, editarCobranza)
router.patch('/:id/pago', auth, registrarPago)
router.delete('/:id', auth, eliminarCobranza)

module.exports = router
