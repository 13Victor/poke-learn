export const ALL_TYPES = [
  "normal",
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

/**
 * Crear el estado inicial de filtros (todos activos)
 * @returns {Set} - Set con todos los tipos activos incluyendo 'show-all'
 */
export const createInitialFilters = () => {
  return new Set(["show-all", ...ALL_TYPES]);
};

/**
 * Verificar si todos los filtros de tipo están activos
 * @param {Set} activeFilters - Set de filtros activos
 * @returns {boolean} - true si todos los tipos están activos
 */
export const areAllTypesActive = (activeFilters) => {
  return ALL_TYPES.every((type) => activeFilters.has(type));
};

/**
 * Verificar si ningún filtro de tipo está activo
 * @param {Set} activeFilters - Set de filtros activos
 * @returns {boolean} - true si ningún tipo está activo
 */
export const areNoTypesActive = (activeFilters) => {
  return ALL_TYPES.every((type) => !activeFilters.has(type));
};

/**
 * Manejar el toggle del filtro "show-all"
 * @param {Set} activeFilters - Set actual de filtros activos
 * @returns {Set} - Nuevo set de filtros
 */
export const toggleShowAll = (activeFilters) => {
  const newFilters = new Set(activeFilters);

  if (newFilters.has("show-all")) {
    // Si show-all está activo, desactivar todo
    newFilters.clear();
  } else {
    // Si show-all no está activo, activar todo
    newFilters.clear();
    newFilters.add("show-all");
    ALL_TYPES.forEach((type) => newFilters.add(type));
  }

  return newFilters;
};

/**
 * Manejar el toggle de un tipo específico
 * @param {Set} activeFilters - Set actual de filtros activos
 * @param {string} type - Tipo a togglear
 * @returns {Set} - Nuevo set de filtros
 */
export const toggleType = (activeFilters, type) => {
  const newFilters = new Set(activeFilters);

  if (newFilters.has(type)) {
    // Desactivar el tipo
    newFilters.delete(type);
  } else {
    // Activar el tipo
    newFilters.add(type);
  }

  // Actualizar el estado de show-all basado en los tipos activos
  if (areAllTypesActive(newFilters)) {
    newFilters.add("show-all");
  } else {
    newFilters.delete("show-all");
  }

  return newFilters;
};

/**
 * Filtrar Pokémon basado en los filtros activos
 * @param {Array} pokemons - Array de todos los Pokémon
 * @param {Set} activeFilters - Set de filtros activos
 * @returns {Array} - Array de Pokémon filtrados
 */
export const filterPokemons = (pokemons, activeFilters) => {
  // Si todos los tipos están activos o ninguno está activo, mostrar todos
  if (areAllTypesActive(activeFilters) || areNoTypesActive(activeFilters)) {
    return pokemons;
  }

  // Filtrar Pokémon que tengan al menos uno de los tipos activos
  return pokemons.filter((pokemon) => {
    return pokemon.types.some((type) => activeFilters.has(type.toLowerCase()));
  });
};

/**
 * Verificar si un filtro debe tener la clase 'shrink'
 * @param {Set} activeFilters - Set de filtros activos
 * @param {string} filterId - ID del filtro a verificar
 * @returns {boolean} - true si debe tener la clase shrink
 */
export const shouldHaveShrinkClass = (activeFilters, filterId) => {
  if (filterId === "show-all") {
    return !activeFilters.has("show-all");
  }
  return !activeFilters.has(filterId);
};
