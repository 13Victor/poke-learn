const express = require("express");
const {
  createDatabase,
  fillItemTable,
  fillAbilityTable,
  fillTypeTable,
  fillTypeEffectivenessTable,
  fillPokemonTable,
  fillMoveTable,
  fillPokemonMoveTable,
  fillPokemonAbilityTable,
} = require("../database/db");

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

// Ruta para llenar la tabla item
router.post("/fill-db/item", async (req, res) => {
  await handleDatabaseAction(fillItemTable, res);
});

// Ruta para llenar la tabla ability
router.post("/fill-db/ability", async (req, res) => {
  await handleDatabaseAction(fillAbilityTable, res);
});

// Ruta para llenar la tabla type
router.post("/fill-db/type", async (req, res) => {
  await handleDatabaseAction(fillTypeTable, res);
});

// Ruta para llenar la tabla typeEffectiveness
router.post("/fill-db/typeEffectiveness", async (req, res) => {
  await handleDatabaseAction(fillTypeEffectivenessTable, res);
});

// Ruta para llenar la tabla typeEffectiveness
router.post("/fill-db/pokemon", async (req, res) => {
  await handleDatabaseAction(fillPokemonTable, res);
});

router.post("/fill-db/move", async (req, res) => {
  await handleDatabaseAction(fillMoveTable, res);
});

router.post("/fill-db/pokemonMove", async (req, res) => {
  await handleDatabaseAction(fillPokemonMoveTable, res);
});

router.post("/fill-db/pokemonAbility", async (req, res) => {
  await handleDatabaseAction(fillPokemonAbilityTable, res);
});

module.exports = router;
