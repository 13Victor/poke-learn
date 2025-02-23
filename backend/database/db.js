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
  try {
    const sqlPath = path.join(__dirname, "../pokelearn.sql"); // Archivo con las sentencias SQL
    const sql = fs.readFileSync(sqlPath, "utf8"); // Leer el archivo SQL

    const connection = await pool2.getConnection();
    await connection.query(sql);
    connection.release();

    return { message: "Base de datos creada correctamente." };
  } catch (error) {
    return { error: `Error al crear la base de datos: ${error.message}` };
  }
}

// 📌 Rellenar la base de datos
async function fillItemTable() {
  try {
    // 🔹 Obtener todos los ítems disponibles y filtrar los válidos
    const allItems = Dex.items.all();

    const validItems = allItems.filter(
      (item) =>
        !item.isNonstandard && item.gen < 9 && !item.isPokeball && !item.isGem
    );

    // 🔹 Obtener conexión a la base de datos
    const connection = await pool2.getConnection();

    // 🔹 Limpiar la tabla antes de insertar nuevos datos
    await connection.query(
      "DELETE FROM item; ALTER TABLE item AUTO_INCREMENT =1;"
    );

    // 🔹 Preparar los valores para la inserción
    const values = validItems.map((item) => [
      item.name,
      item.shortDesc ? item.shortDesc : item.desc,
      item.spritenum,
    ]);

    // 🔹 Insertar los ítems en la base de datos si hay datos válidos
    if (values.length > 0) {
      await connection.query(
        "INSERT INTO item (name, description, sprite_num) VALUES ?",
        [values]
      );
    }

    // 🔹 Liberar la conexión
    connection.release();

    return { message: "✅ Tabla item rellenada correctamente." };
  } catch (error) {
    return { error: `❌ Error al llenar la tabla item: ${error.message}` };
  }
}

async function fillAbilityTable() {
  try {
    // 🔹 Obtener todos los ítems disponibles y filtrar los válidos
    const allAbilities = Dex.abilities.all();

    const validAbilities = allAbilities.filter(
      (ability) => !ability.isNonstandard
    );

    // 🔹 Obtener conexión a la base de datos
    const connection = await pool2.getConnection();

    // 🔹 Limpiar la tabla antes de insertar nuevos datos
    await connection.query(
      "DELETE FROM ability; ALTER TABLE ability AUTO_INCREMENT =1;"
    );

    // 🔹 Preparar los valores para la inserción
    const values = validAbilities.map((ability) => [
      ability.name,
      ability.shortDesc ? ability.shortDesc : ability.desc,
    ]);

    // 🔹 Insertar las habilidades en la base de datos si hay datos válidos
    if (values.length > 0) {
      await connection.query(
        "INSERT INTO ability (name, description) VALUES ?",
        [values]
      );
    }

    // 🔹 Liberar la conexión
    connection.release();

    return { message: "✅ Tabla ability rellenada correctamente." };
  } catch (error) {
    return { error: `❌ Error al llenar la tabla ability: ${error.message}` };
  }
}

async function fillTypeTable() {
  try {
    // 🔹 Obtener todos los ítems disponibles y filtrar los válidos
    const allTypes = Dex.types.all();

    const validTypes = allTypes.filter((type) => !type.isNonstandard);

    // 🔹 Obtener conexión a la base de datos
    const connection = await pool2.getConnection();

    // 🔹 Limpiar la tabla antes de insertar nuevos datos
    await connection.query(
      "DELETE FROM type; ALTER TABLE type AUTO_INCREMENT =1;"
    );

    console.log(allTypes);

    // 🔹 Preparar los valores para la inserción
    const values = validTypes.map((type) => [type.name]);

    // 🔹 Insertar las habilidades en la base de datos si hay datos válidos
    if (values.length > 0) {
      await connection.query("INSERT INTO type (name) VALUES ?", [values]);
    }

    // 🔹 Liberar la conexión
    connection.release();

    return { message: "✅ Tabla type rellenada correctamente." };
  } catch (error) {
    return { error: `❌ Error al llenar la tabla type: ${error.message}` };
  }
}

async function fillTypeEffectivenessTable() {
  try {
    const allTypes = Dex.types.all();
    const validTypes = allTypes.filter((type) => !type.isNonstandard);

    const connection = await pool2.getConnection();
    await connection.query("DELETE FROM type_effectiveness");

    const [typeRows] = await connection.query("SELECT id, name FROM type");
    const typeMap = typeRows.reduce((acc, row) => {
      acc[row.name.toLowerCase()] = row.id;
      return acc;
    }, {});

    const damageMultiplierMap = {
      0: 1,
      1: 2,
      2: 0.5,
      3: 0,
    };

    let values = [];

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

    if (values.length > 0) {
      await connection.query(
        "INSERT INTO type_effectiveness (attacker_type_id, defender_type_id, multiplier) VALUES ?",
        [values]
      );
    }

    connection.release();
    return { message: "✅ Tabla type_effectiveness rellenada correctamente." };
  } catch (error) {
    return {
      error: `❌ Error al llenar la tabla type_effectiveness: ${error.message}`,
    };
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
};
