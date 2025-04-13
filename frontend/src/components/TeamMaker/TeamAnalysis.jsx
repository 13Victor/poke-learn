import React, { useMemo } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import "../../styles/Analysis.css";

const MAX_MARKS = 6;
const TYPE_ORDER = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
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

const TypeTally = ({ type, defensiveMarks, coverageMarks }) => (
  <div className={`tally tally_${type}`}>
    <span className="tally__type-symbol">{type}</span>
    <div className="tally__group">
      {/* Defense marks */}
      <ul className="tally__marks">
        {Array.from({ length: MAX_MARKS }).map((_, i) => {
          const mark = defensiveMarks[i];
          return mark ? (
            <li key={i} className={`tally__mark ${mark === "resistant" ? "tally__mark_good" : "tally__mark_bad"}`}></li>
          ) : (
            <li key={i} className="tally__mark"></li>
          );
        })}
      </ul>
      {/* Coverage marks */}
      <ul className="tally__marks">
        {Array.from({ length: MAX_MARKS }).map((_, i) => (
          <li key={i} className={`tally__mark ${coverageMarks[i] ? "tally__mark_good" : ""}`}></li>
        ))}
      </ul>
    </div>
  </div>
);

const TeamAnalysis = () => {
  const { pokemons } = useTeam();
  const { types } = usePokemonData();

  const analysis = useMemo(() => {
    const defenseMarks = TYPE_ORDER.reduce((acc, type) => {
      acc[type] = Array(6).fill(null);
      return acc;
    }, {});

    const coverageMarks = TYPE_ORDER.reduce((acc, type) => {
      acc[type] = Array(6).fill(false);
      return acc;
    }, {});

    pokemons.forEach((pokemon, pokemonIndex) => {
      if (!pokemon.name || !pokemon.types) return;

      // Análisis defensivo
      TYPE_ORDER.forEach((attackingType) => {
        let totalEffectiveness = 1;
        pokemon.types.forEach((defenderType) => {
          totalEffectiveness *= types[attackingType][defenderType.toLowerCase()];
        });

        // Solo marcamos si hay resistencia o debilidad, dejamos null para neutral
        if (totalEffectiveness < 1) {
          defenseMarks[attackingType][pokemonIndex] = "resistant";
        } else if (totalEffectiveness > 1) {
          defenseMarks[attackingType][pokemonIndex] = "weak";
        }
      });

      // Análisis ofensivo (cobertura)
      pokemon.types.forEach((attackerType) => {
        TYPE_ORDER.forEach((defenderType) => {
          if (types[attackerType.toLowerCase()][defenderType] > 1) {
            coverageMarks[defenderType][pokemonIndex] = true;
          }
        });
      });
    });

    return { defense: defenseMarks, coverage: coverageMarks };
  }, [pokemons, types]);

  return (
    <div className="team__type-analysis">
      <h3 className="type-analysis__heading">Team Analysis</h3>
      <div className="type-analysis__grid">
        {TYPE_ORDER.map((type) => (
          <TypeTally
            key={type}
            type={type}
            defensiveMarks={analysis.defense[type]}
            coverageMarks={analysis.coverage[type]}
          />
        ))}
      </div>
    </div>
  );
};

export default TeamAnalysis;
