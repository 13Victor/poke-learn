import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Estilos básicos
import "tippy.js/animations/scale.css"; // Animación opcional
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
        <ul className="tally__marks tally__marks-defense">
          {Array.from({ length: MAX_MARKS }).map((_, i) => (
            <li
              key={`defense-${i}`}
              className={`tally__mark ${
                defenseMarks[i] ? `tally__mark_${defenseMarks[i] === "resistant" ? "good" : "bad"}` : ""
              }`}
            />
          ))}
        </ul>
        <hr className="tally__divider" id="separatorLine" style={{ backgroundColor: `var(--type-${type})` }} />
        <ul className="tally__marks tally__marks-coverage">
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
      <div className="type-analysis__legend">
        <p>
          Blue tally marks indicate resistances, immunities, or
          <span>
            <Tippy
              content="Same Type Attack Bonus - A 50% damage boost when a Pokémon uses a move matching its type"
              animation="scale"
              delay={[300, 100]}
              placement="top"
            >
              <span className="tooltip-text"> STAB </span>
            </Tippy>
          </span>
          coverage. Red tally marks indicate weakness.
        </p>
      </div>
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
