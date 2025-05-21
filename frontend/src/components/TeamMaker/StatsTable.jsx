import React, { useState, useEffect, useCallback } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { usePokemonData } from "../../contexts/PokemonDataContext";

const NATURES = [
  { name: "Hardy", plus: null, minus: null },
  { name: "Lonely", plus: "atk", minus: "def" },
  { name: "Brave", plus: "atk", minus: "spe" },
  { name: "Adamant", plus: "atk", minus: "spa" },
  { name: "Naughty", plus: "atk", minus: "spd" },
  { name: "Bold", plus: "def", minus: "atk" },
  { name: "Docile", plus: null, minus: null },
  { name: "Relaxed", plus: "def", minus: "spe" },
  { name: "Impish", plus: "def", minus: "spa" },
  { name: "Lax", plus: "def", minus: "spd" },
  { name: "Timid", plus: "spe", minus: "atk" },
  { name: "Hasty", plus: "spe", minus: "def" },
  { name: "Serious", plus: null, minus: null },
  { name: "Jolly", plus: "spe", minus: "spa" },
  { name: "Naive", plus: "spe", minus: "spd" },
  { name: "Modest", plus: "spa", minus: "atk" },
  { name: "Mild", plus: "spa", minus: "def" },
  { name: "Quiet", plus: "spa", minus: "spe" },
  { name: "Bashful", plus: null, minus: null },
  { name: "Rash", plus: "spa", minus: "spd" },
  { name: "Calm", plus: "spd", minus: "atk" },
  { name: "Gentle", plus: "spd", minus: "def" },
  { name: "Sassy", plus: "spd", minus: "spe" },
  { name: "Careful", plus: "spd", minus: "spa" },
  { name: "Quirky", plus: null, minus: null },
];

const MAX_TOTAL_EVS = 508;
const MAX_STAT_EVS = 252;

const StatsTable = ({ selectedPokemon, selectedSlot }) => {
  const { getPokemons } = usePokemonData();
  const { updatePokemonStats, advanceFromStats } = useTeam();
  const [evs, setEvs] = useState({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
  const [ivs, setIvs] = useState({ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 });
  const [nature, setNature] = useState("Hardy");
  const [totalEvs, setTotalEvs] = useState(0);
  const [calculatedStats, setCalculatedStats] = useState({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
  const [baseStats, setBaseStats] = useState({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
  const [initialized, setInitialized] = useState(false);

  // Debug: Para ver los valores iniciales del Pokemon
  useEffect(() => {
    if (selectedPokemon) {
      console.log("StatsTable - selectedPokemon recibido:", selectedPokemon);
      console.log("IVs originales:", selectedPokemon.ivs);
    }
  }, [selectedPokemon]);

  // Load initial values and baseStats when Pokemon changes
  useEffect(() => {
    const loadPokemonData = async () => {
      if (selectedPokemon?.name) {
        try {
          // Reset the initialized state to prevent using old values
          setInitialized(false);

          const allPokemonData = await getPokemons();
          const fullPokemonData = allPokemonData.find((p) => p.name === selectedPokemon.name);

          if (fullPokemonData?.baseStats) {
            setBaseStats(fullPokemonData.baseStats);

            // IMPORTANTE: Guardar los valores reales de EVs e IVs del Pokémon, o usar valores por defecto si no existen
            // PROBLEMA ENCONTRADO: No estamos respetando los valores personalizados de IVs como spe: 0

            // Implementación anterior (problemática):
            // setEvs(selectedPokemon.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
            // setIvs(selectedPokemon.ivs || { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 });

            // SOLUCIÓN: Respetar TODOS los valores existentes, usando la propagación de objetos
            const defaultEvs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
            const defaultIvs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

            // Usar propagación para mantener valores personalizados como spe: 0
            const pokemonEvs = selectedPokemon.evs || {};
            const pokemonIvs = selectedPokemon.ivs || {};

            // Crear nuevos objetos combinando los valores por defecto con los valores reales del Pokémon
            const mergedEvs = { ...defaultEvs, ...pokemonEvs };
            const mergedIvs = { ...defaultIvs, ...pokemonIvs };

            console.log("IVs originales:", pokemonIvs);
            console.log("IVs combinados:", mergedIvs);

            // Establecer los estados con los valores fusionados
            setEvs(mergedEvs);
            setIvs(mergedIvs);
            setNature(selectedPokemon.nature || "Hardy");
            setInitialized(true);
          }
        } catch (error) {
          console.error("Error al obtener datos del Pokémon:", error);
        }
      }
    };

    loadPokemonData();
  }, [selectedPokemon?.name, getPokemons, selectedPokemon]);

  // Calculate total EVs
  useEffect(() => {
    const total = Object.values(evs).reduce((sum, value) => sum + value, 0);
    setTotalEvs(total);
  }, [evs]);

  // Calculate stats function
  const calculateStats = useCallback(() => {
    if (!initialized || !baseStats.hp) return {};

    const level = selectedPokemon?.level || 100;
    const natureObj = NATURES.find((n) => n.name === nature);
    const stats = {};

    // Calculate HP
    stats.hp = Math.floor(((2 * baseStats.hp + ivs.hp + Math.floor(evs.hp / 4)) * level) / 100) + level + 10;

    // Calculate other stats
    for (const stat of ["atk", "def", "spa", "spd", "spe"]) {
      let value = Math.floor(((2 * baseStats[stat] + ivs[stat] + Math.floor(evs[stat] / 4)) * level) / 100) + 5;

      if (natureObj.plus === stat) {
        value = Math.floor(value * 1.1);
      } else if (natureObj.minus === stat) {
        value = Math.floor(value * 0.9);
      }

      stats[stat] = value;
    }

    return stats;
  }, [baseStats, ivs, evs, nature, initialized, selectedPokemon?.level]);

  // Update local state when values change
  useEffect(() => {
    if (initialized && baseStats.hp > 0) {
      setCalculatedStats(calculateStats());
    }
  }, [initialized, baseStats, ivs, evs, nature, calculateStats]);

  // Handle save and continue
  const handleSaveAndContinue = () => {
    const stats = calculateStats();
    console.log("Guardando estadísticas con IVs:", ivs);
    updatePokemonStats(selectedSlot, stats, evs, ivs, nature);
    advanceFromStats();
  };

  // Handle EV changes with validation
  const handleEvChange = (stat, value) => {
    const parsedValue = parseInt(value) || 0;
    const newValue = Math.max(0, Math.min(MAX_STAT_EVS, parsedValue));

    // Calculate how many additional EVs would be added
    const difference = newValue - evs[stat];
    const newTotal = totalEvs + difference;

    // Only update if it doesn't exceed the total limit
    if (newTotal <= MAX_TOTAL_EVS) {
      setEvs((prev) => ({
        ...prev,
        [stat]: newValue,
      }));
    }
  };

  // Handle IV changes
  const handleIvChange = (stat, value) => {
    const parsedValue = parseInt(value) || 0;
    const newValue = Math.max(0, Math.min(31, parsedValue));
    setIvs((prev) => ({
      ...prev,
      [stat]: newValue,
    }));
  };

  // Handle nature changes
  const handleNatureChange = (e) => {
    setNature(e.target.value);
  };

  // Reset EVs to zero
  const resetEvs = () => {
    setEvs({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
  };

  // Set IVs to max (31)
  const maxIvs = () => {
    setIvs({ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 });
  };

  // Get stat label for display
  const getStatLabel = (stat) => {
    switch (stat) {
      case "hp":
        return "HP";
      case "atk":
        return "Attack";
      case "def":
        return "Defense";
      case "spa":
        return "Sp. Atk";
      case "spd":
        return "Sp. Def";
      case "spe":
        return "Speed";
      default:
        return stat;
    }
  };

  // Get CSS class for stats affected by nature
  const getNatureClass = (stat) => {
    const natureObj = NATURES.find((n) => n.name === nature);
    if (!natureObj) return "";

    if (natureObj.plus === stat) return "nature-plus";
    if (natureObj.minus === stat) return "nature-minus";
    return "";
  };

  if (!selectedPokemon || !selectedPokemon.name) {
    return <div className="table-container">Selecciona un Pokémon primero</div>;
  }

  return (
    <div className="table-container">
      <h2>Configuración de estadísticas para {selectedPokemon.name}</h2>

      <div className="statsControls">
        <div className="natureSelector">
          <label htmlFor="nature">Naturaleza:</label>
          <select id="nature" value={nature} onChange={handleNatureChange}>
            {NATURES.map((n) => (
              <option key={n.name} value={n.name}>
                {n.name} {n.plus && n.minus ? `(+${getStatLabel(n.plus)}, -${getStatLabel(n.minus)})` : "(Neutral)"}
              </option>
            ))}
          </select>
        </div>

        <div className="evCounter">
          <span>EVs utilizados: </span>
          <span className={totalEvs > MAX_TOTAL_EVS ? "ev-error" : ""}>
            {totalEvs} / {MAX_TOTAL_EVS}
          </span>
        </div>

        <div className="actionButtons">
          <button onClick={resetEvs}>Reiniciar EVs</button>
          <button onClick={maxIvs}>Maximizar IVs</button>
          <button onClick={handleSaveAndContinue} className="saveButton">
            Guardar y continuar
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="statsTable">
          <thead>
            <tr>
              <th>Estadística</th>
              <th>Base</th>
              <th>EVs (0-252)</th>
              <th>IVs (0-31)</th>
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(evs).map(([stat, value], index) => (
              <tr key={stat} className={`${getNatureClass(stat)} ${index % 2 === 0 ? "even-row" : "odd-row"}`}>
                <td>{getStatLabel(stat)}</td>
                <td>{baseStats[stat] || 0}</td>
                <td>
                  <div className="input-group">
                    <input
                      type="range"
                      min="0"
                      max="252"
                      step="4"
                      value={value}
                      onChange={(e) => handleEvChange(stat, e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      max="252"
                      step="4"
                      value={value}
                      onChange={(e) => handleEvChange(stat, e.target.value)}
                    />
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={ivs[stat]}
                    onChange={(e) => handleIvChange(stat, e.target.value)}
                  />
                </td>
                <td className="finalStat">{calculatedStats[stat]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Debug info */}
      <div
        className="debug-info"
        style={{ fontSize: "10px", color: "#666", margin: "10px 0", display: "flex", flexDirection: "column" }}
      >
        <div>IVs originales: {JSON.stringify(selectedPokemon.ivs)}</div>
        <div>IVs actuales: {JSON.stringify(ivs)}</div>
      </div>

      <div className="statsInfo">
        <p>Cada 4 EVs = +1 en la estadística final al nivel 100</p>
        <p>Cada IV = +1 en la estadística final al nivel 100</p>
        <p>La naturaleza aumenta una estadística un 10% y reduce otra un 10% (excepto las neutrales)</p>
      </div>
    </div>
  );
};

export default StatsTable;
