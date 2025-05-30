import React from "react";
import { formatPokemonIdForImage, formatPokemonNameForImage, encodeFileName } from "./pokemonUtils";

/**
 * Función para manejar error de imagen y usar fallback
 * @param {Event} event - Evento de error de imagen
 * @param {Object} pokemon - Objeto del Pokémon
 */
export const handleImageError = (event, pokemon) => {
  const img = event.target;
  const formattedId = formatPokemonIdForImage(pokemon.num);

  // Si la imagen actual incluye baseForme, intentar sin baseForme
  if (pokemon.baseForme && img.src.includes(encodeFileName(pokemon.baseForme))) {
    const formattedNameWithoutForme = formatPokemonNameForImage(pokemon, false);
    const fileName = `${formattedId} ${formattedNameWithoutForme}.png`;
    const fallbackPath = `./assets/official-artwork-pokemon/${encodeFileName(fileName)}`;

    console.log(`Imagen con baseForme falló: ${img.src}`);
    console.log(`Intentando fallback: ${fallbackPath}`);

    img.src = fallbackPath;
  } else {
    // Si ya es el fallback o no tiene baseForme, mostrar imagen por defecto
    console.log(`Imagen fallback también falló: ${img.src}`);
    // Puedes poner aquí una imagen por defecto si quieres
    // img.src = './assets/pokemon-placeholder.png';
  }
};

/**
 * Formatear tipos del pokémon como elementos de imagen
 * @param {Array} types - Array de tipos del Pokémon
 * @returns {Array} - Array de elementos JSX con imágenes de tipos
 */
export const formatPokemonTypes = (types) => {
  return types.map((type, index) =>
    React.createElement("img", {
      key: `${type}-${index}`,
      src: `./assets/type-icons/${type}_banner.png`,
      alt: type,
    })
  );
};
