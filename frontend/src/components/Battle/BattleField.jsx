// src/components/Combat/BattleField.jsx - VERSIÓN CORREGIDA CON HP PERSISTENTE
import React, { useState, useEffect, useRef } from "react";

export function BattleField({ logs, requestData, isLoading }) {
  const [playerPokemon, setPlayerPokemon] = useState(null);
  const [cpuPokemon, setCpuPokemon] = useState(null);

  // Referencias para almacenar HP máximo de cada Pokémon
  const playerMaxHPRef = useRef(new Map()); // Map<pokemonName, maxHP>
  const cpuMaxHPRef = useRef(new Map());

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
        let isFainted = false;

        if (activePokemon.condition) {
          if (activePokemon.condition.includes("fnt")) {
            // Pokémon debilitado
            isFainted = true;
            currentHP = 0;
            // Intentar recuperar el HP máximo almacenado
            const storedMaxHP = playerMaxHPRef.current.get(pokemonName);
            maxHP = storedMaxHP || 100; // Fallback a 100 si no tenemos datos
          } else {
            // Pokémon vivo, parsear HP normal
            const hpParts = activePokemon.condition.split("/");
            if (hpParts.length === 2) {
              currentHP = parseInt(hpParts[0], 10);
              maxHP = parseInt(hpParts[1], 10);
              // Almacenar el HP máximo para uso futuro
              playerMaxHPRef.current.set(pokemonName, maxHP);
            }
          }
        }

        setPlayerPokemon({
          name: pokemonName,
          currentHP,
          maxHP,
          hpPercentage: (currentHP / maxHP) * 100,
          status: isFainted ? "fnt" : null,
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

      // Función auxiliar para extraer nombres de Pokémon correctamente
      const extractPokemonName = (identifier) => {
        if (!identifier) return null;

        // Si tiene formato "p2a: Great Tusk", extraer solo el nombre
        if (identifier.includes(":")) {
          return identifier.split(":")[1].trim();
        }

        // Si es solo el nombre, devolverlo tal como está
        return identifier.trim();
      };

      // Recorrer los logs en orden inverso para encontrar información más reciente
      for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];

        // Intentar encontrar información sobre el cambio o daño del Pokémon de la CPU
        if (typeof log === "string") {
          // Buscar línea de switch para CPU (p2a) - CORREGIDA
          const switchMatch = log.match(/\|switch\|p2a: ([^|]+)\|([^|]+)\|([^|]+)/);
          if (switchMatch) {
            // switchMatch[1] contiene "Great Tusk" completo
            cpuName = extractPokemonName(switchMatch[1]);
            cpuCondition = switchMatch[3];
            break;
          }

          // Buscar línea de heal para CPU - CORREGIDA
          const healMatch = log.match(/\|-heal\|p2a: ([^|]+)\|([^|]+)/);
          if (healMatch) {
            if (!cpuName) cpuName = extractPokemonName(healMatch[1]);
            cpuCondition = healMatch[2];
            // Continue searching for the name if we don't have it yet
            if (cpuName && cpuCondition) break;
          }

          // Buscar línea de daño para CPU - CORREGIDA
          const damageMatch = log.match(/\|-damage\|p2a: ([^|]+)\|([^|]+)/);
          if (damageMatch) {
            if (!cpuName) cpuName = extractPokemonName(damageMatch[1]);
            cpuCondition = damageMatch[2];
            // Continue searching for the name if we don't have it yet
            if (cpuName && cpuCondition) break;
          }

          // Buscar cualquier línea que mencione p2a para obtener el nombre del Pokémon - CORREGIDA
          const p2aMatch = log.match(/p2a: ([^|,]+)/); // REMOVIDO \s para permitir espacios
          if (p2aMatch && !cpuName) {
            cpuName = extractPokemonName(p2aMatch[1]);
          }
        }
      }

      // Si encontramos información de la CPU, actualizamos el estado
      if (cpuName) {
        let currentHP = 0;
        let maxHP = 100;
        let isFainted = false;

        if (cpuCondition) {
          if (cpuCondition.includes("fnt")) {
            // Pokémon de la CPU debilitado
            isFainted = true;
            currentHP = 0;
            // Intentar recuperar el HP máximo almacenado
            const storedMaxHP = cpuMaxHPRef.current.get(cpuName);
            maxHP = storedMaxHP || 100; // Fallback a 100 si no tenemos datos
          } else {
            // Pokémon de la CPU vivo, parsear HP normal
            const hpParts = cpuCondition.split("/");
            if (hpParts.length === 2) {
              currentHP = parseInt(hpParts[0], 10);
              maxHP = parseInt(hpParts[1], 10);
              // Almacenar el HP máximo para uso futuro
              cpuMaxHPRef.current.set(cpuName, maxHP);
            }
          }
        }

        setCpuPokemon({
          name: cpuName,
          currentHP,
          maxHP,
          hpPercentage: maxHP > 0 ? (currentHP / maxHP) * 100 : 0,
          status: isFainted ? "fnt" : null,
        });
      }
    }
  }, [logs]);

  // Función para limpiar datos almacenados cuando la batalla termine o cambie
  useEffect(() => {
    // Opcional: limpiar datos al desmontar el componente
    return () => {
      playerMaxHPRef.current.clear();
      cpuMaxHPRef.current.clear();
    };
  }, []);

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
      .replace(/[^a-z0-9-]/g, "") // Remove special characters
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
              <div className="hp-info">
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
                  {cpuPokemon.currentHP}/{cpuPokemon.maxHP}
                  {cpuPokemon.status === "fnt" && <div className="fainted-overlay">Fainted</div>}
                </div>
              </div>
            </div>
            <div className="pokemon-sprite">
              <img
                src={getPokemonSprite(cpuPokemon.name)}
                alt={cpuPokemon.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "";
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
                  e.target.src = "";
                }}
              />
            </div>
            <div className="pokemon-info">
              <div className="pokemon-name">{playerPokemon.name}</div>
              <div className="hp-info">
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
                  {playerPokemon.currentHP}/{playerPokemon.maxHP}
                  {playerPokemon.status === "fnt" && <div className="fainted-overlay">Fainted</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
