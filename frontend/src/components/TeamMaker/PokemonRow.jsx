import React, { memo } from "react";

const PokemonRow = memo(({ pokemon, onClick }) => {
  const imageUrl = `/assets/pokemon-small-hd-sprites-webp/${pokemon.image}`;

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
            src={imageUrl}
            alt={pokemon.name}
            width="40"
            height="40"
            style={{ display: "block" }}
            onError={(e) => {
              e.target.src = "/assets/pokemon-small-hd-sprites-webp/0000.webp";
              console.warn(`Failed to load image for ${pokemon.name}`);
            }}
          />
        </div>
      </td>
      <td>{pokemon.name}</td>
      <td>{pokemon.tier}</td>
      <td>{pokemon.typesString || pokemon.types.join(", ")}</td>
      <td>{pokemon.abilitiesString || pokemon.abilities.join(", ")}</td>
      <td>{pokemon.baseStats.hp}</td>
      <td>{pokemon.baseStats.atk}</td>
      <td>{pokemon.baseStats.def}</td>
      <td>{pokemon.baseStats.spa}</td>
      <td>{pokemon.baseStats.spd}</td>
      <td>{pokemon.baseStats.spe}</td>
    </tr>
  );
});

PokemonRow.displayName = "PokemonRow";

export default PokemonRow;
