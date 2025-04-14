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

const TypeTally = ({ type, defenseMarks, coverageMarks }) => {
  const upperType = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="tally">
      <div className="tally__type">
        <img src={`/assets/type-icons/${upperType}2.png`} alt={type} className="type-icon" />
      </div>
      <div className="tally__marks-container">
        <ul className="tally__marks">
          {Array.from({ length: MAX_MARKS }).map((_, i) => (
            <li
              key={`defense-${i}`}
              className={`tally__mark ${
                defenseMarks[i] ? `tally__mark_${defenseMarks[i] === "resistant" ? "good" : "bad"}` : ""
              }`}
            />
          ))}
        </ul>
        <ul className="tally__marks">
          {Array.from({ length: MAX_MARKS }).map((_, i) => (
            <li key={`coverage-${i}`} className={`tally__mark ${coverageMarks[i] ? "tally__mark_good" : ""}`} />
          ))}
        </ul>
      </div>
    </div>
  );
};

const TeamAnalysis = () => {
  const { pokemons } = useTeam();
  const { types } = usePokemonData();

  const analysis = useMemo(() => {
    const defenseMarks = TYPE_ORDER.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {});

    const coverageMarks = TYPE_ORDER.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {});

    pokemons.forEach((pokemon) => {
      if (!pokemon.name || !pokemon.types) return;

      // Defense analysis
      TYPE_ORDER.forEach((attackingType) => {
        let totalEffectiveness = 1;
        pokemon.types.forEach((defenderType) => {
          totalEffectiveness *= types[attackingType][defenderType.toLowerCase()];
        });

        if (totalEffectiveness < 1) {
          defenseMarks[attackingType].push("resistant");
        } else if (totalEffectiveness > 1) {
          defenseMarks[attackingType].push("weak");
        }
      });

      // Offensive analysis (only one mark per Pokémon, even if effective with both types)
      TYPE_ORDER.forEach((defenderType) => {
        let isEffective = false;
        pokemon.types.forEach((attackerType) => {
          if (types[attackerType.toLowerCase()][defenderType] > 1) {
            isEffective = true;
          }
        });
        if (isEffective) {
          coverageMarks[defenderType].push(true);
        }
      });
    });

    return {
      defense: defenseMarks,
      coverage: coverageMarks,
    };
  }, [pokemons, types]);

  return (
    <div className="team__type-analysis">
      <h3 className="type-analysis__heading">Type Analysis</h3>
      <div className="type-analysis__grid">
        {TYPE_ORDER.map((type) => (
          <TypeTally
            key={type}
            type={type}
            defenseMarks={analysis.defense[type]}
            coverageMarks={analysis.coverage[type]}
          />
        ))}
      </div>
    </div>
  );
};

export default TeamAnalysis;
