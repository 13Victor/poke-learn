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

const TypeTally = ({ type, defensiveMarks, coverageMarks }) => {
  // Ordenar las marcas defensivas: primero resistencias (azul), luego debilidades (rojo)
  const sortedDefensiveMarks = [
    ...defensiveMarks.filter((mark) => mark === "resistant"),
    ...defensiveMarks.filter((mark) => mark === "weak"),
  ];

  // Filtrar y compactar las marcas de cobertura (eliminar huecos)
  const compactCoverageMarks = coverageMarks.filter(Boolean);

  return (
    <div className={`tally tally_${type}`}>
      <span className="tally__type-symbol">{type}</span>
      <div className="tally__group">
        <ul className="tally__marks">
          {Array.from({ length: MAX_MARKS }).map((_, i) => (
            <li
              key={i}
              className={`tally__mark ${
                sortedDefensiveMarks[i] === "resistant"
                  ? "tally__mark_good"
                  : sortedDefensiveMarks[i] === "weak"
                  ? "tally__mark_bad"
                  : ""
              }`}
            />
          ))}
        </ul>
        <ul className="tally__marks">
          {Array.from({ length: MAX_MARKS }).map((_, i) => (
            <li key={i} className={`tally__mark ${i < compactCoverageMarks.length ? "tally__mark_good" : ""}`} />
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

      // Análisis defensivo
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

      // Análisis ofensivo (solo una marca por Pokémon, aunque sea efectivo con ambos tipos)
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
