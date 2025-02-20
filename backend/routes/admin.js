const express = require('express');
const { createDatabase } = require('../database/db');

const router = express.Router();

/* Ruta para crear la base de datos y sus tablas */
router.post('/create-db', async (req, res) => {
    const result = await createDatabase();
    if (result.error) {
        return res.status(500).json({ message: result.error });
    }
    res.json({ message: result.message });
});

module.exports = router;
