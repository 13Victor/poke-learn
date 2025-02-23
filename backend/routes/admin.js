const express = require("express");
const {
  createDatabase,
  fillItemTable,
  fillAbilityTable,
  fillTypeTable,
  fillTypeEffectivenessTable,
} = require("../database/db");

const router = express.Router();

/* Ruta para crear la base de datos y sus tablas */
router.post("/create-db", async (req, res) => {
  const result = await createDatabase();
  if (result.error) {
    return res.status(500).json({ message: result.error });
  }
  res.json({ message: result.message });
});

/* Ruta para llenar la tabla item */
router.post("/fill-db/item", async (req, res) => {
  const result = await fillItemTable();
  if (result.error) {
    return res.status(500).json({ message: result.error });
  }
  res.json({ message: result.message });
});

router.post("/fill-db/ability", async (req, res) => {
  const result = await fillAbilityTable();
  if (result.error) {
    return res.status(500).json({ message: result.error });
  }
  res.json({ message: result.message });
});

router.post("/fill-db/type", async (req, res) => {
  const result = await fillTypeTable();
  if (result.error) {
    return res.status(500).json({ message: result.error });
  }
  res.json({ message: result.message });
});

router.post("/fill-db/typeEffectiveness", async (req, res) => {
  const result = await fillTypeEffectivenessTable();
  if (result.error) {
    return res.status(500).json({ message: result.error });
  }
  res.json({ message: result.message });
});

module.exports = router;
