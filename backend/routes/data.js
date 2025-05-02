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

    return !(bannedTiers.some((banned) => tier.includes(banned)) || isNonstandard === "CAP" || battleOnly);
  });

  const groupedByNum = validPokemon.reduce((acc, pokemon) => {
    const num = data.pokedex.Pokedex[pokemon].num;
    if (!acc[num]) acc[num] = [];
    acc[num].push(pokemon);
    return acc;
  }, {});

  const cleanName = (name) => name.toLowerCase().replace(/[-\s]/g, "");

  return validPokemon.map((pokemon) => {
    const pokemonData = data.pokedex.Pokedex[pokemon];
    const formatData = data.formatsData.FormatsData[pokemon] || {};
    const num = pokemonData.num;

    const variantIndex = groupedByNum[num].indexOf(pokemon);
    const imageName =
      variantIndex === 0
        ? `${String(num).padStart(4, "0")}.webp`
        : `${String(num).padStart(4, "0")}_${String(variantIndex).padStart(2, "0")}.webp`;

    return {
      num,
      name: pokemonData.name,
      id: pokemon,
      image: imageName,
      level: 100,
      changesFrom: pokemonData.changesFrom ? cleanName(pokemonData.changesFrom) : "",
      types: pokemonData.types,
      abilities: Object.values(pokemonData.abilities),
      baseStats: pokemonData.baseStats,
      tier: formatData.tier || "Unknown",
    };
  });
};

// Process items to combine data and descriptions, with filtering
const processItems = () => {
  const items = data.items.Items;
  const itemDescriptions = data.itemsDesc.ItemsText;
  const filteredItems = {};

  // Filter out unwanted items
  for (const itemId in items) {
    const item = items[itemId];
    const isNonstandard = item.isNonstandard || "";

    // Skip items with unwanted isNonstandard values or specific banned items
    if (["Past", "CAP", "Unobtainable"].includes(isNonstandard) || itemId === "kingsrock" || itemId === "razorfang") {
      continue;
    }

    // Add description data to the item
    const itemWithDesc = { ...item };
    if (itemDescriptions[itemId]) {
      itemWithDesc.shortDesc = itemDescriptions[itemId].shortDesc || "";
      itemWithDesc.desc = itemDescriptions[itemId].desc || "";
    } else {
      itemWithDesc.shortDesc = "";
      itemWithDesc.desc = "";
    }

    // Add the key as a property so it's easier to work with on the frontend
    itemWithDesc.key = itemId;

    filteredItems[itemId] = itemWithDesc;
  }

  return filteredItems;
};

// Process abilities with descriptions and filtering out banned abilities
const processPokemonAbilities = () => {
  const pokemonData = data.pokedex.Pokedex;
  const abilitiesDesc = data.abilitiesDesc.AbilitiesText;
  const abilitiesDescArray = Object.values(abilitiesDesc);
  const bannedAbilities = ["arenatrap", "moody", "sandveil", "shadowtag", "snowcloak"];

  const result = {};

  for (const pokemonId in pokemonData) {
    const pokemon = pokemonData[pokemonId];
    const abilities = pokemon.abilities || {};

    const abilitiesWithDesc = {};

    for (const abilitySlot in abilities) {
      const abilityName = abilities[abilitySlot];

      // Skip banned abilities
      if (bannedAbilities.includes(abilityName.toLowerCase().replace(/\s|-/g, ""))) {
        continue;
      }

      // Buscar el objeto de la habilidad por .name
      const abilityDescData = abilitiesDescArray.find((a) => a.name.toLowerCase() === abilityName.toLowerCase()) || {};

      const description = abilityDescData.shortDesc || abilityDescData.desc || "";

      abilitiesWithDesc[abilitySlot] = [abilityName, description];
    }

    result[pokemonId] = {
      abilities: abilitiesWithDesc,
    };
  }

  return result;
};

// Process moves with descriptions and filtering
const processFilteredMoves = () => {
  const moves = data.moves.Moves;
  // Check if movesDesc exists before trying to access MovesText
  const movesDesc = data.movesDesc && data.movesDesc.MovesText ? data.movesDesc.MovesText : {};
  const bannedMoves = ["batonpass", "lastrespects", "shedtail"];
  const filteredMoves = {};

  for (const moveId in moves) {
    // Skip banned moves
    if (bannedMoves.includes(moveId)) {
      continue;
    }

    const moveData = moves[moveId];
    const moveDescData = movesDesc[moveId] || {};

    // Create a new move object with descriptions properly included
    filteredMoves[moveId] = {
      ...moveData,
      id: moveId,

      // Use description from MovesText if available, otherwise use from the original move data
      shortDesc: moveDescData.shortDesc || moveData.shortDesc || "",
      desc: moveDescData.desc || moveData.desc || "",
    };

    // Debug log to check if descriptions are being included
    if (!filteredMoves[moveId].shortDesc && !filteredMoves[moveId].desc) {
      console.debug(`Move ${moveId} has no description`);
    }
  }

  console.log(`Processed ${Object.keys(filteredMoves).length} moves with descriptions`);
  return filteredMoves;
};

// Add a dedicated endpoint for move descriptions
router.get("/moves-desc", (req, res) => {
  if (!data.movesDesc || !data.movesDesc.MovesText) {
    console.warn("Warning: Move descriptions data not found!");
    return res.json({});
  }

  // Send the move descriptions directly
  res.json(data.movesDesc.MovesText);
});

// Process move descriptions separately for the specific endpoint
const processMoveDescriptions = () => {
  // Make sure data.movesDesc and MovesText exist
  if (!data.movesDesc || !data.movesDesc.MovesText) {
    console.warn("Warning: Move descriptions data not found!");
    return {};
  }

  return data.movesDesc.MovesText;
};

// Nueva ruta para devolver los Pokémon ya filtrados
router.get("/availablePokemons", (req, res) => {
  const filteredPokedex = processPokedex();
  res.json(filteredPokedex);
});

// Nueva ruta optimizada para items que combina datos y descripciones
router.get("/items", (req, res) => {
  const processedItems = processItems();
  res.json(processedItems);
});

// Nuevo endpoint para habilidades con descripciones (filtrado)
router.get("/abilities", (req, res) => {
  const abilitiesWithDesc = processPokemonAbilities();
  res.json(abilitiesWithDesc);
});

// Ruta de moves ahora con filtrado
router.get("/moves", (req, res) => {
  const filteredMoves = processFilteredMoves();
  res.json(filteredMoves);
});

// Dedicated endpoint for move descriptions
router.get("/moves-desc", (req, res) => {
  const moveDescriptions = processMoveDescriptions();
  res.json(moveDescriptions);
});

// Rutas originales mantenidas por compatibilidad, pero con filtrado añadido
router.get("/pokedex", (req, res) => res.json(data.moves));
router.get("/abilities-raw", (req, res) => res.json(data.abilities.Abilities));
router.get("/abilities-desc", (req, res) => res.json(data.abilitiesDesc.AbilitiesText));
router.get("/items-raw", (req, res) => res.json(data.items.Items));
router.get("/items-desc", (req, res) => res.json(data.itemsDesc.ItemsText));
router.get("/formats", (req, res) => res.json(data.formats));
router.get("/formats-data", (req, res) => res.json(data.formatsData));
router.get("/learnsets", (req, res) => res.json(data.learnsets.Learnsets));
router.get("/types", (req, res) => res.json(data.types));

module.exports = router;
