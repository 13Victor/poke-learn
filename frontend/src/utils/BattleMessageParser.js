// src/utils/BattleMessageParser.js

export class BattleMessageParser {
  constructor() {
    this.p1Name = "Jugador";
    this.p2Name = "CPU";
    this.turn = 0;
  }

  // Función principal para parsear múltiples logs
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

    // Filtrar mensajes duplicados consecutivos
    const filteredMessages = [];
    for (let i = 0; i < parsedMessages.length; i++) {
      if (i === 0 || parsedMessages[i] !== parsedMessages[i - 1]) {
        filteredMessages.push(parsedMessages[i]);
      }
    }

    return filteredMessages.filter((msg) => msg.trim() !== "");
  }

  // Parsear una línea individual
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
        return this.parseCrit(parts);
      case "-supereffective":
        return this.parseSuperEffective(parts);
      case "-resisted":
        return this.parseResisted(parts);
      case "-immune":
        return this.parseImmune(parts);
      case "-miss":
        return this.parseMiss(parts);
      case "-fail":
        return this.parseFail(parts);
      case "cant":
        return this.parseCant(parts);
      case "teampreview":
        return "🔍 **Fase de Vista Previa de Equipos iniciada**";
      case "upkeep":
        return "⏰ **Fase de mantenimiento del turno**";
      default:
        return null;
    }
  }

  // Métodos para parsear comandos específicos
  parsePlayer(parts) {
    const [, , side, name] = parts;
    if (side === "p1") {
      this.p1Name = name || "Jugador";
    } else if (side === "p2") {
      this.p2Name = name || "CPU";
    }
    return null; // No mostrar mensaje para setup de jugadores
  }

  parseTurn(parts) {
    const [, , turnNum] = parts;
    this.turn = parseInt(turnNum, 10);
    return `\n🎯 **=== TURNO ${turnNum} ===**\n`;
  }

  parseStart() {
    return `🚀 **¡La batalla entre ${this.p1Name} y ${this.p2Name} ha comenzado!**`;
  }

  parseWin(parts) {
    const [, , winner] = parts;
    return `🏆 **¡${winner} ha ganado la batalla!**`;
  }

  parseTie() {
    return `🤝 **¡La batalla ha terminado en empate!**`;
  }

  parseSwitch(parts) {
    const [, , pokemon, details] = parts;
    const trainerName = this.getTrainerName(pokemon);
    const pokemonName = this.getPokemonName(pokemon);
    const species = details.split(",")[0];

    return `🔄 ${trainerName} envía a **${species}**${pokemonName !== species ? ` (${pokemonName})` : ""}`;
  }

  parseDrag(parts) {
    const [, , pokemon, details] = parts;
    const trainerName = this.getTrainerName(pokemon);
    const pokemonName = this.getPokemonName(pokemon);
    const species = details.split(",")[0];

    return `💨 **${species}** de ${trainerName} fue forzado a entrar al combate`;
  }

  parseMove(parts) {
    const [, , pokemon, moveName, target] = parts;
    const trainerName = this.getTrainerName(pokemon);
    const pokemonName = this.getPokemonName(pokemon);

    if (target && target !== pokemon) {
      const targetName = this.getPokemonName(target);
      return `⚔️ **${pokemonName}** usa **${moveName}** contra **${targetName}**`;
    }
    return `⚔️ **${pokemonName}** usa **${moveName}**`;
  }

  parseActivate(parts) {
    const [, , pokemon, effect, target] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const effectName = this.getEffectName(effect);

    // Casos especiales para efectos comunes
    if (effect && effect.includes("substitute")) {
      return `🛡️ **${pokemonName}** está protegido por **Sustituto**`;
    }

    if (effect && effect.includes("confusion")) {
      return `😵 **${pokemonName}** está confundido y se hiere a sí mismo`;
    }

    return `✨ **${effectName}** se activó en **${pokemonName}**`;
  }

  parseItem(parts) {
    const [, , pokemon, item] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const itemName = this.getEffectName(item);
    return `🎒 **${pokemonName}** tiene **${itemName}**`;
  }

  parseEndItem(parts) {
    const [, , pokemon, item] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const itemName = this.getEffectName(item);
    return `💔 **${pokemonName}** perdió su **${itemName}**`;
  }

  parseAbility(parts) {
    const [, , pokemon, ability] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const abilityName = this.getEffectName(ability);
    return `⭐ **${abilityName}** de **${pokemonName}** se activó`;
  }

  parseFaint(parts) {
    const [, , pokemon] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    return `💀 **${pokemonName}** se ha debilitado`;
  }

  parseDamage(parts) {
    const [, , pokemon, hpStatus] = parts;
    const pokemonName = this.getPokemonName(pokemon);

    if (hpStatus === "0 fnt") {
      return null; // El faint message ya lo maneja
    }

    return `💥 **${pokemonName}** recibe daño`;
  }

  parseHeal(parts) {
    const [, , pokemon] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    return `💚 **${pokemonName}** recupera HP`;
  }

  parseStatus(parts) {
    const [, , pokemon, status] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const statusName = this.getStatusName(status);
    return `🔥 **${pokemonName}** ha sido afectado por **${statusName}**`;
  }

  parseCureStatus(parts) {
    const [, , pokemon, status] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const statusName = this.getStatusName(status);
    return `✨ **${pokemonName}** se ha curado de **${statusName}**`;
  }

  parseBoost(parts) {
    const [, , pokemon, stat, amount] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const statName = this.getStatName(stat);
    const level = this.getBoostLevel(parseInt(amount, 10));
    return `📈 El **${statName}** de **${pokemonName}** ${level}`;
  }

  parseUnboost(parts) {
    const [, , pokemon, stat, amount] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    const statName = this.getStatName(stat);
    const level = this.getBoostLevel(parseInt(amount, 10));
    return `📉 El **${statName}** de **${pokemonName}** ${level
      .replace("aumentó", "disminuyó")
      .replace("subió", "bajó")}`;
  }

  parseWeather(parts) {
    const [, , weather] = parts;
    if (!weather || weather === "none") {
      return `🌤️ El clima ha vuelto a la normalidad`;
    }
    const weatherName = this.getWeatherName(weather);
    return `🌦️ **${weatherName}** está activo`;
  }

  parseFieldStart(parts) {
    const [, , effect] = parts;
    const effectName = this.getEffectName(effect);
    return `🌍 **${effectName}** está activo en el campo`;
  }

  parseFieldEnd(parts) {
    const [, , effect] = parts;
    const effectName = this.getEffectName(effect);
    return `🌍 **${effectName}** ya no está activo`;
  }

  parseSideStart(parts) {
    const [, , side, effect] = parts;
    const teamName = this.getTeamName(side);
    const effectName = this.getEffectName(effect);
    return `🛡️ **${effectName}** está activo en el equipo de ${teamName}`;
  }

  parseSideEnd(parts) {
    const [, , side, effect] = parts;
    const teamName = this.getTeamName(side);
    const effectName = this.getEffectName(effect);
    return `🛡️ **${effectName}** ya no está activo en el equipo de ${teamName}`;
  }

  parseCrit(parts) {
    const [, , pokemon] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    return `💫 **¡Golpe crítico contra ${pokemonName}!**`;
  }

  parseSuperEffective(parts) {
    const [, , pokemon] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    return `⚡ **¡Es súper efectivo contra ${pokemonName}!**`;
  }

  parseResisted(parts) {
    const [, , pokemon] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    return `🛡️ **No es muy efectivo contra ${pokemonName}...**`;
  }

  parseImmune(parts) {
    const [, , pokemon] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    return `🚫 **${pokemonName} es inmune al ataque**`;
  }

  parseMiss(parts) {
    const [, , source, target] = parts;
    const targetName = target ? this.getPokemonName(target) : "el objetivo";
    return `❌ **¡El ataque falló contra ${targetName}!**`;
  }

  parseFail(parts) {
    const [, , pokemon] = parts;
    if (pokemon) {
      const pokemonName = this.getPokemonName(pokemon);
      return `❌ **El movimiento falló contra ${pokemonName}**`;
    }
    return `❌ **El movimiento falló**`;
  }

  parseCant(parts) {
    const [, , pokemon, reason, move] = parts;
    const pokemonName = this.getPokemonName(pokemon);
    if (move) {
      return `🚫 **${pokemonName}** no puede usar **${move}** debido a **${reason}**`;
    }
    return `🚫 **${pokemonName}** no puede moverse debido a **${reason}**`;
  }

  // Métodos auxiliares
  getTrainerName(pokemon) {
    if (pokemon.startsWith("p1")) return this.p1Name;
    if (pokemon.startsWith("p2")) return this.p2Name;
    return "Entrenador";
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
    return "Equipo";
  }

  getStatusName(status) {
    const statusMap = {
      brn: "Quemadura",
      par: "Parálisis",
      slp: "Sueño",
      frz: "Congelación",
      psn: "Envenenamiento",
      tox: "Envenenamiento Grave",
      confusion: "Confusión",
    };
    return statusMap[status] || status;
  }

  getStatName(stat) {
    const statMap = {
      atk: "Ataque",
      def: "Defensa",
      spa: "Ataque Especial",
      spd: "Defensa Especial",
      spe: "Velocidad",
      accuracy: "Precisión",
      evasion: "Evasión",
    };
    return statMap[stat] || stat;
  }

  getBoostLevel(amount) {
    if (amount >= 3) return "aumentó drasticamente";
    if (amount === 2) return "aumentó mucho";
    if (amount === 1) return "subió";
    return "cambió";
  }

  getWeatherName(weather) {
    const weatherMap = {
      sunnyday: "Sol Intenso",
      raindance: "Lluvia",
      sandstorm: "Tormenta de Arena",
      hail: "Granizo",
      snow: "Nieve",
      snowscape: "Paisaje Nevado",
      primordialsea: "Mar Primigenio",
      desolateland: "Tierra Baldía",
      deltastream: "Ráfaga Delta",
    };
    return weatherMap[weather] || weather;
  }

  getEffectName(effect) {
    // Eliminar prefijos como "move:" o "ability:"
    if (effect && effect.includes(":")) {
      effect = effect.split(":")[1];
    }

    const effectMap = {
      // Movimientos comunes
      tackle: "Placaje",
      thunderbolt: "Rayo",
      flamethrower: "Lanzallamas",
      surf: "Surf",
      earthquake: "Terremoto",
      psychic: "Psíquico",
      icebeam: "Rayo Hielo",
      shadowball: "Bola Sombra",
      energyball: "Energibola",
      airslash: "Tajo Aéreo",

      // Movimientos de estado
      toxic: "Tóxico",
      thunderwave: "Onda Trueno",
      willowisp: "Fuego Fatuo",
      spore: "Espora",
      sleeppowder: "Somnífero",
      substitute: "Sustituto",
      protect: "Protección",
      recover: "Recuperación",
      roost: "Respiro",

      // Efectos de campo
      reflect: "Reflejo",
      lightscreen: "Pantalla de Luz",
      stealthrock: "Roca Afilada",
      spikes: "Púas",
      toxicspikes: "Púas Tóxicas",
      tailwind: "Viento Afín",
      trickroom: "Espacio Raro",
      wonderroom: "Zona Extraña",
      magicroom: "Zona Mágica",
      electricterrain: "Campo Eléctrico",
      grassyterrain: "Campo de Hierba",
      mistyterrain: "Campo de Niebla",
      psychicterrain: "Campo Psíquico",

      // Habilidades comunes
      pressure: "Presión",
      intimidate: "Intimidación",
      levitate: "Levitación",
      flashfire: "Absorbe Fuego",
      waterabsorb: "Absorbe Agua",
      voltabsorb: "Absorbe Elec",
      immunity: "Inmunidad",
      naturalcure: "Cura Natural",
      serenegrace: "Dicha",
      compoundeyes: "Ojo Compuesto",
      speedboost: "Impulso",
      adaptability: "Adaptable",
      technician: "Experto",
      skilllink: "Encadenado",
      rockhead: "Cabeza Roca",
      reckless: "Audaz",
      sheerforce: "Potencia Bruta",

      // Objetos comunes
      leftovers: "Restos",
      lifeorb: "Vida Orbe",
      choiceband: "Banda Elección",
      choicescarf: "Pañuelo Elección",
      choicespecs: "Gafas Elección",
      focussash: "Banda Focus",
      sitrusberry: "Baya Sitrus",
      lumberry: "Baya Lum",
      flameorb: "Orbe Llama",
      toxicorb: "Orbe Tóxico",
      blacksludge: "Lodo Negro",
      rockyhelmet: "Casco Dentado",
      airballoon: "Globo Helio",
      eviolite: "Mineral Evolutivo",
    };

    return effectMap[effect?.toLowerCase()] || effect || "Efecto Desconocido";
  }
}
