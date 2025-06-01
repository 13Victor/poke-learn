/**
 * Utilidades para el manejo de líneas evolutivas
 */

/**
 * Encuentra la línea evolutiva completa de un Pokémon
 * @param {string} pokemonId - ID del Pokémon actual
 * @param {Array} allPokemons - Array con todos los Pokémon
 * @returns {Array} - Array con toda la línea evolutiva ordenada por stage
 */
export const getCompleteEvolutionLine = (pokemonId, allPokemons) => {
  if (!pokemonId || !allPokemons || allPokemons.length === 0) {
    return [];
  }

  // Crear un mapa para acceso rápido por ID
  const pokemonMap = {};
  allPokemons.forEach((pokemon) => {
    pokemonMap[pokemon.id] = pokemon;
  });

  const currentPokemon = pokemonMap[pokemonId];
  if (!currentPokemon) {
    return [];
  }

  // Encontrar el Pokémon base (sin pre-evolución)
  let basePokemon = currentPokemon;
  while (basePokemon && basePokemon.prevo) {
    const prevoId = basePokemon.prevo.toLowerCase().replace(/[-\s]/g, "");
    const prevo = allPokemons.find((p) => p.id === prevoId || p.name.toLowerCase().replace(/[-\s]/g, "") === prevoId);
    if (prevo) {
      basePokemon = prevo;
    } else {
      break;
    }
  }

  // Construir la línea evolutiva completa desde la base
  const evolutionLine = [];
  const visited = new Set();

  const addToLine = (pokemon, stage = 1) => {
    if (!pokemon || visited.has(pokemon.id)) {
      return;
    }

    visited.add(pokemon.id);

    const evolutionData = {
      ...pokemon,
      stage: stage,
      evolutionMethod: getEvolutionMethod(pokemon),
    };

    evolutionLine.push(evolutionData);

    // Agregar evoluciones recursivamente
    if (pokemon.evos && Array.isArray(pokemon.evos)) {
      pokemon.evos.forEach((evoName) => {
        const evoId = evoName.toLowerCase().replace(/[-\s]/g, "");
        const evolution = allPokemons.find(
          (p) => p.id === evoId || p.name.toLowerCase().replace(/[-\s]/g, "") === evoId
        );
        if (evolution) {
          addToLine(evolution, stage + 1);
        }
      });
    }
  };

  addToLine(basePokemon);

  // Ordenar por stage y luego por num
  return evolutionLine.sort((a, b) => {
    if (a.stage !== b.stage) {
      return a.stage - b.stage;
    }
    return a.num - b.num;
  });
};

/**
 * Obtiene el método de evolución formateado para mostrar
 * @param {Object} pokemon - Objeto del Pokémon
 * @returns {string} - Método de evolución formateado
 */
export const getEvolutionMethod = (pokemon) => {
  if (!pokemon.evoType) return "";

  const methods = {
    levelUp: `Lv. ${pokemon.evoLevel || "??"}`,
    useItem: pokemon.evoItem ? formatItemName(pokemon.evoItem) : "Stone",
    trade: "Trade",
    levelFriendship: "Friendship",
    levelHold: pokemon.evoItem ? `Hold ${formatItemName(pokemon.evoItem)}` : "Hold Item",
    other: pokemon.evoCondition || "Special",
    levelExtra: pokemon.evoCondition || `Lv. ${pokemon.evoLevel || "??"}`,
    levelMove: pokemon.evoMove ? `Learn ${pokemon.evoMove}` : "Learn Move",
  };

  return methods[pokemon.evoType] || pokemon.evoType;
};

/**
 * Formatea el nombre de un item para mostrar
 * @param {string} itemName - Nombre del item
 * @returns {string} - Nombre formateado
 */
const formatItemName = (itemName) => {
  return itemName
    .replace(/([A-Z])/g, " $1") // Añadir espacio antes de mayúsculas
    .replace(/^./, (str) => str.toUpperCase()) // Capitalizar primera letra
    .trim();
};

/**
 * Verifica si un Pokémon tiene evoluciones
 * @param {Object} pokemon - Objeto del Pokémon
 * @param {Array} allPokemons - Array con todos los Pokémon
 * @returns {boolean} - True si tiene línea evolutiva
 */
export const hasEvolutionLine = (pokemon, allPokemons) => {
  if (!pokemon || !allPokemons) return false;

  const evolutionLine = getCompleteEvolutionLine(pokemon.id, allPokemons);
  return evolutionLine.length > 1;
};
