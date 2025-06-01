import React from "react";
import { formatPokemonId, generatePokemonImagePath } from "../../utils/pokemonUtils";
import { FaCircleArrowRight } from "react-icons/fa6";

import { handleImageError, formatPokemonTypesIcon } from "../../utils/imageUtils";

const EvolutionLine = ({ evolutionLine, currentPokemon, onPokemonClick }) => {
  if (!evolutionLine || evolutionLine.length <= 1) {
    return null; // No mostrar si no hay evoluciones o solo hay un Pokémon
  }

  // Agrupar por stage para manejar evoluciones ramificadas
  const groupedByStage = evolutionLine.reduce((acc, pokemon) => {
    const stage = pokemon.stage || 1;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(pokemon);
    return acc;
  }, {});

  const stages = Object.keys(groupedByStage).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="evolution-section">
      <div className="detailContainer">
        <h4>Evolution Line</h4>
        <hr id="separatorLine" />
        <div className="evolution-chain">
          {stages.map((stage, stageIndex) => (
            <React.Fragment key={stage}>
              <div className="evolution-stage">
                {groupedByStage[stage].map((pokemon, pokemonIndex) => {
                  const isCurrentPokemon = pokemon.id === currentPokemon?.id;
                  const pokemonId = formatPokemonId(pokemon.num);
                  const imagePath = generatePokemonImagePath(pokemon);

                  return (
                    <div
                      key={pokemon.id}
                      className={`evolution-pokemon ${isCurrentPokemon ? "current" : ""}`}
                      onClick={() => onPokemonClick && onPokemonClick(pokemon)}
                      style={{
                        background:
                          pokemon.types.length > 1
                            ? `linear-gradient(45deg, rgba(var(--type-${pokemon.types[0].toLowerCase()}-rgb), 0.5), rgba(var(--type-${pokemon.types[1].toLowerCase()}-rgb), 0.5))`
                            : `rgba(var(--type-${pokemon.types[0].toLowerCase()}-rgb), 0.5)`,
                      }}
                    >
                      <div className="evolution-image-container">
                        <img
                          src={imagePath}
                          alt={pokemon.name}
                          className="evolution-image"
                          onError={(e) => handleImageError(e, pokemon)}
                        />
                      </div>

                      {/* Mostrar método de evolución si no es el primer stage */}
                      {/* {stage > 1 && <div className="evolution-method">{pokemon.evolutionMethod}</div>} */}
                    </div>
                  );
                })}
              </div>

              {/* Flecha entre stages */}
              {stageIndex < stages.length - 1 && (
                <div className="evolution-arrow">
                  <FaCircleArrowRight />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EvolutionLine;
