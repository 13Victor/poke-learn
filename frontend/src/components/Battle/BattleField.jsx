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

  // Parse CPU's Pokémon data from requestData instead of battle logs
  useEffect(() => {
    if (logs && logs.length > 0) {
      // Buscar el requestData más reciente para la CPU (p2) en los logs
      let cpuRequestData = null;

      // Recorrer los logs en orden inverso para encontrar el requestData más reciente de la CPU
      for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];
        if (typeof log === "string" && log.includes("sideupdate\np2") && log.includes("|request|")) {
          try {
            const lines = log.split("\n");
            for (const line of lines) {
              if (line.includes("|request|")) {
                const requestMatch = line.match(/\|request\|(.+)/);
                if (requestMatch) {
                  cpuRequestData = JSON.parse(requestMatch[1]);
                  console.log(`🎯 CPU RequestData encontrado:`, cpuRequestData);
                  break;
                }
              }
            }
            if (cpuRequestData) break;
          } catch (error) {
            console.error("Error parsing CPU request data:", error);
          }
        }
      }

      // Si encontramos requestData de la CPU, usarlo para obtener el HP actualizado
      if (cpuRequestData?.side?.pokemon) {
        const activeCpuPokemon = cpuRequestData.side.pokemon.find((p) => p.active);

        if (activeCpuPokemon) {
          const cpuName = activeCpuPokemon.details.split(",")[0].trim();

          let currentHP = 0;
          let maxHP = 100;
          let isFainted = false;

          console.log(
            `🎯 Procesando CPU Pokémon desde RequestData: ${cpuName}, Condición: ${activeCpuPokemon.condition}`
          );

          if (activeCpuPokemon.condition) {
            if (activeCpuPokemon.condition.includes("fnt")) {
              // Pokémon debilitado
              isFainted = true;
              currentHP = 0;
              const storedMaxHP = cpuMaxHPRef.current.get(cpuName);
              maxHP = storedMaxHP || 100;
              console.log(`💀 CPU Pokémon debilitado: ${cpuName}`);
            } else {
              // Pokémon vivo, parsear HP del requestData (ESTA ES LA FUENTE MÁS CONFIABLE)
              const hpParts = activeCpuPokemon.condition.split("/");
              if (hpParts.length === 2) {
                currentHP = parseInt(hpParts[0], 10);
                maxHP = parseInt(hpParts[1], 10);
                // Almacenar el HP máximo para uso futuro
                cpuMaxHPRef.current.set(cpuName, maxHP);
                console.log(
                  `❤️ CPU Pokémon (desde RequestData): ${cpuName}, HP FINAL DEL TURNO: ${currentHP}/${maxHP}`
                );
              }
            }
          }

          const hpPercentage = maxHP > 0 ? (currentHP / maxHP) * 100 : 0;

          setCpuPokemon({
            name: cpuName,
            currentHP,
            maxHP,
            hpPercentage,
            status: isFainted ? "fnt" : null,
          });

          console.log(
            `✅ Estado CPU actualizado desde RequestData: ${cpuName}, HP: ${currentHP}/${maxHP} (${hpPercentage.toFixed(
              1
            )}%)`
          );
          return; // Salir temprano si encontramos requestData
        }
      }

      // FALLBACK: Si no encontramos requestData, usar el método anterior de parsing de logs
      console.log(`⚠️ No se encontró RequestData para CPU, usando fallback de logs...`);

      let cpuName = null;
      let cpuCondition = null;

      // Función auxiliar para extraer nombres de Pokémon correctamente
      const extractPokemonName = (identifier) => {
        if (!identifier) return null;
        if (identifier.includes(":")) {
          return identifier.split(":")[1].trim();
        }
        return identifier.trim();
      };

      // Recorrer los logs para encontrar información del Pokémon activo
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];

        if (typeof log === "string") {
          // Buscar línea de switch para CPU
          const switchMatch = log.match(/\|switch\|p2a: ([^|]+)\|([^|]+)\|([^|]+)/);
          if (switchMatch) {
            const newPokemonName = extractPokemonName(switchMatch[1]);
            const initialCondition = switchMatch[3];

            if (!cpuName || newPokemonName !== cpuName) {
              cpuName = newPokemonName;
              cpuCondition = initialCondition;
              console.log(`🔄 Switch detectado (fallback): ${cpuName}, HP inicial: ${cpuCondition}`);
            }
          }

          // Actualizar HP con eventos posteriores
          if (cpuName) {
            const healMatch = log.match(/\|-heal\|p2a: ([^|]+)\|([^|]+)/);
            if (healMatch) {
              const healedPokemon = extractPokemonName(healMatch[1]);
              if (healedPokemon === cpuName) {
                cpuCondition = healMatch[2];
                console.log(`🩹 Heal actualizado (fallback): ${cpuName}, HP: ${cpuCondition}`);
              }
            }

            const damageMatch = log.match(/\|-damage\|p2a: ([^|]+)\|([^|]+)/);
            if (damageMatch) {
              const damagedPokemon = extractPokemonName(damageMatch[1]);
              if (damagedPokemon === cpuName) {
                cpuCondition = damageMatch[2];
                console.log(`💥 Damage actualizado (fallback): ${cpuName}, HP: ${cpuCondition}`);
              }
            }
          }
        }
      }

      // Procesar datos del fallback
      if (cpuName) {
        let currentHP = 0;
        let maxHP = 100;
        let isFainted = false;

        console.log(`🎯 Procesando CPU Pokémon (fallback): ${cpuName}, Condición FINAL: ${cpuCondition}`);

        if (cpuCondition) {
          if (cpuCondition.includes("fnt")) {
            isFainted = true;
            currentHP = 0;
            const storedMaxHP = cpuMaxHPRef.current.get(cpuName);
            maxHP = storedMaxHP || 100;
          } else {
            const hpParts = cpuCondition.split("/");
            if (hpParts.length === 2) {
              currentHP = parseInt(hpParts[0], 10);
              maxHP = parseInt(hpParts[1], 10);
              cpuMaxHPRef.current.set(cpuName, maxHP);
              console.log(`❤️ CPU Pokémon (fallback): ${cpuName}, HP FINAL: ${currentHP}/${maxHP}`);
            }
          }
        }

        const hpPercentage = maxHP > 0 ? (currentHP / maxHP) * 100 : 0;

        setCpuPokemon({
          name: cpuName,
          currentHP,
          maxHP,
          hpPercentage,
          status: isFainted ? "fnt" : null,
        });

        console.log(
          `✅ Estado CPU actualizado (fallback): ${cpuName}, HP: ${currentHP}/${maxHP} (${hpPercentage.toFixed(1)}%)`
        );
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
