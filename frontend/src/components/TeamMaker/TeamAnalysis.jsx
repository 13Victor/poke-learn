// TeamAnalysis.jsx - With red drop shadow for types with more weaknesses than resistances
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

const TypeTally = ({ type, defenseData, coverageData }) => {
  const upperType = type.charAt(0).toUpperCase() + type.slice(1);
  const { setHighlightedPokemonIds, setHighlightType, setHighlightTypeValue } = useHighlight();

  // Calculate if there are more weaknesses than resistances
  const resistances = defenseData.filter((mark) => mark.type === "resistant").length;
  const weaknesses = defenseData.filter((mark) => mark.type === "weak").length;
  const hasMoreWeaknessesThanResistances = weaknesses > resistances;

  // Handle hover on defense marks
  const handleDefenseMarkHover = (markData) => {
    if (markData) {
      setHighlightedPokemonIds([markData.pokemonId]);
      setHighlightType("defense");
      setHighlightTypeValue(type);
    }
  };

  // Handle hover on coverage marks
  const handleCoverageMarkHover = (markData) => {
    if (markData) {
      setHighlightedPokemonIds([markData.pokemonId]);
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

  // Style for the type icon when there are more weaknesses than resistances
  const typeIconStyle = hasMoreWeaknessesThanResistances
    ? {
        filter: "drop-shadow(0 0 4px var(--red-gray))",
        transition: "all var(--transition-normal)",
      }
    : {};

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
          <img src={`/assets/type-icons/${upperType}2.png`} alt={type} className="type-icon" style={typeIconStyle} />
        </Tippy>
      </div>
      <div className="tally__marks-container">
        <ul className="tally__marks tally__marks-defense">
          {Array.from({ length: MAX_MARKS }).map((_, i) => {
            const markData = i < defenseData.length ? defenseData[i] : null;

            return (
              <li
                key={`defense-${i}`}
                className={`tally__mark ${
                  markData ? `tally__mark_${markData.type === "resistant" ? "good" : "bad"}` : ""
                }`}
                onMouseEnter={() => handleDefenseMarkHover(markData)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </ul>
        <hr className="tally__divider" id="separatorLine" style={{ backgroundColor: `var(--type-${type})` }} />
        <ul className="tally__marks tally__marks-coverage">
          {Array.from({ length: MAX_MARKS }).map((_, i) => {
            const markData = i < coverageData.length ? coverageData[i] : null;

            return (
              <li
                key={`coverage-${i}`}
                className={`tally__mark ${markData ? "tally__mark_good" : ""}`}
                onMouseEnter={() => handleCoverageMarkHover(markData)}
                onMouseLeave={handleMouseLeave}
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
    // Objeto para almacenar los datos ordenados
    const defenseSortedData = TYPE_ORDER.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {});

    const coverageSortedData = TYPE_ORDER.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {});

    // Recopilar todos los datos de tipos para cada Pokémon
    pokemons.forEach((pokemon, pokemonIndex) => {
      if (!pokemon.name || !pokemon.types) return;

      // Defense analysis
      TYPE_ORDER.forEach((attackingType) => {
        let totalEffectiveness = 1;
        pokemon.types.forEach((defenderType) => {
          totalEffectiveness *= types[attackingType][defenderType.toLowerCase()];
        });

        if (totalEffectiveness < 1) {
          // Resistencia (azul)
          defenseSortedData[attackingType].push({
            pokemonId: pokemonIndex,
            pokemonName: pokemon.name,
            effectiveness: totalEffectiveness,
            type: "resistant", // "good" - azul
          });
        } else if (totalEffectiveness > 1) {
          // Debilidad (rojo)
          defenseSortedData[attackingType].push({
            pokemonId: pokemonIndex,
            pokemonName: pokemon.name,
            effectiveness: totalEffectiveness,
            type: "weak", // "bad" - rojo
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
          coverageSortedData[defenderType].push({
            pokemonId: pokemonIndex,
            pokemonName: pokemon.name,
            type: "effective", // Para cobertura, siempre es "good"
          });
        }
      });
    });

    // Ordenar las marcas: primero azules (resistentes), luego rojas (débiles)
    Object.keys(defenseSortedData).forEach((type) => {
      defenseSortedData[type].sort((a, b) => {
        // Si uno es resistente y el otro débil, el resistente va primero
        if (a.type === "resistant" && b.type === "weak") return -1;
        if (a.type === "weak" && b.type === "resistant") return 1;

        // Si ambos son del mismo tipo, mantener el orden original
        return 0;
      });
    });

    return {
      defenseData: defenseSortedData,
      coverageData: coverageSortedData,
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
        <p>Type icons with red drop shadows indicate types where your team has more weaknesses than resistances.</p>
      </div>
      <div className="type-analysis__grid">
        {TYPE_ORDER.map((type) => (
          <TypeTally
            key={type}
            type={type}
            defenseData={analysis.defenseData[type]}
            coverageData={analysis.coverageData[type]}
          />
        ))}
      </div>
    </div>
  );
};

export default TeamAnalysis;
