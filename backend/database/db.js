const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const mysql2 = require("mysql2/promise");
const bcrypt = require("bcrypt");

require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const pool2 = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  multipleStatements: true,
});

async function createDatabase() {
  return withConnection(async (connection) => {
    const sqlPath = path.join(__dirname, "../pokelearn.sql"); // Archivo con las sentencias SQL
    const sql = fs.readFileSync(sqlPath, "utf8"); // Leer el archivo SQL
    await connection.query(sql);
    return { message: "Base de datos creada correctamente." };
  }).catch((error) => {
    return { error: `Error al crear la base de datos: ${error.message}` };
  });
}

function getRandomProfilePicture() {
  const folderPath = path.join(__dirname, "../public/profile_pictures"); // Ruta de imágenes

  try {
    const files = fs.readdirSync(folderPath).filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
    return files[Math.floor(Math.random() * files.length)];
  } catch (error) {
    return "default.png";
  }
}

async function withConnection(callback) {
  const connection = await pool2.getConnection();
  try {
    const result = await callback(connection);
    return result;
  } finally {
    connection.release();
  }
}

async function authenticateUser(emailOrUserName, password) {
  const query = `SELECT id, email, user_name, password, profile_picture FROM user WHERE email = ? OR user_name = ?`;
  const db = pool.promise();
  const [rows] = await db.execute(query, [emailOrUserName, emailOrUserName]);

  if (rows.length === 0) {
    return { error: "Credenciales incorrectas" };
  }

  const user = rows[0];

  // Comparar la contraseña hasheada
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return { error: "Credenciales incorrectas" };
  }

  return { success: true, user };
}

async function isUserRegistered(email, user_name) {
  const query = `SELECT email, user_name FROM user WHERE email = ? OR user_name = ?`;
  const db = pool.promise();
  const [rows] = await db.execute(query, [email, user_name]);

  if (rows.length > 0) {
    const existingUser = rows[0];
    if (existingUser.email === email) {
      return { error: "El correo electrónico ya está en uso" };
    }
    if (existingUser.user_name === user_name) {
      return { error: "El nombre de usuario ya está en uso" };
    }
  }

  return { success: true };
}

async function registerUser(email, password, user_name) {
  try {
    const profile_picture = getRandomProfilePicture(); // Imagen aleatoria o default
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO user (email, password, user_name, profile_picture) VALUES (?, ?, ?, ?)`;
    const db = pool.promise();
    await db.execute(query, [email, hashedPassword, user_name, profile_picture]);
    return { success: true, profile_picture };
  } catch (error) {
    return { error: "Error al registrar el usuario" };
  }
}

// Teams operations
async function getUserTeams(userId) {
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

  const [teams] = await pool2.query(query, [userId]);
  return teams;
}

async function createTeam(userId, name, pokemon) {
  const conn = await pool2.getConnection();
  try {
    await conn.beginTransaction();

    // Crear el equipo
    const [teamResult] = await conn.query("INSERT INTO team (name, user_id) VALUES (?, ?)", [name, userId]);
    const teamId = teamResult.insertId;

    // Insertar cada pokemon
    for (let i = 0; i < pokemon.length; i++) {
      const p = pokemon[i];

      // Insertar pokemon base
      const [pokemonResult] = await conn.query(
        `INSERT INTO team_pokemon (team_id, pokemon_name, pokemon_id, image, level, nature, slot) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [teamId, p.pokemon_name, p.pokemon_id, p.image, p.level || 100, p.nature || "Hardy", p.slot]
      );
      const pokemonId = pokemonResult.insertId;

      // Insertar EVs - ajustar nombres de campos
      if (p.evs) {
        await conn.query(
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

      // Insertar IVs - ajustar nombres de campos
      if (p.ivs) {
        await conn.query(
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

      // Insertar stats calculadas - ajustar nombres de campos
      if (p.stats) {
        await conn.query(
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

      // ...existing code for moves and build...
      if (p.moves) {
        const moveValues = p.moves.map((move, idx) => [pokemonId, idx + 1, move]);
        await conn.query(`INSERT INTO pokemon_moves (team_pokemon_id, move_slot, move_name) VALUES ?`, [moveValues]);
      }

      await conn.query(
        `INSERT INTO pokemon_build (team_pokemon_id, item, ability, ability_type)
         VALUES (?, ?, ?, ?)`,
        [pokemonId, p.item || null, p.ability, p.abilityType]
      );
    }

    await conn.commit();
    return { id: teamId, name };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function deleteTeam(teamId, userId) {
  const [result] = await pool2.query("DELETE FROM team WHERE id = ? AND user_id = ?", [teamId, userId]);
  return result.affectedRows > 0;
}

module.exports = {
  createDatabase,
  authenticateUser,
  isUserRegistered,
  registerUser,
  withConnection,
  getUserTeams,
  createTeam,
  deleteTeam,
};
