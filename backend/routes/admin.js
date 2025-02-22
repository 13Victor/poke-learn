const express = require('express');
const { createDatabase, fillItemTable } = require('../database/db');

const router = express.Router();

/* Ruta para crear la base de datos y sus tablas */
router.post('/create-db', async (req, res) => {
    const result = await createDatabase();
    if (result.error) {
        return res.status(500).json({ message: result.error });
    }
    res.json({ message: result.message });
});

/* Ruta para llenar la tabla item */
router.post('/fill-db/item', async (req, res) => {
    const result = await fillItemTable();
    if (result.error) {
        return res.status(500).json({ message: result.error });
    }
    res.json({ message: result.message });
});

module.exports = router;
