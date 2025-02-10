const express = require('express');
const router = express.Router();
const { authenticateUser, registerUser, isUserRegistered } = require('../database/db');

/* Ruta para iniciar sesión */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Rellene los campos' });
    }

    const result = await authenticateUser(email, password);
    if (result.error) {
        return res.status(401).json({ message: result.error });
    }

    res.json({ message: "Login exitoso", user: result.user });
});

/* Ruta para registrar un nuevo usuario */
router.post('/register', async (req, res) => {
    const { email, password, user_name } = req.body;

    if (!email || !password || !user_name) {
        return res.status(400).json({ message: 'Rellene todos los campos' });
    }

    const result = await isUserRegistered(email, user_name);
    if (result.error) {
        return res.status(401).json({ message: result.error });
    }

    const registerResult = await registerUser(email, password, user_name);
    if (registerResult.error) {
        return res.status(500).json({ message: registerResult.error });
    }

    res.json({ message: "Registro exitoso" });
});

module.exports = router;
