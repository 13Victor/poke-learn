import React, { memo, useContext } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";
import { usePokemonData } from "../../contexts/PokemonDataContext";

// Tier descriptions
const TIER_DESCRIPTIONS = {
  OU: "Overused",
  UU: "Underused",
  UUBL: "Underused Banlist",
  RUBL: "Rarely Used Banlist",
  RU: "Rarely Used",
  NUBL: "Never Used Banlist",
  NU: "Never Used",
  PUBL: "Partially Used Banlist",
  PU: "Partially Used",
  ZUBL: "Zero Used Banlist",
  ZU: "Zero Used",
  NFE: "Not Fully Evolved",
  LC: "Little Cup",
};

const PokemonRow = memo(
  ({ pokemon, onClick, isEven }) => {
    const { abilities } = usePokemonData();
    const imageUrl = `/assets/pokemon-small-hd-sprites-webp/${pokemon.image}`;

    // Get tier description or provide default message
    const getTierDescription = (tier) => {
      return TIER_DESCRIPTIONS[tier] || `${tier} - No description available`;
    };

    // Encuentra la descripción de la habilidad
    const getAbilityDescription = (abilityName) => {
      if (!abilities || !abilityName) return "No description available";

      // Buscar en el objeto abilities por nombre de habilidad
      for (const abilityKey in abilities) {
        const abilityData = abilities[abilityKey];
        // Buscar en las entradas de cada ability
        for (const abilityCategoryKey in abilityData) {
          // Los valores son [abilityName, abilityDescription]
          if (abilityCategoryKey === "abilities") {
            for (const slot in abilityData.abilities) {
              const [name, description] = abilityData.abilities[slot];
              if (name === abilityName) {
                return description || "No description available";
              }
            }
          }
        }
      }

      return "No description available";
    };

    return (
      <tr onClick={() => onClick(pokemon)} className={isEven ? "even-row" : "odd-row"}>
        <td>
          <div className="pokemon-icon-container">
            <img
              className="pokemon-image"
              src={imageUrl}
              alt={pokemon.name}
              onError={(e) => {
                e.target.src = "/assets/pokemon-small-hd-sprites-webp/0000.webp";
                console.warn(`Failed to load image for ${pokemon.name}`);
              }}
            />
          </div>
        </td>
        <td>{pokemon.name}</td>
        <td>
          <div className="pokemon-tier-cell">
            <Tippy
              content={getTierDescription(pokemon.tier)}
              placement="top"
              animation="scale"
              theme="light-border"
              delay={[300, 100]}
            >
              <p className="pokemon-tier">{pokemon.tier}</p>
            </Tippy>
          </div>
        </td>
        <td>
          <div className="types-cell">
            {pokemon.types.map((type, index) => (
              <Tippy
                key={type}
                content={
                  <div className="type-tooltip-content">
                    <img className="type-icon" src={`/assets/type-icons/${type}_banner.png`} alt={type} />
                  </div>
                }
                placement="top"
                animation="scale"
                theme={`type-tooltip-${type.toLowerCase()} transparent`}
                delay={[300, 100]}
                arrow={true}
              >
                <img className="type-icon" src={`/assets/type-icons/${type}2.png`} alt={type} />
              </Tippy>
            ))}
          </div>
        </td>
        <td>
          <div className="abilities-cell">
            {pokemon.abilities.map((ability, index) => (
              <Tippy
                key={ability}
                content={getAbilityDescription(ability)}
                placement="top"
                animation="scale"
                theme="not-rounded"
                delay={[300, 0]}
              >
                <span className="ability-name" key={ability}>
                  {ability}
                </span>
              </Tippy>
            ))}
          </div>
        </td>
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
