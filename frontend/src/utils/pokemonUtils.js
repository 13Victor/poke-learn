/**
 * Utilidades para el manejo de datos de Pokémon
 */

/**
 * Formatear ID del pokémon con ceros a la izquierda
 * @param {number} id - ID numérico del Pokémon
 * @returns {string} - ID formateado con 3 dígitos
 */
export const formatPokemonId = (id) => {
  return id.toString().padStart(3, "0");
};

/**
 * Formatear ID del pokémon para las imágenes (4 dígitos)
 * @param {number} id - ID numérico del Pokémon
 * @returns {string} - ID formateado con 4 dígitos
 */
export const formatPokemonIdForImage = (id) => {
  return id.toString().padStart(4, "0");
};

/**
 * Formatear nombre del pokémon para las imágenes
 * @param {Object} pokemon - Objeto del Pokémon
 * @param {boolean} includeBaseForme - Si incluir baseForme en el nombre
 * @returns {string} - Nombre formateado
 */
export const formatPokemonNameForImage = (pokemon, includeBaseForme = true) => {
  let name = pokemon.name;

  // Reemplazar guiones con espacios y dos puntos con nada
  name = name.replace(/-/g, " ").replace(/:/g, "");

  // Si el Pokémon tiene baseForme y se solicita incluirlo, añadirlo al nombre
  if (includeBaseForme && pokemon.baseForme) {
    name = `${name} ${pokemon.baseForme}`;
  }

  // Capitalizar la primera letra y mantener el resto
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/**
 * Función para codificar nombres de archivo de forma segura
 * @param {string} fileName - Nombre del archivo
 * @returns {string} - Nombre codificado para URL
 */
export const encodeFileName = (fileName) => {
  // Reemplazar caracteres problemáticos para URLs pero mantener la estructura de ruta
  return fileName
    .replace(/%/g, "%25") // % debe codificarse primero
    .replace(/ /g, "%20") // Espacios
    .replace(/\?/g, "%3F") // Signos de interrogación
    .replace(/#/g, "%23") // Almohadillas
    .replace(/&/g, "%26"); // Ampersands
};

/**
 * Generar ruta de imagen del pokémon con fallback
 * @param {Object} pokemon - Objeto del Pokémon
 * @returns {string} - Ruta de la imagen
 */
export const generatePokemonImagePath = (pokemon) => {
  const formattedId = formatPokemonIdForImage(pokemon.num);

  // Intentar primero con baseForme si existe
  const formattedNameWithForme = formatPokemonNameForImage(pokemon, true);
  const fileName = `${formattedId} ${formattedNameWithForme}.png`;
  const primaryPath = `./assets/official-artwork-pokemon/${encodeFileName(fileName)}`;

  // Debug: mostrar la ruta generada para Pokémon con baseForme
  if (pokemon.baseForme) {
    console.log(`Pokémon con baseForme - ${pokemon.name}:`);
    console.log(`  Ruta generada: ${primaryPath}`);
    console.log(`  baseForme: ${pokemon.baseForme}`);
  }

  return primaryPath;
};

/**
 * Generar fondo de tipos usando gradientes CSS
 * @param {Array} types - Array de tipos del Pokémon
 * @returns {string} - Gradiente CSS
 */
export const generateTypeBackground = (types) => {
  const lowerCaseTypes = types.map((type) => type.toLowerCase());
  if (lowerCaseTypes.length === 2) {
    return `linear-gradient(45deg, var(--type-${lowerCaseTypes[0]}) 0%, var(--type-${lowerCaseTypes[1]}) 100%)`;
  } else if (lowerCaseTypes.length === 1) {
    return `linear-gradient(45deg, var(--type-${lowerCaseTypes[0]}) 0%, var(--type-${lowerCaseTypes[0]}) 100%)`;
  }
  return "none";
};
