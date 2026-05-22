const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth');

//Ruta para registrar un nuevo usuario
router.post('/register', authController.register);

//Ruta para iniciar sesion
router.post('/login', authController.login);

module.exports = router;


