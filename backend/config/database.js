/**
 * Configuración de la conexión a la base de datos
 */
const dotenv = require("dotenv");

dotenv.config();

// Configuración para el pool de conexiones estándar (mysql2)
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pokelearn",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Configuración para el pool de conexiones con promesas
const dbConfigPromise = {
  ...dbConfig,
  multipleStatements: true, // Permitir múltiples declaraciones SQL en una consulta
};

module.exports = {
  dbConfig,
  dbConfigPromise,
};
