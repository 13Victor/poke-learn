import React from "react";
import { formatPokemonId, generatePokemonImagePath, generateTypeBackground } from "../../utils/pokemonUtils";
import { handleImageError, formatPokemonTypes } from "../../utils/imageUtils";

const PokemonCard = ({ pokemon, onClick }) => {
  const pokemonId = formatPokemonId(pokemon.num);
  const pokemonTypes = formatPokemonTypes(pokemon.types);
  const pokemonImagePath = generatePokemonImagePath(pokemon);

  return (
    <div key={pokemon.id} className="pokemon visible" id={pokemonId} onClick={() => onClick && onClick(pokemon)}>
      <p
        className="pokemon-id-back"
        style={{
          "--pokemon-id": `"#${pokemonId}"`,
          "--pokemon-background": generateTypeBackground(pokemon.types),
        }}
      >
        #{pokemonId}
      </p>
      <div className="pokedex-pokemon-img">
        <img src={pokemonImagePath} alt={pokemon.name} onError={(e) => handleImageError(e, pokemon)} />
      </div>
      <div className="pokemon-info">
        <div className="name-container">
          <h4 className="pokemon-name">{pokemon.name}</h4>
        </div>
        <div className="pokemon-types-pokedex">{pokemonTypes}</div>
      </div>
    </div>
  );
};

export default PokemonCard;
