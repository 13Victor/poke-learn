const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const mysql2 = require("mysql2/promise");
const bcrypt = require("bcrypt");
const { Dex } = require("pokemon-showdown");

require("dotenv").config();

// Configuración de la conexión a MySQL
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

// 📌 Obtiene una imagen aleatoria de la carpeta "/uploads"
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

// 📌 Función genérica para manejar operaciones con la base de datos
async function withConnection(callback) {
  const connection = await pool2.getConnection();
  try {
    const result = await callback(connection);
    return result;
  } finally {
    connection.release();
  }
}

// 📌 Autentica un usuario comparando email/user_name y contraseña
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

// 📌 Verifica si el email o el nombre de usuario ya existen
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

// 📌 Registra un usuario en la base de datos con imagen de perfil aleatoria
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

// 📌 Crea la base de datos y sus tablas
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

// 📌 Función genérica para llenar tablas
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

// 📌 Rellenar la tabla item
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

// 📌 Rellenar la tabla ability
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

// 📌 Rellenar la tabla type
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

// 📌 Rellenar la tabla type_effectiveness
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
    const allPokemons = Dex.species.all();

    // 🔹 Filtrar solo los Pokémon con num_pokedex > 0
    const validPokemons = allPokemons.filter((pokemon) => pokemon.num > 0);

    return fillTable(
      "pokemon",
      validPokemons,
      (pokemon) => [
        pokemon.num, // num_pokedex
        pokemon.gen, // generation
        pokemon.name, // name
        pokemon.heightm, // height (dm)
        pokemon.weightkg, // weight (hg)
        null, // sprite_small_url
        null, // sprite_default_url
        null, // sprite_gif_url
        null, // audio
        pokemon.baseStats.hp || 0, // base_hp
        pokemon.baseStats.atk || 0, // base_atk
        pokemon.baseStats.def || 0, // base_def
        pokemon.baseStats.spa || 0, // base_spatk
        pokemon.baseStats.spd || 0, // base_spdef
        pokemon.baseStats.spe || 0, // base_speed
      ],
      `INSERT INTO pokemon 
        (num_pokedex, generation, name, height, weight, sprite_small_url, sprite_default_url, sprite_gif_url, audio, base_hp, base_atk, base_def, base_spatk, base_spdef, base_speed) 
        VALUES ?`
    );
  } catch (error) {
    console.error("❌ Error al llenar la tabla pokemon:", error.message);
  }
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
};
