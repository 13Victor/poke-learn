const express = require("express");
const { createDatabase } = require("../database/db");

const router = express.Router();

// Función genérica para manejar acciones de la base de datos
const handleDatabaseAction = async (action, res) => {
  try {
    const result = await action();
    if (result.error) {
      return res.status(500).json({ message: result.error });
    }
    res.json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ruta para crear la base de datos y sus tablas
router.post("/create-db", async (req, res) => {
  await handleDatabaseAction(createDatabase, res);
});

module.exports = router;
