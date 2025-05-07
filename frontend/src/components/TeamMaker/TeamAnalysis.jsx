// TeamAnalysis.jsx - Enhanced Version
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";
import React, { useMemo, useContext, createContext, useState } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import "../../styles/Analysis.css";

// Create a context to manage the highlighted Pokémon slots
const HighlightContext = createContext();

export const HighlightProvider = ({ children }) => {
  const [highlightedPokemonIds, setHighlightedPokemonIds] = useState([]);
  const [highlightType, setHighlightType] = useState(null); // 'defense' or 'coverage'
  const [highlightTypeValue, setHighlightTypeValue] = useState(null); // The actual type (water, fire, etc.)

  const value = {
    highlightedPokemonIds,
    setHighlightedPokemonIds,
    highlightType,
    setHighlightType,
    highlightTypeValue,
    setHighlightTypeValue,
  };

  return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>;
};

export const useHighlight = () => {
  const context = useContext(HighlightContext);
  if (!context) {
    throw new Error("useHighlight must be used within a HighlightProvider");
  }
  return context;
};

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

const TypeTally = ({ type, defenseMarks, coverageMarks, pokemonData }) => {
  const upperType = type.charAt(0).toUpperCase() + type.slice(1);
  const { setHighlightedPokemonIds, setHighlightType, setHighlightTypeValue } = useHighlight();

  // Handle hover on defense marks
  const handleDefenseMarkHover = (index) => {
    const markValue = defenseMarks[index];
    if (markValue) {
      setHighlightedPokemonIds([pokemonData.defense[type][index].pokemonId]);
      setHighlightType("defense");
      setHighlightTypeValue(type);
    }
  };

  // Handle hover on coverage marks
  const handleCoverageMarkHover = (index) => {
    const markValue = coverageMarks[index];
    if (markValue) {
      setHighlightedPokemonIds([pokemonData.coverage[type][index].pokemonId]);
      setHighlightType("coverage");
      setHighlightTypeValue(type);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHighlightedPokemonIds([]);
    setHighlightType(null);
    setHighlightTypeValue(null);
  };

  return (
    <div className="tally">
      <div className="tally__type">
        <Tippy
          content={
            <div className="type-tooltip-content">
              <img className="type-icon-banner" src={`/assets/type-icons/${upperType}_banner.png`} alt={type} />
            </div>
          }
          placement="top"
          animation="scale"
          theme={`type-tooltip-${type.toLowerCase()} transparent`}
          delay={[300, 100]}
          arrow={true}
        >
          <img src={`/assets/type-icons/${upperType}2.png`} alt={type} className="type-icon" />
        </Tippy>
      </div>
      <div className="tally__marks-container">
        <ul className="tally__marks tally__marks-defense">
          {Array.from({ length: MAX_MARKS }).map((_, i) => {
            const markData = pokemonData.defense[type][i];
            const markValue = defenseMarks[i];

            return (
              <li
                key={`defense-${i}`}
                className={`tally__mark ${
                  markValue ? `tally__mark_${markValue === "resistant" ? "good" : "bad"}` : ""
                }`}
                onMouseEnter={() => handleDefenseMarkHover(i)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </ul>
        <hr className="tally__divider" id="separatorLine" style={{ backgroundColor: `var(--type-${type})` }} />
        <ul className="tally__marks tally__marks-coverage">
          {Array.from({ length: MAX_MARKS }).map((_, i) => {
            const markData = pokemonData.coverage[type][i];
            const markValue = coverageMarks[i];

            return (
              <li
                key={`coverage-${i}`}
                className={`tally__mark ${markValue ? "tally__mark_good" : ""}`}
                onMouseEnter={() => handleCoverageMarkHover(i)}
                onMouseLeave={handleMouseLeave}
                title={markData ? `${markData.pokemonName} - Effective against ${upperType}` : ""}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const TeamAnalysis = () => {
  const { pokemons } = useTeam();
  const { types } = usePokemonData();

  const analysis = useMemo(() => {
    // Create objects to store both marks and pokemon data for each type
    const defenseMarksWithData = TYPE_ORDER.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {});

    const coverageMarksWithData = TYPE_ORDER.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {});

    // Simple marks arrays for rendering
    const defenseMarks = TYPE_ORDER.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {});

    const coverageMarks = TYPE_ORDER.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {});

    pokemons.forEach((pokemon, pokemonIndex) => {
      if (!pokemon.name || !pokemon.types) return;

      // Defense analysis
      TYPE_ORDER.forEach((attackingType) => {
        let totalEffectiveness = 1;
        pokemon.types.forEach((defenderType) => {
          totalEffectiveness *= types[attackingType][defenderType.toLowerCase()];
        });

        if (totalEffectiveness < 1) {
          defenseMarks[attackingType].push("resistant");
          defenseMarksWithData[attackingType].push({
            pokemonId: pokemonIndex,
            pokemonName: pokemon.name,
            effectiveness: totalEffectiveness,
          });
        } else if (totalEffectiveness > 1) {
          defenseMarks[attackingType].push("weak");
          defenseMarksWithData[attackingType].push({
            pokemonId: pokemonIndex,
            pokemonName: pokemon.name,
            effectiveness: totalEffectiveness,
          });
        }
      });

      // Offensive analysis
      TYPE_ORDER.forEach((defenderType) => {
        let isEffective = false;
        pokemon.types.forEach((attackerType) => {
          if (types[attackerType.toLowerCase()][defenderType] > 1) {
            isEffective = true;
          }
        });
        if (isEffective) {
          coverageMarks[defenderType].push(true);
          coverageMarksWithData[defenderType].push({
            pokemonId: pokemonIndex,
            pokemonName: pokemon.name,
          });
        }
      });
    });

    return {
      defense: defenseMarks,
      coverage: coverageMarks,
      pokemonData: {
        defense: defenseMarksWithData,
        coverage: coverageMarksWithData,
      },
    };
  }, [pokemons, types]);

  return (
    <div className="team__type-analysis">
      <h3 className="type-analysis__heading">Type Analysis</h3>
      <div className="type-analysis__legend">
        <p>
          Blue tally marks indicate resistances, immunities, or{" "}
          <span>
            <Tippy
              content="Same Type Attack Bonus - A 50% damage boost when a Pokémon uses a move matching its type"
              animation="scale"
              delay={[300, 100]}
              placement="top"
            >
              <span className="tooltip-text">STAB</span>
            </Tippy>
          </span>{" "}
          coverage. Red tally marks indicate weakness.
        </p>
        <p>Hover over a tally mark to highlight the Pokémon it corresponds to.</p>
      </div>
      <div className="type-analysis__grid">
        {TYPE_ORDER.map((type) => (
          <TypeTally
            key={type}
            type={type}
            defenseMarks={analysis.defense[type]}
            coverageMarks={analysis.coverage[type]}
            pokemonData={analysis.pokemonData}
          />
        ))}
      </div>
    </div>
  );
};

export default TeamAnalysis;
