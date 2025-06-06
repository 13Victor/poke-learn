// src/components/Combat/BattleField.jsx
import React, { useState, useEffect } from "react";

export function BattleField({ logs, requestData, isLoading }) {
  const [playerPokemon, setPlayerPokemon] = useState(null);
  const [cpuPokemon, setCpuPokemon] = useState(null);

  // Parse player's Pokémon data from requestData
  useEffect(() => {
    if (requestData?.side?.pokemon) {
      // Encontrar el Pokémon activo del jugador
      const activePokemon = requestData.side.pokemon.find((pokemon) => pokemon.active);
      if (activePokemon) {
        // Obtener el nombre del Pokémon (sin nivel ni otras info)
        const pokemonName = activePokemon.details.split(",")[0].trim();

        // Parsear HP actual y máximo
        let currentHP = 0;
        let maxHP = 100;
        if (activePokemon.condition && !activePokemon.condition.includes("fnt")) {
          const hpParts = activePokemon.condition.split("/");
          if (hpParts.length === 2) {
            currentHP = parseInt(hpParts[0], 10);
            maxHP = parseInt(hpParts[1], 10);
          }
        }

        setPlayerPokemon({
          name: pokemonName,
          currentHP,
          maxHP,
          hpPercentage: (currentHP / maxHP) * 100,
          status: activePokemon.condition.includes("fnt") ? "fnt" : null,
        });
      }
    }
  }, [requestData]);

  // Parse CPU's Pokémon data from battle logs
  useEffect(() => {
    if (logs && logs.length > 0) {
      // Buscar en los logs el último Pokémon activo de la CPU
      let cpuName = null;
      let cpuCondition = null;

      // Recorrer los logs en orden inverso para encontrar información más reciente
      for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];

        // Intentar encontrar información sobre el cambio o daño del Pokémon de la CPU
        if (typeof log === "string") {
          // Buscar línea de switch para CPU (p2a)
          const switchMatch = log.match(/\|switch\|p2a: ([^|]+)\|([^|]+)\|([^|]+)/);
          if (switchMatch) {
            cpuName = switchMatch[2].split(",")[0].trim();
            cpuCondition = switchMatch[3];
            break;
          }

          // Buscar línea de daño para CPU
          const damageMatch = log.match(/\|damage\|p2a: ([^|]+)\|([^|]+)/);
          if (damageMatch) {
            if (!cpuName) cpuName = damageMatch[1];
            cpuCondition = damageMatch[2];
            if (cpuName) break; // Si ya tenemos el nombre, podemos salir
          }

          // Buscar línea de hp para CPU
          const hpMatch = log.match(/\|-damage\|p2a: ([^|]+)\|([^|]+)/);
          if (hpMatch) {
            if (!cpuName) cpuName = hpMatch[1];
            cpuCondition = hpMatch[2];
            if (cpuName) break; // Si ya tenemos el nombre, podemos salir
          }
        }
      }

      // Si encontramos información de la CPU, actualizamos el estado
      if (cpuName) {
        let currentHP = 0;
        let maxHP = 100;

        if (cpuCondition && !cpuCondition.includes("fnt")) {
          const hpParts = cpuCondition.split("/");
          if (hpParts.length === 2) {
            currentHP = parseInt(hpParts[0], 10);
            maxHP = parseInt(hpParts[1], 10);
          }
        }

        setCpuPokemon({
          name: cpuName,
          currentHP,
          maxHP,
          hpPercentage: (currentHP / maxHP) * 100,
          status: cpuCondition && cpuCondition.includes("fnt") ? "fnt" : null,
        });
      }
    }
  }, [logs]);

  // Determinar el color de la barra de HP basado en el porcentaje
  const getHPColor = (percentage) => {
    if (percentage > 50) return "green";
    if (percentage > 20) return "orange";
    return "red";
  };

  // Función para cargar sprites de Pokémon usando la nueva URL
  const getPokemonSprite = (pokemonName) => {
    if (!pokemonName) return null;

    // Formatear el nombre para la URL de Pokémon Showdown
    const formattedName = pokemonName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") // Remove special characters
      .replace(/\s+/g, ""); // Remove spaces

    return `https://play.pokemonshowdown.com/sprites/home/${formattedName}.png`;
  };

  if (isLoading) {
    return (
      <div className="battle-area">
        <p>Cargando batalla...</p>
      </div>
    );
  }

  return (
    <div className="battle-field">
      {/* Campo de batalla (imagen de fondo) */}
      <div className="battle-background">
        {/* Pokémon de la CPU (arriba) */}
        {cpuPokemon && (
          <div className="cpu-pokemon">
            <div className="pokemon-info">
              <div className="pokemon-name">{cpuPokemon.name}</div>
              <div className="hp-bar">
                <div
                  className="hp-fill"
                  style={{
                    width: `${cpuPokemon.hpPercentage}%`,
                    backgroundColor: getHPColor(cpuPokemon.hpPercentage),
                  }}
                ></div>
              </div>
              <div className="hp-text">
                HP: {cpuPokemon.currentHP}/{cpuPokemon.maxHP}
                {cpuPokemon.status === "fnt" && <span className="status"> DEBILITADO</span>}
              </div>
            </div>
            <div className="pokemon-sprite">
              <img
                src={getPokemonSprite(cpuPokemon.name)}
                alt={cpuPokemon.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/120x120?text=?";
                }}
              />
            </div>
          </div>
        )}

        {/* Pokémon del jugador (abajo) */}
        {playerPokemon && (
          <div className="player-pokemon">
            <div className="pokemon-sprite">
              <img
                src={getPokemonSprite(playerPokemon.name)}
                alt={playerPokemon.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/120x120?text=?";
                }}
              />
            </div>
            <div className="pokemon-info">
              <div className="pokemon-name">{playerPokemon.name}</div>
              <div className="hp-bar">
                <div
                  className="hp-fill"
                  style={{
                    width: `${playerPokemon.hpPercentage}%`,
                    backgroundColor: getHPColor(playerPokemon.hpPercentage),
                  }}
                ></div>
              </div>
              <div className="hp-text">
                HP: {playerPokemon.currentHP}/{playerPokemon.maxHP}
                {playerPokemon.status === "fnt" && <span className="status"> DEBILITADO</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
