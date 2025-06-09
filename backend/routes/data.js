/**
 * Rutas para acceso a datos del juego
 */
const express = require("express");
const { formatResponse } = require("../utils/helpers");
const router = express.Router();

// Cargar los datos
const data = require("../data/dataLoader");

/**
 * Procesa el Pokédex para filtrar y dar formato a los datos (versión competitiva)
 * @returns {Array} - Pokémon filtrados y formateados para competitivo
 */
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
      baseSpecies: pokemonData.baseSpecies || null,
      baseForme: pokemonData.baseForme || null,

      genderRatio: pokemonData.genderRatio || undefined, // Para casos como { M: 0.875, F: 0.125 }
      gender: pokemonData.gender || undefined, // Para casos como "M", "F", "N"
      height: pokemonData.heightm || 0, // altura en metros
      weight: pokemonData.weightkg || 0, // peso en kg
    };
  });
};

/**
 * Procesa TODOS los Pokémon excepto CAP
 * @returns {Array} - Todos los Pokémon filtrados y formateados
 */
const processAllPokemons = () => {
  // Solo filtrar CAP y Pokémon con num <= 0
  const validPokemon = Object.keys(data.pokedex.Pokedex).filter((pokemon) => {
    const pokemonData = data.pokedex.Pokedex[pokemon];
    const formatData = data.formatsData.FormatsData[pokemon] || {};
    const isNonstandard = formatData.isNonstandard || "";
    const num = pokemonData.num;

    // Solo excluir CAP y Pokémon con num <= 0
    return isNonstandard !== "CAP" && num > 0;
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
      baseSpecies: pokemonData.baseSpecies || null,
      baseForme: pokemonData.baseForme || null,

      genderRatio: pokemonData.genderRatio || undefined, // Para casos como { M: 0.875, F: 0.125 }
      gender: pokemonData.gender || undefined, // Para casos como "M", "F", "N"
      height: pokemonData.heightm || 0, // altura en metros
      weight: pokemonData.weightkg || 0, // peso en kg

      prevo: pokemonData.prevo || null, // Pokémon del que evoluciona
      evos: pokemonData.evos || null, // Array de Pokémon a los que puede evolucionar
      evoType: pokemonData.evoType || null, // Tipo de evolución (levelUp, useItem, trade, etc.)
      evoLevel: pokemonData.evoLevel || null, // Nivel requerido para evolución
      evoItem: pokemonData.evoItem || null, // Item requerido para evolución
      evoCondition: pokemonData.evoCondition || null, // Condición especial para evolución
      evoMove: pokemonData.evoMove || null, // Movimiento requerido para evolución
    };
  });
};

/**
 * Procesa los items para combinar datos y descripciones, con filtrado
 * @returns {Object} - Items procesados
 */
const processItems = () => {
  const items = data.items.Items;
  const itemDescriptions = data.itemsDesc.ItemsText;
  const filteredItems = {};

  // Filtrar items no deseados
  for (const itemId in items) {
    const item = items[itemId];
    const isNonstandard = item.isNonstandard || "";

    // Omitir items con valores isNonstandard no deseados o items específicos prohibidos
    if (["Past", "CAP", "Unobtainable"].includes(isNonstandard) || itemId === "kingsrock" || itemId === "razorfang") {
      continue;
    }

    // Añadir datos de descripción al item
    const itemWithDesc = { ...item };
    if (itemDescriptions[itemId]) {
      itemWithDesc.shortDesc = itemDescriptions[itemId].shortDesc || "";
      itemWithDesc.desc = itemDescriptions[itemId].desc || "";
    } else {
      itemWithDesc.shortDesc = "";
      itemWithDesc.desc = "";
    }

    // Añadir la clave como propiedad para facilitar su uso en el frontend
    itemWithDesc.key = itemId;

    filteredItems[itemId] = itemWithDesc;
  }

  return filteredItems;
};

/**
 * Procesa las habilidades con descripciones y filtra las prohibidas
 * @returns {Object} - Habilidades procesadas
 */

const processPokemonAbilities = () => {
  const pokemonData = data.pokedex.Pokedex;
  const abilitiesDesc = data.abilitiesDesc.AbilitiesText;
  const abilitiesData = data.abilities.Abilities; // Obtener datos completos de habilidades
  const abilitiesDescArray = Object.values(abilitiesDesc);
  const bannedAbilities = ["arenatrap", "moody", "sandveil", "shadowtag", "snowcloak"];

  const result = {};

  for (const pokemonId in pokemonData) {
    const pokemon = pokemonData[pokemonId];
    const abilities = pokemon.abilities || {};

    const abilitiesWithDesc = {};

    for (const abilitySlot in abilities) {
      const abilityName = abilities[abilitySlot];

      // Encontrar el ID de la habilidad buscando en Abilities donde el nombre coincida
      let abilityId = null;
      for (const id in abilitiesData) {
        if (abilitiesData[id].name === abilityName) {
          abilityId = id;
          break;
        }
      }

      // Omitir habilidades prohibidas
      if (!abilityId || bannedAbilities.includes(abilityId)) {
        continue;
      }

      // Buscar el objeto de la habilidad por .name
      const abilityDescData = abilitiesDescArray.find((a) => a.name.toLowerCase() === abilityName.toLowerCase()) || {};

      const description = abilityDescData.shortDesc || abilityDescData.desc || "";

      // Incluir tanto el nombre como el ID
      abilitiesWithDesc[abilitySlot] = [abilityName, description, abilityId];
    }

    result[pokemonId] = {
      abilities: abilitiesWithDesc,
    };
  }

  return result;
};

/**
 * Procesa los movimientos con descripciones y filtrado
 * @returns {Object} - Movimientos procesados
 */
const processFilteredMoves = () => {
  const moves = data.moves.Moves;
  // Verificar si movesDesc existe antes de intentar acceder a MovesText
  const movesDesc = data.movesDesc && data.movesDesc.MovesText ? data.movesDesc.MovesText : {};
  const bannedMoves = ["batonpass", "lastrespects", "shedtail"];
  const filteredMoves = {};

  for (const moveId in moves) {
    // Omitir movimientos prohibidos
    if (bannedMoves.includes(moveId)) {
      continue;
    }

    const moveData = moves[moveId];
    const moveDescData = movesDesc[moveId] || {};

    // Crear un nuevo objeto de movimiento con descripciones correctamente incluidas
    filteredMoves[moveId] = {
      ...moveData,
      id: moveId,

      // Usar descripción de MovesText si está disponible, de lo contrario usar la del movimiento original
      shortDesc: moveDescData.shortDesc || moveData.shortDesc || "",
      desc: moveDescData.desc || moveData.desc || "",
    };
  }

  console.log(`Procesados ${Object.keys(filteredMoves).length} movimientos con descripciones`);
  return filteredMoves;
};

/**
 * Procesa las descripciones de movimientos por separado
 * @returns {Object} - Descripciones de movimientos
 */
const processMoveDescriptions = () => {
  // Asegurarse de que data.movesDesc y MovesText existen
  if (!data.movesDesc || !data.movesDesc.MovesText) {
    console.warn("Advertencia: Datos de descripciones de movimientos no encontrados!");
    return {};
  }

  return data.movesDesc.MovesText;
};

/**
 * @route GET /data/availablePokemons
 * @desc Obtener Pokémon disponibles filtrados para competitivo
 */
router.get("/availablePokemons", async (req, res) => {
  try {
    const filteredPokedex = processPokedex();
    res.json(formatResponse(true, "Pokémon disponibles", filteredPokedex));
  } catch (error) {
    console.error("Error al procesar Pokémon disponibles:", error);
    res.status(500).json(formatResponse(false, "Error al procesar Pokémon disponibles"));
  }
});

/**
 * @route GET /data/allPokemons
 * @desc Obtener TODOS los Pokémon (excepto CAP) para la Pokédex
 */
router.get("/allPokemons", async (req, res) => {
  try {
    const allPokemons = processAllPokemons();
    res.json(formatResponse(true, "Todos los Pokémon", allPokemons));
  } catch (error) {
    console.error("Error al procesar todos los Pokémon:", error);
    res.status(500).json(formatResponse(false, "Error al procesar todos los Pokémon"));
  }
});

/**
 * @route GET /data/items
 * @desc Obtener items con descripciones
 */
router.get("/items", async (req, res) => {
  try {
    const processedItems = processItems();
    res.json(formatResponse(true, "Items disponibles", processedItems));
  } catch (error) {
    console.error("Error al procesar items:", error);
    res.status(500).json(formatResponse(false, "Error al procesar items"));
  }
});

/**
 * @route GET /data/abilities
 * @desc Obtener habilidades con descripciones
 */
router.get("/abilities", async (req, res) => {
  try {
    const abilitiesWithDesc = processPokemonAbilities();
    res.json(formatResponse(true, "Habilidades disponibles", abilitiesWithDesc));
  } catch (error) {
    console.error("Error al procesar habilidades:", error);
    res.status(500).json(formatResponse(false, "Error al procesar habilidades"));
  }
});

/**
 * @route GET /data/moves
 * @desc Obtener movimientos filtrados
 */
router.get("/moves", async (req, res) => {
  try {
    const filteredMoves = processFilteredMoves();
    res.json(formatResponse(true, "Movimientos disponibles", filteredMoves));
  } catch (error) {
    console.error("Error al procesar movimientos:", error);
    res.status(500).json(formatResponse(false, "Error al procesar movimientos"));
  }
});

/**
 * @route GET /data/moves-desc
 * @desc Obtener descripciones de movimientos
 */
router.get("/moves-desc", async (req, res) => {
  try {
    const moveDescriptions = processMoveDescriptions();
    res.json(formatResponse(true, "Descripciones de movimientos", moveDescriptions));
  } catch (error) {
    console.error("Error al procesar descripciones de movimientos:", error);
    res.status(500).json(formatResponse(false, "Error al procesar descripciones de movimientos"));
  }
});

/**
 * @route GET /data/moves-with-power
 * @desc Obtener movimientos con datos de poder base para IA
 */
router.get("/moves-with-power", async (req, res) => {
  try {
    const moves = data.moves.Moves;
    const movesWithPower = {};

    for (const moveId in moves) {
      const moveData = moves[moveId];
      movesWithPower[moveId] = {
        name: moveData.name,
        basePower: moveData.basePower || 0,
        accuracy: moveData.accuracy || 100,
        category: moveData.category || "Status",
        type: moveData.type || "Normal",
        priority: moveData.priority || 0,
      };
    }

    res.json(formatResponse(true, "Movimientos con datos de poder", movesWithPower));
  } catch (error) {
    console.error("Error al procesar movimientos con poder:", error);
    res.status(500).json(formatResponse(false, "Error al procesar movimientos con poder"));
  }
});

// Rutas originales mantenidas por compatibilidad, pero con formato consistente
router.get("/pokedex", async (req, res) => {
  try {
    res.json(formatResponse(true, "Datos del Pokédex", data.moves));
  } catch (error) {
    console.error("Error al obtener datos del Pokédex:", error);
    res.status(500).json(formatResponse(false, "Error al obtener datos del Pokédex"));
  }
});

router.get("/abilities-raw", async (req, res) => {
  try {
    res.json(formatResponse(true, "Datos de habilidades", data.abilities.Abilities));
  } catch (error) {
    console.error("Error al obtener datos de habilidades:", error);
    res.status(500).json(formatResponse(false, "Error al obtener datos de habilidades"));
  }
});

router.get("/abilities-desc", async (req, res) => {
  try {
    res.json(formatResponse(true, "Descripciones de habilidades", data.abilitiesDesc.AbilitiesText));
  } catch (error) {
    console.error("Error al obtener descripciones de habilidades:", error);
    res.status(500).json(formatResponse(false, "Error al obtener descripciones de habilidades"));
  }
});

router.get("/items-raw", async (req, res) => {
  try {
    res.json(formatResponse(true, "Datos de items", data.items.Items));
  } catch (error) {
    console.error("Error al obtener datos de items:", error);
    res.status(500).json(formatResponse(false, "Error al obtener datos de items"));
  }
});

router.get("/items-desc", async (req, res) => {
  try {
    res.json(formatResponse(true, "Descripciones de items", data.itemsDesc.ItemsText));
  } catch (error) {
    console.error("Error al obtener descripciones de items:", error);
    res.status(500).json(formatResponse(false, "Error al obtener descripciones de items"));
  }
});

router.get("/formats", async (req, res) => {
  try {
    res.json(formatResponse(true, "Formatos disponibles", data.formats));
  } catch (error) {
    console.error("Error al obtener formatos disponibles:", error);
    res.status(500).json(formatResponse(false, "Error al obtener formatos disponibles"));
  }
});

router.get("/formats-data", async (req, res) => {
  try {
    res.json(formatResponse(true, "Datos de formatos", data.formatsData));
  } catch (error) {
    console.error("Error al obtener datos de formatos:", error);
    res.status(500).json(formatResponse(false, "Error al obtener datos de formatos"));
  }
});

router.get("/learnsets", async (req, res) => {
  try {
    res.json(formatResponse(true, "Datos de learnsets", data.learnsets.Learnsets));
  } catch (error) {
    console.error("Error al obtener datos de learnsets:", error);
    res.status(500).json(formatResponse(false, "Error al obtener datos de learnsets"));
  }
});

router.get("/types", async (req, res) => {
  try {
    res.json(formatResponse(true, "Datos de tipos", data.types));
  } catch (error) {
    console.error("Error al obtener datos de tipos:", error);
    res.status(500).json(formatResponse(false, "Error al obtener datos de tipos"));
  }
});

/**
 * @route GET /data/move/:moveName
 * @desc Obtener datos de un movimiento específico por nombre
 */
router.get("/move/:moveName", async (req, res) => {
  try {
    const { moveName } = req.params;
    const moves = data.moves.Moves;

    // Normalize the move name for searching
    const normalizedSearchName = moveName.toLowerCase().replace(/[\s'-]/g, "");

    // Find the move by name (case insensitive and handle special characters)
    let foundMoveId = null;
    let foundMoveData = null;

    for (const moveId in moves) {
      const move = moves[moveId];
      const normalizedMoveName = move.name.toLowerCase().replace(/[\s'-]/g, "");

      if (normalizedMoveName === normalizedSearchName || moveId === normalizedSearchName) {
        foundMoveId = moveId;
        foundMoveData = move;
        break;
      }
    }

    if (!foundMoveData) {
      return res.status(404).json(formatResponse(false, "Movimiento no encontrado"));
    }

    // Add move descriptions if available
    const moveDescData = data.movesDesc?.MovesText?.[foundMoveId] || {};

    const moveWithDesc = {
      ...foundMoveData,
      id: foundMoveId,
      shortDesc: moveDescData.shortDesc || foundMoveData.shortDesc || "",
      desc: moveDescData.desc || foundMoveData.desc || "",
    };

    res.json(formatResponse(true, "Datos del movimiento", moveWithDesc));
  } catch (error) {
    console.error("Error al obtener datos del movimiento:", error);
    res.status(500).json(formatResponse(false, "Error al obtener datos del movimiento"));
  }
});

/**
 * @route GET /data/pokemon/:pokemonName
 * @desc Obtener datos de un Pokémon específico por nombre
 */
router.get("/pokemon/:pokemonName", async (req, res) => {
  try {
    const { pokemonName } = req.params;
    const pokedex = data.pokedex.Pokedex;

    // Normalize the pokemon name for searching
    const normalizedSearchName = pokemonName.toLowerCase().replace(/[\s'-]/g, "");

    // Find the pokemon by name (case insensitive and handle special characters)
    let foundPokemonId = null;
    let foundPokemonData = null;

    for (const pokemonId in pokedex) {
      const pokemon = pokedex[pokemonId];
      const normalizedPokemonName = pokemon.name.toLowerCase().replace(/[\s'-]/g, "");

      if (normalizedPokemonName === normalizedSearchName || pokemonId === normalizedSearchName) {
        foundPokemonId = pokemonId;
        foundPokemonData = pokemon;
        break;
      }
    }

    if (!foundPokemonData) {
      return res.status(404).json(formatResponse(false, "Pokémon no encontrado"));
    }

    // Add pokemon ID for reference
    const pokemonWithId = {
      ...foundPokemonData,
      id: foundPokemonId,
    };

    res.json(formatResponse(true, "Datos del Pokémon", pokemonWithId));
  } catch (error) {
    console.error("Error al obtener datos del Pokémon:", error);
    res.status(500).json(formatResponse(false, "Error al obtener datos del Pokémon"));
  }
});

module.exports = router;
