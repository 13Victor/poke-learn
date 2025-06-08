// src/utils/BattleMessageParser.js - VERSIÓN CORREGIDA

export class BattleMessageParser {
  constructor() {
    this.p1Name = "Player";
    this.p2Name = "CPU";
    this.turn = 0;
    this.pendingEffectivenessMessages = [];
    this.battleStarted = false;
    this.teamPreviewActive = false;
    this.activeWeather = null;
    this.fieldConditions = [];
    this.sideConditions = { p1: [], p2: [] };
    this.currentMove = null; // Track current move for effectiveness messages
    this.ignoreSplitDamage = false; // Flag to ignore split damage messages
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
        if (parsed) {
          // Si es un array de mensajes (para efectividad combinada), agregar todos
          if (Array.isArray(parsed)) {
            for (const message of parsed) {
              if (message && typeof message === "string" && message.trim() !== "") {
                parsedMessages.push(message.trim());
              }
            }
          } else if (typeof parsed === "string" && parsed.trim() !== "") {
            parsedMessages.push(parsed.trim());
          }
        }
      }
    }

    // Filter consecutive duplicate messages but keep important ones
    const filteredMessages = [];
    for (let i = 0; i < parsedMessages.length; i++) {
      const current = parsedMessages[i];
      const previous = parsedMessages[i - 1];

      // Always keep turn starts, battle state changes, and different messages
      if (
        i === 0 ||
        current !== previous ||
        current.includes("TURN") ||
        current.includes("🏆") ||
        current.includes("🤝") ||
        current.includes("🚀")
      ) {
        filteredMessages.push(current);
      }
    }

    return filteredMessages;
  }

  // Parse an individual line with enhanced functionality
  parseLine(line) {
    if (!line.startsWith("|")) {
      return null;
    }

    const parts = line.split("|");
    const command = parts[1];

    // Handle special parsing for commands with brackets
    const { args, kwArgs } = this.parseBattleLine(line);

    switch (command) {
      case "player":
        return this.parsePlayer(args);
      case "teamsize":
        return this.parseTeamSize(args);
      case "gen":
        return this.parseGen(args);
      case "tier":
        return this.parseTier(args);
      case "rule":
        return this.parseRule(args);
      case "clearpoke":
        return this.parseClearPoke();
      case "poke":
        return this.parsePoke(args);
      case "teampreview":
        return this.parseTeamPreview(args);
      case "start":
        return this.parseStart(args);
      case "turn":
        return this.parseTurn(args);
      case "win":
        return this.parseWin(args);
      case "tie":
        return this.parseTie(args);
      case "switch":
        return this.parseSwitch(args);
      case "drag":
        return this.parseDrag(args);
      case "replace":
        return this.parseReplace(args);
      case "move":
        this.currentMove = { pokemon: args[1], target: args[3] }; // Track current move
        return this.parseMove(args, kwArgs);
      case "faint":
        return this.parseFaint(args);
      case "cant":
        return this.parseCant(args, kwArgs);
      case "split":
        // Ignore split messages to prevent duplicate damage
        this.ignoreSplitDamage = true;
        return null;
      case "-damage":
        if (this.ignoreSplitDamage) {
          this.ignoreSplitDamage = false;
          return null; // Skip this damage message as it's a duplicate from split
        }
        return this.parseDamage(args, kwArgs);
      case "-heal":
        return this.parseHeal(args, kwArgs);
      case "-status":
        return this.parseStatus(args, kwArgs);
      case "-curestatus":
        return this.parseCureStatus(args, kwArgs);
      case "-boost":
        return this.parseBoost(args, kwArgs);
      case "-unboost":
        return this.parseUnboost(args, kwArgs);
      case "-weather":
        return this.parseWeather(args, kwArgs);
      case "-fieldstart":
        return this.parseFieldStart(args, kwArgs);
      case "-fieldend":
        return this.parseFieldEnd(args);
      case "-sidestart":
        return this.parseSideStart(args);
      case "-sideend":
        return this.parseSideEnd(args);
      case "-crit":
        // Only add crit message if it's for the current move's target
        if (this.currentMove && args[1] === this.currentMove.target) {
          this.pendingEffectivenessMessages.push(this.parseCrit(args));
        }
        return null;
      case "-supereffective":
        // Only add effectiveness message if it's for the current move's target
        if (this.currentMove && args[1] === this.currentMove.target) {
          this.pendingEffectivenessMessages.push(this.parseSuperEffective(args));
        }
        return null;
      case "-resisted":
        // Only add effectiveness message if it's for the current move's target
        if (this.currentMove && args[1] === this.currentMove.target) {
          this.pendingEffectivenessMessages.push(this.parseResisted(args));
        }
        return null;
      case "-immune":
        return this.parseImmune(args, kwArgs);
      case "-miss":
        return this.parseMiss(args);
      case "-fail":
        return this.parseFail(args, kwArgs);
      case "-block":
        return this.parseBlock(args, kwArgs);
      case "-activate":
        return this.parseActivate(args, kwArgs);
      case "-start":
        return this.parseStartEffect(args, kwArgs);
      case "-end":
        return this.parseEndEffect(args, kwArgs);
      case "-ability":
        return this.parseAbility(args, kwArgs);
      case "-item":
        return this.parseItem(args, kwArgs);
      case "-enditem":
        return this.parseEndItem(args, kwArgs);
      case "-transform":
        return this.parseTransform(args, kwArgs);
      case "-mega":
        return this.parseMega(args);
      case "-primal":
        return this.parsePrimal(args);
      case "-burst":
        return this.parseBurst(args);
      case "-terastallize":
        return this.parseTerastallize(args);
      case "upkeep":
        // Clear current move context at upkeep
        this.currentMove = null;
        this.pendingEffectivenessMessages = [];
        return null;
      case "request":
        return null; // Handled separately
      default:
        return null;
    }
  }

  // Enhanced line parsing to handle brackets like Showdown
  parseBattleLine(line) {
    if (!line.startsWith("|")) {
      return { args: ["", line], kwArgs: {} };
    }

    let args = line.slice(1).split("|");
    const kwArgs = {};

    // Process bracketed arguments like [from] ability:Flash Fire
    while (args.length > 1) {
      const lastArg = args[args.length - 1];
      if (!lastArg.startsWith("[")) break;

      const bracketPos = lastArg.indexOf("]");
      if (bracketPos <= 0) break;

      const key = lastArg.slice(1, bracketPos);
      const value = lastArg.slice(bracketPos + 1).trim() || ".";
      kwArgs[key] = value;
      args.pop();
    }

    return { args, kwArgs };
  }

  // Parsing methods
  parsePlayer(args) {
    const [, side, name] = args;
    if (side === "p1") {
      this.p1Name = name || "Player";
    } else if (side === "p2") {
      this.p2Name = name || "CPU";
    }
    return `👤 **${name}** joined as ${side === "p1" ? "Player" : "CPU"}`;
  }

  parseTeamSize(args) {
    const [, side, size] = args;
    const player = side === "p1" ? this.p1Name : this.p2Name;
    return `📊 **${player}** brought ${size} Pokémon`;
  }

  parseGen(args) {
    const [, gen] = args;
    return `🎮 **Generation ${gen}** battle`;
  }

  parseTier(args) {
    const [, tier] = args;
    return `🏆 **Format: ${tier}**`;
  }

  parseRule(args) {
    const [, rule] = args;
    return `📋 **Rule:** ${rule}`;
  }

  parseClearPoke() {
    this.teamPreviewActive = true;
    return null;
  }

  parsePoke(args) {
    if (!this.teamPreviewActive) return null;
    const [, side, details] = args;
    const player = side === "p1" ? this.p1Name : this.p2Name;
    const species = details.split(",")[0];
    return `🔍 **${player}** revealed **${species}**`;
  }

  parseTeamPreview(args) {
    const [, count] = args;
    return `🔍 **Team Preview** - Choose ${count || 6} Pokémon to bring`;
  }

  parseStart() {
    this.battleStarted = true;
    this.teamPreviewActive = false;
    return `🚀 **The battle between ${this.p1Name} and ${this.p2Name} begins!**`;
  }

  parseTurn(args) {
    const [, turnNum] = args;
    this.turn = parseInt(turnNum, 10);

    // Clear any pending messages at turn start
    this.currentMove = null;
    this.pendingEffectivenessMessages = [];
    this.ignoreSplitDamage = false;

    // Add weather/field condition reminders every few turns
    let conditions = [];
    if (this.activeWeather) {
      conditions.push(`☁️ ${this.activeWeather}`);
    }
    if (this.fieldConditions.length > 0) {
      conditions.push(`🌍 ${this.fieldConditions.join(", ")}`);
    }

    const conditionText = conditions.length > 0 ? `\n${conditions.join(" | ")}` : "";
    return `\n🎯 **TURN ${turnNum}${conditionText}**\n`;
  }

  parseMove(args, kwArgs) {
    const [, pokemon, moveName, target] = args;
    const pokemonName = this.getPokemonName(pokemon);

    let moveText = `⚔️ **${pokemonName}** uses **${moveName}**`;

    // Add target information
    if (target && target !== pokemon) {
      const targetName = this.getPokemonName(target);
      moveText += ` on **${targetName}**`;
    }

    // Add special move context
    if (kwArgs.from) {
      const effect = this.getEffectName(kwArgs.from);
      moveText += ` (via ${effect})`;
    }

    if (kwArgs.miss) {
      moveText += " - **MISSED!**";
    }

    return moveText;
  }

  parseDamage(args, kwArgs) {
    const [, pokemon, hpStatus] = args;
    const pokemonName = this.getPokemonName(pokemon);

    if (hpStatus === "0 fnt") {
      return null; // Faint message will handle this
    }

    // Enhanced damage context
    let damageText = `💥 **${pokemonName}** takes damage`;

    if (kwArgs.from) {
      // CORRECCIÓN: Primero intentar como estado de status, luego como efecto general
      const statusName = this.getStatusName(kwArgs.from);
      const effectName = statusName !== kwArgs.from ? statusName : this.getEffectName(kwArgs.from);

      const source = kwArgs.of ? this.getPokemonName(kwArgs.of) : null;

      if (source && source !== pokemonName) {
        damageText = `💥 **${pokemonName}** takes damage from **${source}**'s **${effectName}**`;
      } else {
        damageText = `💥 **${pokemonName}** takes damage from **${effectName}**`;
      }
    }

    // Add effectiveness messages if any are pending and this damage is for the current move's target
    if (this.pendingEffectivenessMessages.length > 0 && this.currentMove && pokemon === this.currentMove.target) {
      const effectivenessMessages = [...this.pendingEffectivenessMessages];
      this.pendingEffectivenessMessages = [];
      return [damageText, ...effectivenessMessages];
    }

    return damageText;
  }

  parseWeather(args, kwArgs) {
    const [, weather] = args;

    if (!weather || weather === "none") {
      this.activeWeather = null;
      return `🌤️ **The weather cleared up**`;
    }

    const weatherName = this.getWeatherName(weather);
    this.activeWeather = weatherName;

    if (kwArgs.upkeep) {
      return `🌦️ **${weatherName}** continues`;
    }

    if (kwArgs.of) {
      const source = this.getPokemonName(kwArgs.of);
      return `🌦️ **${source}** summoned **${weatherName}**`;
    }

    return `🌦️ **${weatherName}** began`;
  }

  parseFieldStart(args, kwArgs) {
    const [, effect] = args;
    const effectName = this.getEffectName(effect);

    if (!this.fieldConditions.includes(effectName)) {
      this.fieldConditions.push(effectName);
    }

    if (kwArgs.of) {
      const source = this.getPokemonName(kwArgs.of);
      return `🌍 **${source}** created **${effectName}**`;
    }

    return `🌍 **${effectName}** is now active`;
  }

  parseFieldEnd(args) {
    const [, effect] = args;
    const effectName = this.getEffectName(effect);

    this.fieldConditions = this.fieldConditions.filter((c) => c !== effectName);

    return `🌍 **${effectName}** faded`;
  }

  parseSideStart(args) {
    const [, side, effect] = args;
    const teamName = this.getTeamName(side);
    const effectName = this.getEffectName(effect);

    // Extract the actual side (p1 or p2) from the full side identifier
    const actualSide = side.startsWith("p1") ? "p1" : "p2";

    if (!this.sideConditions[actualSide]) {
      this.sideConditions[actualSide] = [];
    }

    if (!this.sideConditions[actualSide].includes(effectName)) {
      this.sideConditions[actualSide].push(effectName);
    }

    return `🛡️ **${effectName}** is now protecting **${teamName}**'s side`;
  }

  parseSideEnd(args) {
    const [, side, effect] = args;
    const teamName = this.getTeamName(side);
    const effectName = this.getEffectName(effect);

    // CORRECCIÓN: Extract the actual side (p1 or p2) from the full side identifier
    const actualSide = side.startsWith("p1") ? "p1" : "p2";

    // CORRECCIÓN: Asegurar que el array existe antes de filtrar
    if (!this.sideConditions[actualSide]) {
      this.sideConditions[actualSide] = [];
    }

    // CORRECCIÓN: Usar actualSide en lugar de side
    this.sideConditions[actualSide] = this.sideConditions[actualSide].filter((c) => c !== effectName);

    return `🛡️ **${effectName}** faded from **${teamName}**'s side`;
  }

  // Helper methods with all the basic parsing functions
  parseSwitch(args) {
    const [, pokemon, details] = args;
    const trainerName = this.getTrainerName(pokemon);
    const pokemonName = this.getPokemonName(pokemon);
    const species = details.split(",")[0];

    // Clear any pending messages when switching
    this.currentMove = null;
    this.pendingEffectivenessMessages = [];

    return `🔄 **${trainerName}** sends out **${species}**${pokemonName !== species ? ` (${pokemonName})` : ""}`;
  }

  parseFaint(args) {
    const [, pokemon] = args;
    const pokemonName = this.getPokemonName(pokemon);

    // Clear any pending messages when fainting
    this.currentMove = null;
    this.pendingEffectivenessMessages = [];

    return `💀 **${pokemonName}** fainted`;
  }

  parseWin(args) {
    const [, winner] = args;
    return `🏆 **${winner} won the battle!**`;
  }

  parseTie() {
    return `🤝 **The battle ended in a tie!**`;
  }

  parseCrit(args) {
    const [, pokemon] = args;
    const pokemonName = this.getPokemonName(pokemon);
    return `💫 **Critical hit on ${pokemonName}!**`;
  }

  parseSuperEffective(args) {
    const [, pokemon] = args;
    const pokemonName = this.getPokemonName(pokemon);
    return `⚡ **It's super effective against ${pokemonName}!**`;
  }

  parseResisted(args) {
    const [, pokemon] = args;
    const pokemonName = this.getPokemonName(pokemon);
    return `🛡️ **It's not very effective against ${pokemonName}...**`;
  }

  parseImmune(args, kwArgs) {
    const [, pokemon] = args;
    const pokemonName = this.getPokemonName(pokemon);

    if (kwArgs.from) {
      const ability = this.getEffectName(kwArgs.from);
      return `🚫 **${pokemonName}** is immune due to **${ability}**`;
    }

    return `🚫 **${pokemonName}** is immune to the attack`;
  }

  parseHeal(args, kwArgs) {
    const [, pokemon] = args;
    const pokemonName = this.getPokemonName(pokemon);

    if (kwArgs.from) {
      // CORRECCIÓN: Primero intentar como estado de status, luego como efecto general
      const statusName = this.getStatusName(kwArgs.from);
      const effectName = statusName !== kwArgs.from ? statusName : this.getEffectName(kwArgs.from);

      return `💚 **${pokemonName}** recovered HP from **${effectName}**`;
    }

    return `💚 **${pokemonName}** recovered HP`;
  }

  parseStatus(args, kwArgs) {
    const [, pokemon, status] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const statusName = this.getStatusName(status);

    if (kwArgs.from) {
      const source = kwArgs.of ? this.getPokemonName(kwArgs.of) : null;
      const effect = this.getEffectName(kwArgs.from);

      if (source) {
        return `🔥 **${pokemonName}** was inflicted with **${statusName}** by **${source}**'s **${effect}**`;
      } else {
        return `🔥 **${pokemonName}** was inflicted with **${statusName}** by **${effect}**`;
      }
    }

    return `🔥 **${pokemonName}** was inflicted with **${statusName}**`;
  }

  parseCureStatus(args, kwArgs) {
    const [, pokemon, status] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const statusName = this.getStatusName(status);

    if (kwArgs.from) {
      const effect = this.getEffectName(kwArgs.from);
      return `✨ **${pokemonName}** was cured of **${statusName}** by **${effect}**`;
    }

    return `✨ **${pokemonName}** was cured of **${statusName}**`;
  }

  parseBoost(args, kwArgs) {
    const [, pokemon, stat, amount] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const statName = this.getStatName(stat);
    const level = this.getBoostLevel(parseInt(amount, 10));

    if (kwArgs.from) {
      const effect = this.getEffectName(kwArgs.from);
      return `📈 **${pokemonName}**'s **${statName}** ${level} due to **${effect}**`;
    }

    return `📈 **${pokemonName}**'s **${statName}** ${level}`;
  }

  parseUnboost(args, kwArgs) {
    const [, pokemon, stat, amount] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const statName = this.getStatName(stat);
    const level = this.getBoostLevel(parseInt(amount, 10));

    if (kwArgs.from) {
      const effect = this.getEffectName(kwArgs.from);
      return `📉 **${pokemonName}**'s **${statName}** ${level
        .replace("rose", "fell")
        .replace("increased", "decreased")} due to **${effect}**`;
    }

    return `📉 **${pokemonName}**'s **${statName}** ${level.replace("rose", "fell").replace("increased", "decreased")}`;
  }

  // Add remaining parse methods...
  parseCant(args, kwArgs) {
    const [, pokemon, reason, move] = args;
    const pokemonName = this.getPokemonName(pokemon);

    // CORRECCIÓN: Parsear correctamente estados de status
    const reasonName = this.getStatusName(reason) || this.getEffectName(reason);

    if (move) {
      return `🚫 **${pokemonName}** can't use **${move}** due to **${reasonName}**`;
    }
    return `🚫 **${pokemonName}** can't move due to **${reasonName}**`;
  }

  parseMiss(args) {
    const [, source, target] = args;
    const targetName = target ? this.getPokemonName(target) : "the target";
    return `❌ **The attack missed ${targetName}!**`;
  }

  parseFail(args, kwArgs) {
    const [, pokemon] = args;

    if (pokemon) {
      const pokemonName = this.getPokemonName(pokemon);
      return `❌ **The move failed against ${pokemonName}**`;
    }

    return `❌ **The move failed**`;
  }

  parseBlock(args, kwArgs) {
    const [, pokemon, effect] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const effectName = this.getEffectName(effect);

    return `🛡️ **${pokemonName}** blocked the attack with **${effectName}**`;
  }

  parseActivate(args, kwArgs) {
    const [, pokemon, effect, target] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const effectName = this.getEffectName(effect);

    if (effect.includes("substitute")) {
      return `🛡️ **${pokemonName}**'s **Substitute** took the hit`;
    }

    if (effect.includes("confusion")) {
      return `😵 **${pokemonName}** hurt itself in confusion`;
    }

    if (kwArgs.ability) {
      return `⭐ **${pokemonName}**'s **${effectName}** activated`;
    }

    return `✨ **${effectName}** activated on **${pokemonName}**`;
  }

  parseStartEffect(args, kwArgs) {
    const [, pokemon, effect] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const effectName = this.getEffectName(effect);

    if (kwArgs.from) {
      const source = this.getEffectName(kwArgs.from);
      return `✨ **${pokemonName}** is affected by **${effectName}** due to **${source}**`;
    }

    return `✨ **${pokemonName}** is affected by **${effectName}**`;
  }

  parseEndEffect(args, kwArgs) {
    const [, pokemon, effect] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const effectName = this.getEffectName(effect);

    return `✨ **${effectName}** wore off from **${pokemonName}**`;
  }

  parseAbility(args, kwArgs) {
    const [, pokemon, ability] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const abilityName = this.getEffectName(ability);

    if (kwArgs.from) {
      const source = this.getEffectName(kwArgs.from);
      return `⭐ **${pokemonName}** gained **${abilityName}** via **${source}**`;
    }

    return `⭐ **${pokemonName}**'s **${abilityName}** activated`;
  }

  parseItem(args, kwArgs) {
    const [, pokemon, item] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const itemName = this.getEffectName(item);

    if (kwArgs.from) {
      const effect = this.getEffectName(kwArgs.from);
      return `🎒 **${pokemonName}** obtained **${itemName}** via **${effect}**`;
    }

    return `🎒 **${pokemonName}** revealed **${itemName}**`;
  }

  parseEndItem(args, kwArgs) {
    const [, pokemon, item] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const itemName = this.getEffectName(item);

    if (kwArgs.eat) {
      return `🍎 **${pokemonName}** ate its **${itemName}**`;
    }

    if (kwArgs.from) {
      const effect = this.getEffectName(kwArgs.from);
      return `💔 **${pokemonName}** lost its **${itemName}** due to **${effect}**`;
    }

    return `💔 **${pokemonName}** lost its **${itemName}**`;
  }

  parseTransform(args, kwArgs) {
    const [, pokemon, target] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const targetName = this.getPokemonName(target);

    return `🔄 **${pokemonName}** transformed into **${targetName}**`;
  }

  parseTerastallize(args) {
    const [, pokemon, type] = args;
    const pokemonName = this.getPokemonName(pokemon);
    return `✨ **${pokemonName}** terastallized into **${type}** type`;
  }

  parseMega(args) {
    const [, pokemon] = args;
    const pokemonName = this.getPokemonName(pokemon);
    return `🌟 **${pokemonName}** Mega Evolved`;
  }

  parsePrimal(args) {
    const [, pokemon] = args;
    const pokemonName = this.getPokemonName(pokemon);
    return `🌟 **${pokemonName}** underwent Primal Reversion`;
  }

  parseBurst(args) {
    const [, pokemon] = args;
    const pokemonName = this.getPokemonName(pokemon);
    return `🌟 **${pokemonName}** used Ultra Burst`;
  }

  parseDrag(args) {
    const [, pokemon, details] = args;
    const trainerName = this.getTrainerName(pokemon);
    const species = details.split(",")[0];
    return `💨 **${species}** was dragged out to battle for **${trainerName}**`;
  }

  parseReplace(args) {
    const [, pokemon, details] = args;
    const pokemonName = this.getPokemonName(pokemon);
    const species = details.split(",")[0];
    return `🎭 **${pokemonName}** revealed its true form as **${species}**`;
  }

  // Helper methods
  getEffectName(effect) {
    if (!effect) return "Unknown";

    if (effect.includes(":")) {
      effect = effect.split(":")[1];
    }

    // CORRECCIÓN: Removido effectMap de movimientos ya que vienen parseados
    // Solo mantenemos efectos especiales, habilidades, objetos, etc.
    const effectMap = {
      // Estados y condiciones especiales
      substitute: "Substitute",
      protect: "Protect",
      recover: "Recover",
      roost: "Roost",

      // Terrenos y clima
      electricterrain: "Electric Terrain",
      grassyterrain: "Grassy Terrain",
      mistyterrain: "Misty Terrain",
      psychicterrain: "Psychic Terrain",
      sunnyday: "Sunny Day",
      raindance: "Rain Dance",
      sandstorm: "Sandstorm",
      hail: "Hail",
      snowscape: "Snowscape",

      // Habilidades
      pressure: "Pressure",
      intimidate: "Intimidate",
      levitate: "Levitate",
      flashfire: "Flash Fire",
      waterabsorb: "Water Absorb",
      voltabsorb: "Volt Absorb",
      moxie: "Moxie",
      protosynthesis: "Protosynthesis",
      supremeoverlord: "Supreme Overlord",
      goodasgold: "Good as Gold",
      clearbody: "Clear Body",
      regenerator: "Regenerator",

      // Objetos
      leftovers: "Leftovers",
      lifeorb: "Life Orb",
      choiceband: "Choice Band",
      choicescarf: "Choice Scarf",
      choicespecs: "Choice Specs",
      focussash: "Focus Sash",

      // Entry hazards
      toxicspikes: "Toxic Spikes",
      spikes: "Spikes",
      stealthrock: "Stealth Rock",
      stickyweb: "Sticky Web",
    };

    const lowercaseEffect = effect?.toLowerCase();
    return effectMap[lowercaseEffect] || effect || "Unknown Effect";
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
    return weatherMap[weather?.toLowerCase()] || weather;
  }

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
    // CORRECCIÓN: Manejar tanto "p1" como "p1: PlayerName"
    if (side.startsWith("p1")) return this.p1Name;
    if (side.startsWith("p2")) return this.p2Name;
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
      // Agregar más estados si es necesario
      flinch: "Flinch",
      attract: "Attract",
      disable: "Disable",
      encore: "Encore",
      healblock: "Heal Block",
      taunt: "Taunt",
      torment: "Torment",
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
}
