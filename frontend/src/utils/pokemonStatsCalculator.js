// Modificadores de naturaleza - centralizados
const NATURE_MODIFIERS = {
  Adamant: { increased: "atk", decreased: "spa" },
  Bashful: { increased: null, decreased: null },
  Bold: { increased: "def", decreased: "atk" },
  Brave: { increased: "atk", decreased: "spe" },
  Calm: { increased: "spd", decreased: "atk" },
  Careful: { increased: "spd", decreased: "spa" },
  Docile: { increased: null, decreased: null },
  Gentle: { increased: "spd", decreased: "def" },
  Hardy: { increased: null, decreased: null },
  Hasty: { increased: "spe", decreased: "def" },
  Impish: { increased: "def", decreased: "spa" },
  Jolly: { increased: "spe", decreased: "spa" },
  Lax: { increased: "def", decreased: "spd" },
  Lonely: { increased: "atk", decreased: "def" },
  Mild: { increased: "spa", decreased: "def" },
  Modest: { increased: "spa", decreased: "atk" },
  Naive: { increased: "spe", decreased: "spd" },
  Naughty: { increased: "atk", decreased: "spd" },
  Quiet: { increased: "spa", decreased: "spe" },
  Quirky: { increased: null, decreased: null },
  Rash: { increased: "spa", decreased: "spd" },
  Relaxed: { increased: "def", decreased: "spe" },
  Sassy: { increased: "spd", decreased: "spe" },
  Serious: { increased: null, decreased: null },
  Timid: { increased: "spe", decreased: "atk" },
};

// Valores por defecto para EVs e IVs
const DEFAULT_EVS = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
const DEFAULT_IVS = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

const applyNatureModifier = (stat, value, nature) => {
  const natureInfo = NATURE_MODIFIERS[nature] || { increased: null, decreased: null };

  if (natureInfo.increased === stat) return Math.floor(value * 1.1);
  if (natureInfo.decreased === stat) return Math.floor(value * 0.9);
  return value;
};

export const calculatePokemonStats = (baseStats, options = {}) => {
  // Validar que baseStats existe
  if (!baseStats || typeof baseStats !== "object") {
    console.warn("calculatePokemonStats: baseStats is required");
    return null;
  }

  // Extraer opciones con valores por defecto
  const { evs = {}, ivs = {}, nature = "Hardy", level = 100 } = options;

  // Combinar con valores por defecto usando spread operator
  const safeEvs = { ...DEFAULT_EVS, ...evs };
  const safeIvs = { ...DEFAULT_IVS, ...ivs };

  // Validar que las estadísticas base necesarias existen
  const requiredStats = ["hp", "atk", "def", "spa", "spd", "spe"];
  for (const stat of requiredStats) {
    if (typeof baseStats[stat] !== "number") {
      console.warn(`calculatePokemonStats: Missing or invalid baseStat for ${stat}`);
      return null;
    }
  }

  const stats = {};

  // Calcular HP (fórmula especial)
  stats.hp = Math.floor(((2 * baseStats.hp + safeIvs.hp + Math.floor(safeEvs.hp / 4)) * level) / 100) + level + 10;

  // Calcular el resto de estadísticas
  for (const stat of ["atk", "def", "spa", "spd", "spe"]) {
    const baseValue =
      Math.floor(((2 * baseStats[stat] + safeIvs[stat] + Math.floor(safeEvs[stat] / 4)) * level) / 100) + 5;

    stats[stat] = applyNatureModifier(stat, baseValue, nature);
  }

  return stats;
};

export const calculateBaseDisplayStats = (baseStats, level = 100) => {
  return calculatePokemonStats(baseStats, {
    evs: DEFAULT_EVS,
    ivs: DEFAULT_IVS,
    nature: "Hardy",
    level,
  });
};

export const getNatureInfo = (nature) => {
  return NATURE_MODIFIERS[nature] || { increased: null, decreased: null };
};

export const getAllNatures = () => {
  return Object.entries(NATURE_MODIFIERS).map(([name, modifiers]) => ({
    name,
    plus: modifiers.increased,
    minus: modifiers.decreased,
  }));
};

export const validateEvs = (evs, maxTotal = 508, maxStat = 252) => {
  const errors = [];

  // Validar total
  const total = Object.values(evs).reduce((sum, value) => sum + (value || 0), 0);
  if (total > maxTotal) {
    errors.push(`Total EVs (${total}) exceed maximum (${maxTotal})`);
  }

  // Validar cada estadística
  for (const [stat, value] of Object.entries(evs)) {
    if (value > maxStat) {
      errors.push(`${stat} EVs (${value}) exceed maximum (${maxStat})`);
    }
    if (value < 0) {
      errors.push(`${stat} EVs cannot be negative`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    total,
  };
};

export const validateIvs = (ivs) => {
  const errors = [];

  for (const [stat, value] of Object.entries(ivs)) {
    if (value > 31) {
      errors.push(`${stat} IV (${value}) exceeds maximum (31)`);
    }
    if (value < 0) {
      errors.push(`${stat} IV cannot be negative`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
