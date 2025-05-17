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
            'image', tp.image
          )
        ) as pokemon
      FROM team t
      LEFT JOIN team_pokemon tp ON t.id = tp.team_id
      WHERE t.user_id = ?
      GROUP BY t.id`;

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
        await connection.query(
          `INSERT INTO pokemon_ivs (team_pokemon_id, hp, atk, def, spatk, spdef, speed)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            pokemonId,
            p.ivs.hp || 31,
            p.ivs.atk || 31,
            p.ivs.def || 31,
            p.ivs.spa || 31, // spa -> spatk
            p.ivs.spd || 31, // spd -> spdef
            p.ivs.spe || 31, // spe -> speed
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
      if (p.evs) p.evs = JSON.parse(p.evs);
      if (p.ivs) p.ivs = JSON.parse(p.ivs);
      if (p.stats) p.stats = JSON.parse(p.stats);
      if (p.moves) p.moves = JSON.parse(p.moves);
      if (p.build) {
        p.build = JSON.parse(p.build);
        p.item = p.build.item_id;
        p.ability = p.build.ability_id;
        delete p.build;
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

module.exports = {
  getUserTeams,
  createTeam,
  deleteTeam,
  getTeamById,
};
