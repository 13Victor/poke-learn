import React, { memo } from "react";

// Global image cache to avoid unnecessary reloads
const loadedImagesCache = new Set();

const PokemonRow = memo(({ pokemon, onClick }) => {
  const imageKey = pokemon.image;

  // Pre-cache the image
  const handleImageLoad = () => {
    loadedImagesCache.add(imageKey);
  };

  const handleImageError = () => {
    loadedImagesCache.delete(imageKey);
  };

  return (
    <tr onClick={() => onClick(pokemon)}>
      <td>
        <div
          className="pokemon-image-container"
          style={{
            width: "40px",
            height: "40px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src={`/assets/pokemon-small-hd-sprites-webp/${imageKey}`}
            alt={pokemon.name}
            width="40"
            height="40"
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
            style={{ display: "block" }}
          />
        </div>
      </td>
      <td>{pokemon.name}</td>
      <td>{pokemon.tier}</td>
      <td>{pokemon.typesString || pokemon.types.join(", ")}</td>
      <td>{pokemon.abilitiesString || pokemon.abilities.join(", ")}</td>
      <td>{pokemon.stats.hp}</td>
      <td>{pokemon.stats.atk}</td>
      <td>{pokemon.stats.def}</td>
      <td>{pokemon.stats.spa}</td>
      <td>{pokemon.stats.spd}</td>
      <td>{pokemon.stats.spe}</td>
    </tr>
  );
});

// Prevenir remontajes innecesarios con nombre de visualización personalizado
PokemonRow.displayName = "PokemonRow";

export default PokemonRow;
