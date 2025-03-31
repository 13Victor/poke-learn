const express = require("express");
const router = express.Router();
const data = require("../data/dataLoader");

const processPokedex = () => {
  const bannedTiers = ["Uber", "AG", "Illegal", "Unknown"];

  const validPokemon = Object.keys(data.pokedex.Pokedex).filter((pokemon) => {
    const pokemonData = data.pokedex.Pokedex[pokemon];
    const formatData = data.formatsData.FormatsData[pokemon] || {};
    const tier = formatData.tier || "Unknown";
    const isNonstandard = formatData.isNonstandard || "";
    const battleOnly = pokemonData.battleOnly || null;

    return !(
      bannedTiers.some((banned) => tier.includes(banned)) ||
      isNonstandard === "CAP" ||
      battleOnly
    );
  });

  const groupedByNum = validPokemon.reduce((acc, pokemon) => {
    const num = data.pokedex.Pokedex[pokemon].num;
    if (!acc[num]) acc[num] = [];
    acc[num].push(pokemon);
    return acc;
  }, {});

  return validPokemon.map((pokemon) => {
    const pokemonData = data.pokedex.Pokedex[pokemon];
    const formatData = data.formatsData.FormatsData[pokemon] || {};
    const num = pokemonData.num;

    const variantIndex = groupedByNum[num].indexOf(pokemon);
    const imageName =
      variantIndex === 0
        ? `${String(num).padStart(4, "0")}.png`
        : `${String(num).padStart(4, "0")}_${String(variantIndex).padStart(
            2,
            "0"
          )}.png`;

    return {
      num,
      name: pokemonData.name,
      image: imageName,
      level: 100,
      types: pokemonData.types, // 🔹 Ahora es un array
      abilities: Object.values(pokemonData.abilities), // 🔹 También en array
      stats: pokemonData.baseStats,
      tier: formatData.tier || "Unknown",
    };
  });
};

// Nueva ruta para devolver los Pokémon ya filtrados
router.get("/availablePokemons", (req, res) => {
  const filteredPokedex = processPokedex();
  res.json(filteredPokedex);
});

// Otras rutas

router.get("/pokedex", (req, res) => res.json(data.moves));
router.get("/moves", (req, res) => res.json(data.moves.Moves));
router.get("/items", (req, res) => res.json(data.items));
router.get("/formats", (req, res) => res.json(data.formats));
router.get("/formats-data", (req, res) => res.json(data.formatsData));
router.get("/learnsets", (req, res) => res.json(data.learnsets.Learnsets));

module.exports = router;
