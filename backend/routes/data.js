const express = require("express");
const router = express.Router();
const data = require("../data/dataLoader");

router.get("/pokedex", (req, res) => res.json(data.pokedex));
router.get("/moves", (req, res) => res.json(data.moves));
router.get("/items", (req, res) => res.json(data.items));
router.get("/formats", (req, res) => res.json(data.formats));
router.get("/formats-data", (req, res) => res.json(data.formatsData));

module.exports = router;
