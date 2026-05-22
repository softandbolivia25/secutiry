const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Controlador para registo de nuevo usuario
const register = async (req, res) => {
    const { nombre, email, password } = req.body;

    try {
        const userExist = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ error: 'El correo ya esta registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            `INSERT INTO usuarios (nombre, email, password_hash)
            VALUES ($1, $2, $3) RETURNING id, nombre, email`,
            [nombre, email, passwordHash]
        );

        const token = jwt.sign(
            { id: newUser.rows[0].id, nombre: newUser.rows[0].nombre },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            token: token,
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor al registrar' });
    }
};

// Controlador para login

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Credencial invalida' });
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Credencial invalidas' });
        }

        const token = jwt.sign(
            { id: user.id, nombre: user.nombre },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            mensaje: 'Login exitoso',
            toke: token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el servidor ' });
    }
};


module.exports = {
    register,
    login
};