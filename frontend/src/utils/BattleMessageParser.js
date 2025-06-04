// src/utils/BattleMessageParser.js

export class BattleMessageParser {
  constructor() {
    this.p1Name = "Player";
    this.p2Name = "CPU";
    this.turn = 0;
    this.pendingEffectivenessMessages = []; // Store effectiveness messages to show after damage
  }

  // Main function to parse multiple logs
  parseMessages(logs) {
    const parsedMessages = [];

    for (const log of logs) {
      if (!log || typeof log !== "string") continue;

      const lines = log.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;

        const parsed = this.parseLine(line);
        if (parsed && parsed.trim() !== "") {
          parsedMessages.push(parsed);
        }
      }
    }

    // Filter consecutive duplicate messages
    const filteredMessages = [];
    for (let i = 0; i < parsedMessages.length; i++) {
      if (i === 0 || parsedMessages[i] !== parsedMessages[i - 1]) {
        filteredMessages.push(parsedMessages[i]);
      }
    }

    return filteredMessages.filter((msg) => msg.trim() !== "");
  }

  // Parse an individual line
  parseLine(line) {
    if (!line.startsWith("|")) {
      return null;
    }

    const parts = line.split("|");
    const command = parts[1];

    switch (command) {
      case "player":
        return this.parsePlayer(parts);
      case "turn":
        return this.parseTurn(parts);
      case "start":
        return this.parseStart(parts);
      case "win":
        return this.parseWin(parts);
      case "tie":
        return this.parseTie(parts);
      case "switch":
        return this.parseSwitch(parts);
      case "drag":
        return this.parseDrag(parts);
      case "move":
        return this.parseMove(parts);
      case "faint":
        return this.parseFaint(parts);
      case "-damage":
        return this.parseDamage(parts);
      case "-heal":
        return this.parseHeal(parts);
      case "-status":
        return this.parseStatus(parts);
      case "-curestatus":
        return this.parseCureStatus(parts);
      case "-boost":
        return this.parseBoost(parts);
      case "-unboost":
        return this.parseUnboost(parts);
      case "-weather":
        return this.parseWeather(parts);
      case "-fieldstart":
        return this.parseFieldStart(parts);
      case "-fieldend":
        return this.parseFieldEnd(parts);
      case "-sidestart":
        return this.parseSideStart(parts);
      case "-sideend":
        return this.parseSideEnd(parts);
      case "-crit":
        // Store critical hit message instead of returning immediately
        this.pendingEffectivenessMessages.push(this.parseCrit(parts));
        return null;
      case "-supereffective":
        // Store super effective message instead of returning immediately
        this.pendingEffectivenessMessages.push(this.parseSuperEffective(parts));
        return null;
      case "-resisted":
        // Store resisted message instead of returning immediately
        this.pendingEffectivenessMessages.push(this.parseResisted(parts));
        return null;
      case "-immune":
        // Store immune message instead of returning immediately
        this.pendingEffectivenessMessages.push(this.parseImmune(parts));
        return null;
      case "-miss":
        return this.parseMiss(parts);
      case "-fail":
        return this.parseFail(parts);
      case "cant":
        return this.parseCant(parts);
      case "teampreview":
        return "🔍 **Team Preview phase started**";
      case "upkeep":
        return null; // Remove turn maintenance phase message
      default:
        return null;
    }
  }

  // Methods to parse specific commands
  parsePlayer(parts) {
    const [, , side, name] = parts;
    if (side === "p1") {
      this.p1Name = name || "Player";
    } else if (side === "p2") {
      this.p2Name = name || "CPU";
    }
    return null; // Don't show message for player setup
  }

  parseTurn(parts) {
    const [, , turnNum] = parts;
    this.turn = parseInt(turnNum, 10);
    return `\n🎯 **=== TURN ${turnNum} ===**\n`;
  }

  parseStart() {
    return `🚀 **The battle between ${this.p1Name} and ${this.p2Name} has begun!**`;
  }

  parseWin(parts) {
    const [, , winner] = parts;
    return `🏆 **${winner} has won the battle!**`;
  }

  parseTie() {
    return `🤝 **The battle ended in a tie!**`;
  }

  parseSwitch(parts) {
    const [, , pokemon, details] = parts;
    const trainerName = this.getTrainerName(pokemon);
    const pokemonName = this.getPokemonName(pokemon);
    const species = details.split(",")[0];

    return `🔄 ${trainerName} sends out **${species}**${pokemonName !== species ? ` (${pokemonName})` : ""}`;
  }

  parseDrag(parts) {
    const [, , pokemon, details] = parts;
    const trainerName = this.getTrainerName(pokemon);
    const pokemonName = this.getPokemonName(pokemon);
    const species = details.split(",")[0];

    return `💨 **${species}** from ${trainerName} was forced into battle`;
  }

  parseMove(parts) {
    const [, , pokemon, moveName, target] = parts;
    const trainerName = this.getTrainerName(pokemon);
    const pokemonName = this.getPokemonName(pokemon);

    if (target && target !== pokemon) {
      const targetName = this.getPokemonName(target);
      return `⚔️ **${pokemonName}** uses **${moveName}** on **${targetName}**`;
    }
    return `⚔️ **${pokemonName}** uses **${moveName}**`;
  }

  parseActivate(parts) {
    const [, , pokemon, effect, target] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const effectName = this.getEffectName(effect);

    // Special cases for common effects
    if (effect && effect.includes("substitute")) {
      return `🛡️ **${pokemonName}** is protected by **Substitute**`;
    }

    if (effect && effect.includes("confusion")) {
      return `😵 **${pokemonName}** is confused and hurts itself`;
    }

    return `✨ **${effectName}** activated on **${pokemonName}**`;
  }

  parseItem(parts) {
    const [, , pokemon, item] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const itemName = this.getEffectName(item);
    return `🎒 **${pokemonName}** has **${itemName}**`;
  }

  parseEndItem(parts) {
    const [, , pokemon, item] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const itemName = this.getEffectName(item);
    return `💔 **${pokemonName}** lost its **${itemName}**`;
  }

  parseAbility(parts) {
    const [, , pokemon, ability] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const abilityName = this.getEffectName(ability);
    return `⭐ **${abilityName}** of **${pokemonName}** activated`;
  }

  parseFaint(parts) {
    const [, , pokemon] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    return `💀 **${pokemonName}** fainted`;
  }

  parseDamage(parts) {
    const [, , pokemon, hpStatus] = parts;
    const pokemonName = this.getPokemonName(pokemon);

    if (hpStatus === "0 fnt") {
      return null; // The faint message already handles this
    }

    // Skip percentage damage messages (they contain "/100" at the end)
    if (hpStatus && hpStatus.includes("/100")) {
      return null;
    }

    // Create damage message
    const damageMessage = `💥 **${pokemonName}** takes damage`;

    // Check if we have pending effectiveness messages to show after damage
    if (this.pendingEffectivenessMessages.length > 0) {
      const effectivenessMessages = [...this.pendingEffectivenessMessages];
      this.pendingEffectivenessMessages = []; // Clear pending messages

      // Return damage message followed by effectiveness messages
      return [damageMessage, ...effectivenessMessages].join("\n");
    }

    return damageMessage;
  }

  parseHeal(parts) {
    const [, , pokemon] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    return `💚 **${pokemonName}** recovers HP`;
  }

  parseStatus(parts) {
    const [, , pokemon, status] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const statusName = this.getStatusName(status);
    return `🔥 **${pokemonName}** was affected by **${statusName}**`;
  }

  parseCureStatus(parts) {
    const [, , pokemon, status] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const statusName = this.getStatusName(status);
    return `✨ **${pokemonName}** was cured of **${statusName}**`;
  }

  parseBoost(parts) {
    const [, , pokemon, stat, amount] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const statName = this.getStatName(stat);
    const level = this.getBoostLevel(parseInt(amount, 10));
    return `📈 **${pokemonName}**'s **${statName}** ${level}`;
  }

  parseUnboost(parts) {
    const [, , pokemon, stat, amount] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const statName = this.getStatName(stat);
    const level = this.getBoostLevel(parseInt(amount, 10));
    return `📉 **${pokemonName}**'s **${statName}** ${level.replace("rose", "fell").replace("increased", "decreased")}`;
  }

  parseWeather(parts) {
    const [, , weather] = parts;
    if (!weather || weather === "none") {
      return `🌤️ The weather returned to normal`;
    }
    const weatherName = this.getWeatherName(weather);
    return `🌦️ **${weatherName}** is active`;
  }

  parseFieldStart(parts) {
    const [, , effect] = parts;
    const effectName = this.getEffectName(effect);
    return `🌍 **${effectName}** is active on the field`;
  }

  parseFieldEnd(parts) {
    const [, , effect] = parts;
    const effectName = this.getEffectName(effect);
    return `🌍 **${effectName}** is no longer active`;
  }

  parseSideStart(parts) {
    const [, , side, effect] = parts;
    const teamName = this.getTeamName(side);
    const effectName = this.getEffectName(effect);
    return `🛡️ **${effectName}** is active on ${teamName}'s side`;
  }

  parseSideEnd(parts) {
    const [, , side, effect] = parts;
    const teamName = this.getTeamName(side);
    const effectName = this.getEffectName(effect);
    return `🛡️ **${effectName}** is no longer active on ${teamName}'s side`;
  }

  parseCrit(parts) {
    const [, , pokemon] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    return `💫 **Critical hit on ${pokemonName}!**`;
  }

  parseSuperEffective(parts) {
    const [, , pokemon] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    return `⚡ **It's super effective against ${pokemonName}!**`;
  }

  parseResisted(parts) {
    const [, , pokemon] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    return `🛡️ **It's not very effective against ${pokemonName}...**`;
  }

  parseImmune(parts) {
    const [, , pokemon] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    return `🚫 **${pokemonName} is immune to the attack**`;
  }

  parseMiss(parts) {
    const [, , source, target] = parts;
    const targetName = target ? this.getPokemonName(target) : "the target";
    return `❌ **The attack missed ${targetName}!**`;
  }

  parseFail(parts) {
    const [, , pokemon] = parts;
    if (pokemon) {
      const pokemonName = this.getPokemonName(pokemon);
      return `❌ **The move failed against ${pokemonName}**`;
    }
    return `❌ **The move failed**`;
  }

  parseCant(parts) {
    const [, , pokemon, reason, move] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    if (move) {
      return `🚫 **${pokemonName}** can't use **${move}** due to **${reason}**`;
    }
    return `🚫 **${pokemonName}** can't move due to **${reason}**`;
  }

  // Helper methods
  getTrainerName(pokemon) {
    if (pokemon.startsWith("p1")) return this.p1Name;
    if (pokemon.startsWith("p2")) return this.p2Name;
    return "Trainer";
  }

  getPokemonName(pokemon) {
    if (!pokemon) return "Pokémon";
    if (pokemon.includes(":")) {
      return pokemon.split(":")[1].trim();
    }
    return pokemon;
  }

  getTeamName(side) {
    if (side === "p1") return this.p1Name;
    if (side === "p2") return this.p2Name;
    return "Team";
  }

  getStatusName(status) {
    const statusMap = {
      brn: "Burn",
      par: "Paralysis",
      slp: "Sleep",
      frz: "Freeze",
      psn: "Poison",
      tox: "Badly Poisoned",
      confusion: "Confusion",
    };
    return statusMap[status] || status;
  }

  getStatName(stat) {
    const statMap = {
      atk: "Attack",
      def: "Defense",
      spa: "Special Attack",
      spd: "Special Defense",
      spe: "Speed",
      accuracy: "Accuracy",
      evasion: "Evasion",
    };
    return statMap[stat] || stat;
  }

  getBoostLevel(amount) {
    if (amount >= 3) return "rose drastically";
    if (amount === 2) return "rose sharply";
    if (amount === 1) return "rose";
    return "changed";
  }

  getWeatherName(weather) {
    const weatherMap = {
      sunnyday: "Harsh Sunlight",
      raindance: "Rain",
      sandstorm: "Sandstorm",
      hail: "Hail",
      snow: "Snow",
      snowscape: "Snowscape",
      primordialsea: "Primordial Sea",
      desolateland: "Desolate Land",
      deltastream: "Delta Stream",
    };
    return weatherMap[weather] || weather;
  }

  getEffectName(effect) {
    // Remove prefixes like "move:" or "ability:"
    if (effect && effect.includes(":")) {
      effect = effect.split(":")[1];
    }

    const effectMap = {
      // Common moves
      tackle: "Tackle",
      thunderbolt: "Thunderbolt",
      flamethrower: "Flamethrower",
      surf: "Surf",
      earthquake: "Earthquake",
      psychic: "Psychic",
      icebeam: "Ice Beam",
      shadowball: "Shadow Ball",
      energyball: "Energy Ball",
      airslash: "Air Slash",

      // Status moves
      toxic: "Toxic",
      thunderwave: "Thunder Wave",
      willowisp: "Will-O-Wisp",
      spore: "Spore",
      sleeppowder: "Sleep Powder",
      substitute: "Substitute",
      protect: "Protect",
      recover: "Recover",
      roost: "Roost",

      // Field effects
      reflect: "Reflect",
      lightscreen: "Light Screen",
      stealthrock: "Stealth Rock",
      spikes: "Spikes",
      toxicspikes: "Toxic Spikes",
      tailwind: "Tailwind",
      trickroom: "Trick Room",
      wonderroom: "Wonder Room",
      magicroom: "Magic Room",
      electricterrain: "Electric Terrain",
      grassyterrain: "Grassy Terrain",
      mistyterrain: "Misty Terrain",
      psychicterrain: "Psychic Terrain",

      // Common abilities
      pressure: "Pressure",
      intimidate: "Intimidate",
      levitate: "Levitate",
      flashfire: "Flash Fire",
      waterabsorb: "Water Absorb",
      voltabsorb: "Volt Absorb",
      immunity: "Immunity",
      naturalcure: "Natural Cure",
      serenegrace: "Serene Grace",
      compoundeyes: "Compound Eyes",
      speedboost: "Speed Boost",
      adaptability: "Adaptability",
      technician: "Technician",
      skilllink: "Skill Link",
      rockhead: "Rock Head",
      reckless: "Reckless",
      sheerforce: "Sheer Force",

      // Common items
      leftovers: "Leftovers",
      lifeorb: "Life Orb",
      choiceband: "Choice Band",
      choicescarf: "Choice Scarf",
      choicespecs: "Choice Specs",
      focussash: "Focus Sash",
      sitrusberry: "Sitrus Berry",
      lumberry: "Lum Berry",
      flameorb: "Flame Orb",
      toxicorb: "Toxic Orb",
      blacksludge: "Black Sludge",
      rockyhelmet: "Rocky Helmet",
      airballoon: "Air Balloon",
      eviolite: "Eviolite",
    };

    return effectMap[effect?.toLowerCase()] || effect || "Unknown Effect";
  }
}
