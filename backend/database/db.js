/**
 * Configuración de la conexión a la base de datos
 */
const mysql = require("mysql2");
const mysql2 = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const { dbConfig, dbConfigPromise } = require("../config/database");

// Crear pool de conexiones estándar (callbacks)
const pool = mysql.createPool(dbConfig);

// Crear pool de conexiones con promesas
const poolPromise = mysql2.createPool(dbConfigPromise);

/**
 * Función para obtener una conexión del pool y ejecutar una callback
 * @param {Function} callback - Función a ejecutar con la conexión
 * @returns {Promise} - Promesa con el resultado de la callback
 */
async function withConnection(callback) {
  const connection = await poolPromise.getConnection();
  try {
    const result = await callback(connection);
    return result;
  } finally {
    connection.release();
  }
}

/**
 * Inicializa la base de datos con el esquema SQL
 * @returns {Promise} - Promesa con el resultado de la operación
 */
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

/**
 * Ejecuta una consulta SQL utilizando el pool de promesas
 * @param {string} sql - Consulta SQL a ejecutar
 * @param {Array} params - Parámetros para la consulta SQL
 * @returns {Promise} - Promesa con el resultado de la consulta
 */
async function query(sql, params = []) {
  try {
    const [rows] = await poolPromise.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Error en consulta SQL:", error);
    throw error;
  }
}

/**
 * Ejecuta una inserción SQL y devuelve el ID insertado
 * @param {string} sql - Consulta SQL de inserción
 * @param {Array} params - Parámetros para la consulta SQL
 * @returns {Promise<number>} - Promesa con el ID insertado
 */
async function insert(sql, params = []) {
  try {
    const [result] = await poolPromise.execute(sql, params);
    return result.insertId;
  } catch (error) {
    console.error("Error en inserción SQL:", error);
    throw error;
  }
}

/**
 * Ejecuta una actualización SQL y devuelve el número de filas afectadas
 * @param {string} sql - Consulta SQL de actualización
 * @param {Array} params - Parámetros para la consulta SQL
 * @returns {Promise<number>} - Promesa con el número de filas afectadas
 */
async function update(sql, params = []) {
  try {
    const [result] = await poolPromise.execute(sql, params);
    return result.affectedRows;
  } catch (error) {
    console.error("Error en actualización SQL:", error);
    throw error;
  }
}

/**
 * Ejecuta una transacción SQL
 * @param {Function} callback - Función a ejecutar dentro de la transacción
 * @returns {Promise} - Promesa con el resultado de la transacción
 */
async function transaction(callback) {
  const connection = await poolPromise.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error("Error en transacción SQL:", error);
    throw error;
  } finally {
    connection.release();
  }
}

// Exportar conexiones y funciones utilitarias
module.exports = {
  pool,
  poolPromise,
  withConnection,
  createDatabase,
  query,
  insert,
  update,
  transaction,
};
