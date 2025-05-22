import React, { useState, useEffect, useCallback } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import { calculatePokemonStats, getAllNatures, validateEvs, validateIvs } from "../../utils/pokemonStatsCalculator";

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

  // Obtener todas las naturalezas usando la utilidad
  const NATURES = getAllNatures();

  // Load initial values and baseStats when Pokemon changes
  useEffect(() => {
    const loadPokemonData = async () => {
      if (selectedPokemon?.name) {
        try {
          setInitialized(false);

          const allPokemonData = await getPokemons();
          const fullPokemonData = allPokemonData.find((p) => p.name === selectedPokemon.name);

          if (fullPokemonData?.baseStats) {
            setBaseStats(fullPokemonData.baseStats);

            // Combinar valores usando spread operator para respetar valores personalizados
            const defaultEvs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
            const defaultIvs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

            const pokemonEvs = selectedPokemon.evs || {};
            const pokemonIvs = selectedPokemon.ivs || {};

            const mergedEvs = { ...defaultEvs, ...pokemonEvs };
            const mergedIvs = { ...defaultIvs, ...pokemonIvs };

            console.log("IVs originales:", pokemonIvs);
            console.log("IVs combinados:", mergedIvs);

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

  // Calculate stats using the centralized utility
  const calculateStats = useCallback(() => {
    if (!initialized || !baseStats.hp) return {};

    return calculatePokemonStats(baseStats, {
      evs,
      ivs,
      nature,
      level: selectedPokemon?.level || 100,
    });
  }, [baseStats, ivs, evs, nature, initialized, selectedPokemon?.level]);

  // Update local state when values change
  useEffect(() => {
    if (initialized && baseStats.hp > 0) {
      const stats = calculateStats();
      if (stats) {
        setCalculatedStats(stats);
      }
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

    const newEvs = { ...evs, [stat]: newValue };
    const validation = validateEvs(newEvs, MAX_TOTAL_EVS, MAX_STAT_EVS);

    if (validation.isValid) {
      setEvs(newEvs);
    }
  };

  // Handle IV changes with validation
  const handleIvChange = (stat, value) => {
    const parsedValue = parseInt(value) || 0;
    const newValue = Math.max(0, Math.min(31, parsedValue));

    const newIvs = { ...ivs, [stat]: newValue };
    const validation = validateIvs(newIvs);

    if (validation.isValid) {
      setIvs(newIvs);
    }
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
    const labels = {
      hp: "HP",
      atk: "Attack",
      def: "Defense",
      spa: "Sp. Atk",
      spd: "Sp. Def",
      spe: "Speed",
    };
    return labels[stat] || stat;
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
