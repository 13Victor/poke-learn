const express = require("express");
const router = express.Router();
const data = require("../data/dataLoader");

// Función para procesar el Pokédex antes de enviarlo al frontend
const processPokedex = () => {
  console.log("🔄 Procesando Pokédex en el backend...");

  const bannedTiers = ["Uber", "AG", "Illegal", "Unknown"];

  return Object.keys(data.pokedex.Pokedex)
    .filter((pokemon) => {
      const pokemonData = data.pokedex.Pokedex[pokemon];
      const formatData = data.formatsData.FormatsData[pokemon] || {};
      const tier = formatData.tier || "Unknown";
      const isNonstandard = formatData.isNonstandard || "";
      const battleOnly = pokemonData.battleOnly || null;

      // ❌ Excluir si el tier está en la lista de baneados
      if (bannedTiers.some((banned) => tier.includes(banned))) {
        console.log(`❌ ${pokemon} (${tier}) está baneado por tier.`);
        return false;
      }

      // ❌ Excluir si isNonstandard es "CAP"
      if (isNonstandard === "CAP") {
        console.log(`❌ ${pokemon} está baneado por isNonstandard: CAP.`);
        return false;
      }

      // ❌ Excluir si tiene battleOnly
      if (battleOnly) {
        console.log(
          `❌ ${pokemon} está baneado por battleOnly (${battleOnly}).`
        );
        return false;
      }

      return true;
    })
    .map((pokemon) => {
      const pokemonData = data.pokedex.Pokedex[pokemon];
      const formatData = data.formatsData.FormatsData[pokemon] || {};
      return {
        name: pokemonData.name,
        types: pokemonData.types.join(", "),
        abilities: Object.values(pokemonData.abilities).join(", "),
        stats: pokemonData.baseStats,
        tier: formatData.tier || "Unknown",
      };
    });
};

// Nueva ruta para devolver los Pokémon ya filtrados
router.get("/pokedex", (req, res) => {
  const filteredPokedex = processPokedex();
  res.json(filteredPokedex);
});

// Otras rutas
router.get("/moves", (req, res) => res.json(data.moves));
router.get("/items", (req, res) => res.json(data.items));
router.get("/formats", (req, res) => res.json(data.formats));
router.get("/formats-data", (req, res) => res.json(data.formatsData));

module.exports = router;
