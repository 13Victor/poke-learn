/**
 * Consultas relacionadas con equipos de Pokémon
 */
const db = require("./db");
const { errorMessages } = require("../utils/messages");

/**
 * Obtiene los equipos de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<Array>} - Lista de equipos
 */
async function getUserTeams(userId) {
  try {
    const query = `
      SELECT t.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', tp.id,
            'name', tp.pokemon_name,
            'image', tp.image,
            'item_id', pb.item_id,
            'slot', tp.slot
          )
        ) as pokemon
      FROM team t
      LEFT JOIN team_pokemon tp ON t.id = tp.team_id
      LEFT JOIN pokemon_build pb ON tp.id = pb.team_pokemon_id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.created_at DESC`;

    return await db.query(query, [userId]);
  } catch (error) {
    console.error("Error al obtener equipos:", error);
    throw new Error(errorMessages.TEAM_FETCH_ERROR);
  }
}

/**
 * Crea un nuevo equipo para un usuario
 * @param {number} userId - ID del usuario
 * @param {string} name - Nombre del equipo
 * @param {Array} pokemon - Lista de Pokémon
 * @returns {Promise<Object>} - Equipo creado
 */
async function createTeam(userId, name, pokemon) {
  return db.transaction(async (connection) => {
    // Crear el equipo
    const [teamResult] = await connection.query("INSERT INTO team (name, user_id) VALUES (?, ?)", [name, userId]);
    const teamId = teamResult.insertId;

    // Insertar cada pokemon
    for (let i = 0; i < pokemon.length; i++) {
      const p = pokemon[i];

      // Insertar pokemon base
      const [pokemonResult] = await connection.query(
        `INSERT INTO team_pokemon (team_id, pokemon_name, pokemon_id, image, level, nature, slot) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [teamId, p.pokemon_name, p.pokemon_id, p.image, p.level || 100, p.nature || "Hardy", p.slot]
      );
      const pokemonId = pokemonResult.insertId;

      // Insertar EVs
      if (p.evs) {
        await connection.query(
          `INSERT INTO pokemon_evs (team_pokemon_id, hp, atk, def, spatk, spdef, speed)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            pokemonId,
            p.evs.hp || 0,
            p.evs.atk || 0,
            p.evs.def || 0,
            p.evs.spa || 0, // spa -> spatk
            p.evs.spd || 0, // spd -> spdef
            p.evs.spe || 0, // spe -> speed
          ]
        );
      }

      // Insertar IVs
      if (p.ivs) {
        // Debug: Mostrar los IVs recibidos
        console.log(`Backend - IVs recibidos para ${p.pokemon_name}:`, p.ivs);

        // Validar y preparar los IVs correctamente
        const hpIv = p.ivs.hp !== undefined ? p.ivs.hp : 31;
        const atkIv = p.ivs.atk !== undefined ? p.ivs.atk : 31;
        const defIv = p.ivs.def !== undefined ? p.ivs.def : 31;
        const spaIv = p.ivs.spa !== undefined ? p.ivs.spa : 31;
        const spdIv = p.ivs.spd !== undefined ? p.ivs.spd : 31;
        const speIv = p.ivs.spe !== undefined ? p.ivs.spe : 31;

        // Debug: Mostrar los IVs procesados
        console.log(`Backend - IVs procesados para ${p.pokemon_name}:`, {
          hp: hpIv,
          atk: atkIv,
          def: defIv,
          spatk: spaIv,
          spdef: spdIv,
          speed: speIv,
        });

        await connection.query(
          `INSERT INTO pokemon_ivs (team_pokemon_id, hp, atk, def, spatk, spdef, speed)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            pokemonId,
            hpIv,
            atkIv,
            defIv,
            spaIv, // spa -> spatk
            spdIv, // spd -> spdef
            speIv, // spe -> speed
          ]
        );
      }

      // Insertar stats calculadas
      if (p.stats) {
        await connection.query(
          `INSERT INTO pokemon_stats (team_pokemon_id, hp, atk, def, spatk, spdef, speed)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            pokemonId,
            p.stats.hp || 0,
            p.stats.atk || 0,
            p.stats.def || 0,
            p.stats.spa || 0, // spa -> spatk
            p.stats.spd || 0, // spd -> spdef
            p.stats.spe || 0, // spe -> speed
          ]
        );
      }

      // Insertar movimientos (solo IDs válidos)
      if (p.moves && p.moves.length > 0) {
        // Filtrar movimientos nulos
        const validMoves = p.moves.filter((moveId) => moveId !== null && moveId !== undefined && moveId !== "");
        if (validMoves.length > 0) {
          const moveValues = validMoves.map((moveId, idx) => [pokemonId, idx + 1, moveId]);
          await connection.query(`INSERT INTO pokemon_moves (team_pokemon_id, move_slot, move_id) VALUES ?`, [
            moveValues,
          ]);
        }
      }

      // Insertar información de build (usando IDs para item y ability)
      await connection.query(
        `INSERT INTO pokemon_build (team_pokemon_id, item_id, ability_id)
         VALUES (?, ?, ?)`,
        [pokemonId, p.item, p.ability]
      );
    }

    return { id: teamId, name };
  });
}

/**
 * Elimina un equipo de un usuario
 * @param {number} teamId - ID del equipo
 * @param {number} userId - ID del usuario
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
async function deleteTeam(teamId, userId) {
  try {
    const query = "DELETE FROM team WHERE id = ? AND user_id = ?";
    const result = await db.update(query, [teamId, userId]);
    return result > 0;
  } catch (error) {
    console.error("Error al eliminar equipo:", error);
    throw new Error(errorMessages.TEAM_DELETE_ERROR);
  }
}

/**
 * Obtiene un equipo por ID
 * @param {number} teamId - ID del equipo
 * @param {number} userId - ID del usuario (para verificación)
 * @returns {Promise<Object|null>} - Equipo o null si no existe
 */
async function getTeamById(teamId, userId) {
  try {
    // Obtener información básica del equipo
    const teamQuery = `SELECT * FROM team WHERE id = ? AND user_id = ?`;
    const teams = await db.query(teamQuery, [teamId, userId]);

    if (teams.length === 0) {
      return null;
    }

    const team = teams[0];

    // Obtener los Pokémon del equipo con todos sus detalles
    const pokemonQuery = `
      SELECT tp.*, 
        (SELECT JSON_OBJECT(
          'hp', pe.hp, 'atk', pe.atk, 'def', pe.def, 
          'spatk', pe.spatk, 'spdef', pe.spdef, 'speed', pe.speed
        ) FROM pokemon_evs pe WHERE pe.team_pokemon_id = tp.id) as evs,
        
        (SELECT JSON_OBJECT(
          'hp', pi.hp, 'atk', pi.atk, 'def', pi.def, 
          'spatk', pi.spatk, 'spdef', pi.spdef, 'speed', pi.speed
        ) FROM pokemon_ivs pi WHERE pi.team_pokemon_id = tp.id) as ivs,
        
        (SELECT JSON_OBJECT(
          'hp', ps.hp, 'atk', ps.atk, 'def', ps.def, 
          'spatk', ps.spatk, 'spdef', ps.spdef, 'speed', ps.speed
        ) FROM pokemon_stats ps WHERE ps.team_pokemon_id = tp.id) as stats,
        
        (SELECT JSON_ARRAYAGG(pm.move_id)
        FROM pokemon_moves pm 
        WHERE pm.team_pokemon_id = tp.id
        ORDER BY pm.move_slot) as moves,
        
        (SELECT JSON_OBJECT(
          'item_id', pb.item_id, 'ability_id', pb.ability_id
        ) FROM pokemon_build pb WHERE pb.team_pokemon_id = tp.id) as build
        
      FROM team_pokemon tp
      WHERE tp.team_id = ?
      ORDER BY tp.slot`;

    const pokemon = await db.query(pokemonQuery, [teamId]);

    // Formatear los resultados JSON (convertir strings a objetos)
    pokemon.forEach((p) => {
      try {
        // Verificar que los valores no sean nulos y son strings antes de parsearlos
        if (p.evs && typeof p.evs === "string") p.evs = JSON.parse(p.evs);
        else if (p.evs === null) p.evs = { hp: 0, atk: 0, def: 0, spatk: 0, spdef: 0, speed: 0 };

        if (p.ivs && typeof p.ivs === "string") p.ivs = JSON.parse(p.ivs);
        else if (p.ivs === null) p.ivs = { hp: 31, atk: 31, def: 31, spatk: 31, spdef: 31, speed: 31 };

        if (p.stats && typeof p.stats === "string") p.stats = JSON.parse(p.stats);
        else if (p.stats === null) p.stats = { hp: 0, atk: 0, def: 0, spatk: 0, spdef: 0, speed: 0 };

        // Mapear nombres de stats de la BD al formato del frontend
        if (p.stats) {
          // Crear copia para no modificar el objeto original
          const mappedStats = { ...p.stats };

          // Mapear de BD a frontend: spatk->spa, spdef->spd, speed->spe
          if ("spatk" in mappedStats) {
            mappedStats.spa = mappedStats.spatk;
            delete mappedStats.spatk;
          }

          if ("spdef" in mappedStats) {
            mappedStats.spd = mappedStats.spdef;
            delete mappedStats.spdef;
          }

          if ("speed" in mappedStats) {
            mappedStats.spe = mappedStats.speed;
            delete mappedStats.speed;
          }

          p.stats = mappedStats;
        }

        // Hacer el mismo mapeo para EVs e IVs
        if (p.evs) {
          const mappedEvs = { ...p.evs };

          if ("spatk" in mappedEvs) {
            mappedEvs.spa = mappedEvs.spatk;
            delete mappedEvs.spatk;
          }

          if ("spdef" in mappedEvs) {
            mappedEvs.spd = mappedEvs.spdef;
            delete mappedEvs.spdef;
          }

          if ("speed" in mappedEvs) {
            mappedEvs.spe = mappedEvs.speed;
            delete mappedEvs.speed;
          }

          p.evs = mappedEvs;
        }

        if (p.ivs) {
          const mappedIvs = { ...p.ivs };

          if ("spatk" in mappedIvs) {
            mappedIvs.spa = mappedIvs.spatk;
            delete mappedIvs.spatk;
          }

          if ("spdef" in mappedIvs) {
            mappedIvs.spd = mappedIvs.spdef;
            delete mappedIvs.spdef;
          }

          if ("speed" in mappedIvs) {
            mappedIvs.spe = mappedIvs.speed;
            delete mappedIvs.speed;
          }

          p.ivs = mappedIvs;
        }

        if (p.moves && typeof p.moves === "string") p.moves = JSON.parse(p.moves);
        else if (p.moves === null) p.moves = [];

        if (p.build && typeof p.build === "string") {
          p.build = JSON.parse(p.build);
          p.item = p.build.item_id;
          p.ability = p.build.ability_id;
          delete p.build;
        } else if (p.build === null) {
          p.item = null;
          p.ability = null;
        }
      } catch (parseError) {
        console.error(`Error parsing JSON for pokemon ${p.id}:`, parseError);
        console.error("Problematic data:", {
          evs: p.evs,
          ivs: p.ivs,
          stats: p.stats,
          moves: p.moves,
          build: p.build,
        });

        // Asignar valores por defecto en caso de error
        p.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        p.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
        p.stats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        p.moves = [];
        p.item = null;
        p.ability = null;
      }
    });

    // Combinar equipo y Pokémon
    team.pokemon = pokemon;

    return team;
  } catch (error) {
    console.error("Error al obtener equipo por ID:", error);
    return null;
  }
}

/**
 * Actualizar un equipo existente
 * @param {number} teamId - ID del equipo
 * @param {number} userId - ID del usuario
 * @param {string} name - Nombre del equipo
 * @param {Array} pokemon - Lista de Pokémon
 * @returns {Promise<Object>} - Equipo actualizado
 */
async function updateTeam(teamId, userId, name, pokemon) {
  return db.transaction(async (connection) => {
    // Verificar que el equipo existe y pertenece al usuario
    const [teamCheck] = await connection.query("SELECT id FROM team WHERE id = ? AND user_id = ?", [teamId, userId]);

    if (teamCheck.length === 0) {
      throw new Error("Equipo no encontrado o no pertenece al usuario");
    }

    // Actualizar el nombre del equipo
    await connection.query("UPDATE team SET name = ? WHERE id = ?", [name, teamId]);

    // Eliminar todos los Pokémon existentes asociados al equipo
    await connection.query("DELETE FROM team_pokemon WHERE team_id = ?", [teamId]);

    // Insertar los nuevos Pokémon (mismo código que en createTeam)
    for (let i = 0; i < pokemon.length; i++) {
      const p = pokemon[i];

      // Insertar pokemon base
      const [pokemonResult] = await connection.query(
        `INSERT INTO team_pokemon (team_id, pokemon_name, pokemon_id, image, level, nature, slot) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [teamId, p.pokemon_name, p.pokemon_id, p.image, p.level || 100, p.nature || "Hardy", p.slot]
      );
      const pokemonId = pokemonResult.insertId;

      // Insertar EVs
      if (p.evs) {
        await connection.query(
          `INSERT INTO pokemon_evs (team_pokemon_id, hp, atk, def, spatk, spdef, speed)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            pokemonId,
            p.evs.hp || 0,
            p.evs.atk || 0,
            p.evs.def || 0,
            p.evs.spa || 0, // spa -> spatk
            p.evs.spd || 0, // spd -> spdef
            p.evs.spe || 0, // spe -> speed
          ]
        );
      }

      // Insertar IVs
      if (p.ivs) {
        // Debug: Mostrar los IVs recibidos
        console.log(`Backend - IVs recibidos para ${p.pokemon_name}:`, p.ivs);

        // Validar y preparar los IVs correctamente
        const hpIv = p.ivs.hp !== undefined ? p.ivs.hp : 31;
        const atkIv = p.ivs.atk !== undefined ? p.ivs.atk : 31;
        const defIv = p.ivs.def !== undefined ? p.ivs.def : 31;
        const spaIv = p.ivs.spa !== undefined ? p.ivs.spa : 31;
        const spdIv = p.ivs.spd !== undefined ? p.ivs.spd : 31;
        const speIv = p.ivs.spe !== undefined ? p.ivs.spe : 31;

        // Debug: Mostrar los IVs procesados
        console.log(`Backend - IVs procesados para ${p.pokemon_name}:`, {
          hp: hpIv,
          atk: atkIv,
          def: defIv,
          spatk: spaIv,
          spdef: spdIv,
          speed: speIv,
        });

        await connection.query(
          `INSERT INTO pokemon_ivs (team_pokemon_id, hp, atk, def, spatk, spdef, speed)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            pokemonId,
            hpIv,
            atkIv,
            defIv,
            spaIv, // spa -> spatk
            spdIv, // spd -> spdef
            speIv, // spe -> speed
          ]
        );
      }

      // Insertar stats calculadas
      if (p.stats) {
        await connection.query(
          `INSERT INTO pokemon_stats (team_pokemon_id, hp, atk, def, spatk, spdef, speed)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            pokemonId,
            p.stats.hp || 0,
            p.stats.atk || 0,
            p.stats.def || 0,
            p.stats.spa || 0, // spa -> spatk
            p.stats.spd || 0, // spd -> spdef
            p.stats.spe || 0, // spe -> speed
          ]
        );
      }

      // Insertar movimientos (solo IDs válidos)
      if (p.moves && p.moves.length > 0) {
        // Filtrar movimientos nulos
        const validMoves = p.moves.filter((moveId) => moveId !== null && moveId !== undefined && moveId !== "");
        if (validMoves.length > 0) {
          const moveValues = validMoves.map((moveId, idx) => [pokemonId, idx + 1, moveId]);
          await connection.query(`INSERT INTO pokemon_moves (team_pokemon_id, move_slot, move_id) VALUES ?`, [
            moveValues,
          ]);
        }
      }

      // Insertar información de build (usando IDs para item y ability)
      await connection.query(
        `INSERT INTO pokemon_build (team_pokemon_id, item_id, ability_id)
         VALUES (?, ?, ?)`,
        [pokemonId, p.item, p.ability]
      );
    }

    return { id: teamId, name };
  });
}

module.exports = {
  getUserTeams,
  createTeam,
  deleteTeam,
  getTeamById,
  updateTeam,
};
