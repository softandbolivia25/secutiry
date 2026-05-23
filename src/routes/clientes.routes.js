const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getClientes, getClienteById, getClientesByZona, crearCliente, editarCliente, desactivarCliente } = require('../controllers/clientes.controller');



router.get('/', auth, getClientes)
router.get('/:id', auth, getClienteById)
router.get('/zona/:zonaId', auth, getClientesByZona)
router.post('/', auth, crearCliente)
router.put('/:id', auth, editarCliente)
router.delete('/:id', auth, desactivarCliente)

module.exports = router
