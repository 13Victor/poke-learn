import React, { memo } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";

const PokemonRow = memo(
  ({ pokemon, onClick, isEven }) => {
    const imageUrl = `/assets/pokemon-small-hd-sprites-webp/${pokemon.image}`;

    return (
      <tr onClick={() => onClick(pokemon)} className={isEven ? "even-row" : "odd-row"}>
        <td>
          <img
            className="pokemon-image"
            src={imageUrl}
            alt={pokemon.name}
            onError={(e) => {
              e.target.src = "/assets/pokemon-small-hd-sprites-webp/0000.webp";
              console.warn(`Failed to load image for ${pokemon.name}`);
            }}
          />
        </td>
        <td>{pokemon.name}</td>
        <td>{pokemon.tier}</td>
        <td>
          <div className="types-cell">
            {pokemon.types.map((type, index) => (
              <span className="type-icon-container" style={{ backgroundColor: `var(--type-${type.toLowerCase()})` }}>
                <img className="type-icon" src={`/assets/type-icons/${type}.svg`} alt={type} />
                <span className="type-name">{type}</span>
              </span>
            ))}
          </div>
        </td>
        <td>{pokemon.abilitiesString || pokemon.abilities.join(", ")}</td>
        <td>{pokemon.baseStats.hp}</td>
        <td>{pokemon.baseStats.atk}</td>
        <td>{pokemon.baseStats.def}</td>
        <td>{pokemon.baseStats.spa}</td>
        <td>{pokemon.baseStats.spd}</td>
        <td>{pokemon.baseStats.spe}</td>
      </tr>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.pokemon.id === nextProps.pokemon.id && prevProps.isEven === nextProps.isEven;
  }
);

PokemonRow.displayName = "PokemonRow";

export default PokemonRow;
