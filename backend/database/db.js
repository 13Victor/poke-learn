const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const mysql2 = require("mysql2/promise");
const bcrypt = require("bcrypt");
const { Dex } = require("pokemon-showdown");
const { Learnsets } = require("../data/learnsets.js");
const { Pokedex } = require("../data/pokedex.js");

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

function getRandomProfilePicture() {
  const folderPath = path.join(__dirname, "../public/profile_pictures"); // Ruta de imágenes

  try {
    const files = fs
      .readdirSync(folderPath)
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
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
    await db.execute(query, [
      email,
      hashedPassword,
      user_name,
      profile_picture,
    ]);
    return { success: true, profile_picture };
  } catch (error) {
    return { error: "Error al registrar el usuario" };
  }
}

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

async function fillTable(tableName, data, mapData, insertQuery) {
  return withConnection(async (connection) => {
    // Limpiar la tabla antes de insertar nuevos datos
    await connection.query(
      `DELETE FROM ${tableName}; ALTER TABLE ${tableName} AUTO_INCREMENT =1;`
    );

    // Preparar los valores para la inserción
    const values = data.map(mapData);

    // Insertar los datos en la base de datos si hay datos válidos
    if (values.length > 0) {
      await connection.query(insertQuery, [values]);
    }

    return { message: `✅ Tabla ${tableName} rellenada correctamente.` };
  }).catch((error) => {
    return {
      error: `❌ Error al llenar la tabla ${tableName}: ${error.message}`,
    };
  });
}

async function fillItemTable() {
  const allItems = Dex.items.all();
  const validItems = allItems.filter(
    (item) =>
      !item.isNonstandard && item.gen < 9 && !item.isPokeball && !item.isGem
  );

  return fillTable(
    "item",
    validItems,
    (item) => [item.name, item.shortDesc || item.desc, item.spritenum],
    "INSERT INTO item (name, description, sprite_num) VALUES ?"
  );
}

async function fillAbilityTable() {
  const allAbilities = Dex.abilities.all();
  const validAbilities = allAbilities.filter(
    (ability) => !ability.isNonstandard
  );

  return fillTable(
    "ability",
    validAbilities,
    (ability) => [ability.name, ability.shortDesc || ability.desc],
    "INSERT INTO ability (name, description) VALUES ?"
  );
}

async function fillTypeTable() {
  const allTypes = Dex.types.all();
  const validTypes = allTypes.filter((type) => !type.isNonstandard);

  return fillTable(
    "type",
    validTypes,
    (type) => [type.name],
    "INSERT INTO type (name) VALUES ?"
  );
}

async function fillTypeEffectivenessTable() {
  const allTypes = Dex.types.all();
  const validTypes = allTypes.filter((type) => !type.isNonstandard);

  // Obtener los IDs de los tipos desde la base de datos
  const typeRows = await withConnection(async (connection) => {
    const [rows] = await connection.query("SELECT id, name FROM type");
    return rows;
  });

  // Crear un mapa de nombres de tipos a IDs
  const typeMap = typeRows.reduce((acc, row) => {
    acc[row.name.toLowerCase()] = row.id;
    return acc;
  }, {});

  // Mapa de multiplicadores de daño
  const damageMultiplierMap = {
    0: 1,
    1: 2,
    2: 0.5,
    3: 0,
  };

  // Generar los valores para la inserción
  const values = [];
  validTypes.forEach((attackerType) => {
    const attackerId = typeMap[attackerType.name.toLowerCase()];
    if (!attackerId) return;

    validTypes.forEach((defenderType) => {
      const defenderId = typeMap[defenderType.name.toLowerCase()];
      if (!defenderId) return;

      const damageCode = defenderType.damageTaken[attackerType.name] ?? 0;
      const multiplier = damageMultiplierMap[damageCode] ?? 1;
      values.push([attackerId, defenderId, multiplier]);
    });
  });

  // Usar la función fillTable para insertar los valores
  return fillTable(
    "type_effectiveness",
    values,
    (value) => value, // Los valores ya están en el formato correcto
    "INSERT INTO type_effectiveness (attacker_type_id, defender_type_id, multiplier) VALUES ?"
  );
}

async function fillPokemonTable() {
  try {
    const allPokemons = Object.values(Pokedex);

    const validPokemons = allPokemons.filter((pokemon) => pokemon.num > 0);

    return fillTable(
      "pokemon",
      validPokemons,
      (pokemon) => [
        pokemon.num,
        pokemon.name,
        pokemon.heightm,
        pokemon.weightkg,
        null,
        `${String(pokemon.num).padStart(4, "0")}.png`,
        null,
        null,
        pokemon.baseStats.hp || 0,
        pokemon.baseStats.atk || 0,
        pokemon.baseStats.def || 0,
        pokemon.baseStats.spa || 0,
        pokemon.baseStats.spd || 0,
        pokemon.baseStats.spe || 0,
      ],
      `INSERT INTO pokemon 
        (num_pokedex, name, height, weight, sprite_small_url, sprite_default_url, sprite_gif_url, audio, base_hp, base_atk, base_def, base_spatk, base_spdef, base_speed) 
        VALUES ?`
    );
  } catch (error) {
    console.error("❌ Error al llenar la tabla pokemon:", error.message);
  }
}

async function fillMoveTable() {
  const allMoves = Dex.moves.all();
  const validMoves = allMoves.filter((move) => !move.isNonstandard);

  // Obtener los IDs de los tipos desde la base de datos
  const typeRows = await withConnection(async (connection) => {
    const [rows] = await connection.query("SELECT id, name FROM type");
    return rows;
  });

  // Crear un mapa de nombres de tipos a IDs
  const typeMap = typeRows.reduce((acc, row) => {
    acc[row.name.toLowerCase()] = row.id;
    return acc;
  }, {});

  // Generar los valores para la inserción
  const values = [];
  validMoves.forEach((move) => {
    const typeId = typeMap[move.type.toLowerCase()] || null;

    if (!typeId) {
      console.warn(
        `⚠️ Tipo no encontrado para movimiento: ${move.name} (${move.type})`
      );
      return;
    }

    values.push([
      move.name, // name
      move.id,
      typeId, // type_id
      move.basePower || null, // power
      move.accuracy === true ? 100 : move.accuracy || null, // accuracy
      move.pp || 0, // pp
      move.category || "Unknown", // category
      move.shortDesc || move.desc || "", // effect
      move.target || "Unknown", // target
      move.priority || 0, // priority
    ]);
  });

  // Usar la función fillTable para insertar los valores
  return fillTable(
    "move",
    values,
    (value) => value, // Los valores ya están en el formato correcto
    "INSERT INTO move (name, type_id, power, accuracy, pp, category, effect, target, priority) VALUES ?"
  );
}

async function fillPokemonMoveTable() {
  // Obtener los IDs de los Pokémon desde la base de datos
  const pokemonRows = await withConnection(async (connection) => {
    const [rows] = await connection.query("SELECT id, name FROM pokemon");
    return rows;
  });

  // Obtener los IDs de los movimientos desde la base de datos
  const moveRows = await withConnection(async (connection) => {
    const [rows] = await connection.query("SELECT id, nameId FROM move");
    return rows;
  });

  // Crear mapas de nombres a IDs para una búsqueda eficiente
  const pokemonMap = pokemonRows.reduce((acc, row) => {
    acc[row.name.toLowerCase()] = row.id;
    return acc;
  }, {});

  const moveMap = moveRows.reduce((acc, row) => {
    acc[row.nameId.toLowerCase()] = row.id;
    return acc;
  }, {});

  // Generar los valores para la inserción
  const values = [];
  Object.entries(Learnsets).forEach(([pokemonName, learnsetData]) => {
    const pokemonId = pokemonMap[pokemonName.toLowerCase()];
    // Hay pokemons que no están en la base de datos porque son ilegales(de evento), por lo que no se insertan
    // if (!pokemonId) {
    //   console.warn(
    //     `⚠️ Pokémon no encontrado en la base de datos: ${pokemonName}`
    //   );
    //   return;
    // }

    Object.keys(learnsetData.learnset).forEach((moveName) => {
      const moveId = moveMap[moveName.toLowerCase().trim().replace("-", "")];

      // Hay ataques que no están en la base de datos porque son ilegales, por lo que no se insertan
      //   if (!moveId) {
      //     console.warn(
      //       `⚠️ Movimiento no encontrado en la base de datos: ${moveName}`
      //     );
      //     return;
      //   }

      values.push([pokemonId, moveId]);
    });
  });

  // Usar la función fillTable para insertar los valores
  return fillTable(
    "pokemonMove",
    values,
    (value) => value, // Los valores ya están en el formato correcto
    "INSERT INTO pokemonMove (pokemon_id, move_id) VALUES ?"
  );
}

module.exports = {
  authenticateUser,
  isUserRegistered,
  registerUser,
  createDatabase,
  fillItemTable,
  fillAbilityTable,
  fillTypeTable,
  fillTypeEffectivenessTable,
  fillPokemonTable,
  fillMoveTable,
  fillPokemonMoveTable,
};
