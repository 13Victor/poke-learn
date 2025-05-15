/**
 * Consultas relacionadas con usuarios
 */
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const db = require("./db");
const { errorMessages, successMessages } = require("../utils/messages");

/**
 * Obtiene una imagen de perfil aleatoria
 * @returns {string} - Nombre del archivo de imagen
 */
function getRandomProfilePicture() {
  const folderPath = path.join(__dirname, "../public/profile_pictures");

  try {
    const files = fs.readdirSync(folderPath).filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
    return files[Math.floor(Math.random() * files.length)];
  } catch (error) {
    console.error("Error al obtener imagen de perfil aleatoria:", error);
    return "default.png";
  }
}

/**
 * Verifica si un usuario existe por email o nombre de usuario
 * @param {string} email - Email del usuario
 * @param {string} user_name - Nombre de usuario
 * @returns {Promise<Object>} - Resultado de la verificación
 */
async function isUserRegistered(email, user_name) {
  try {
    const query = `SELECT email, user_name FROM user WHERE email = ? OR user_name = ?`;
    const rows = await db.query(query, [email, user_name]);

    if (rows.length > 0) {
      const existingUser = rows[0];
      if (existingUser.email === email) {
        return { error: errorMessages.EMAIL_IN_USE };
      }
      if (existingUser.user_name === user_name) {
        return { error: errorMessages.USERNAME_IN_USE };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error al verificar usuario:", error);
    return { error: errorMessages.DATABASE_ERROR };
  }
}

/**
 * Autentica un usuario por email/username y contraseña
 * @param {string} emailOrUserName - Email o nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} - Usuario autenticado o error
 */
async function authenticateUser(emailOrUserName, password) {
  try {
    const query = `SELECT id, email, user_name, password, profile_picture FROM user WHERE email = ? OR user_name = ?`;
    const rows = await db.query(query, [emailOrUserName, emailOrUserName]);

    if (rows.length === 0) {
      return { error: errorMessages.INVALID_CREDENTIALS };
    }

    const user = rows[0];

    // Comparar la contraseña hasheada
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { error: errorMessages.INVALID_CREDENTIALS };
    }

    return { success: true, user };
  } catch (error) {
    console.error("Error al autenticar usuario:", error);
    return { error: errorMessages.DATABASE_ERROR };
  }
}

/**
 * Registra un nuevo usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @param {string} user_name - Nombre de usuario
 * @param {string|null} firebase_uid - UID de Firebase (opcional)
 * @returns {Promise<Object>} - Resultado del registro
 */
async function registerUser(email, password, user_name, firebase_uid = null) {
  try {
    const profile_picture = getRandomProfilePicture();
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `INSERT INTO user (email, password, user_name, profile_picture, firebase_uid) 
                   VALUES (?, ?, ?, ?, ?)`;

    await db.query(query, [email, hashedPassword, user_name, profile_picture, firebase_uid]);

    return { success: true, profile_picture };
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    return { error: errorMessages.REGISTRATION_ERROR };
  }
}

/**
 * Actualiza el UID de Firebase para un usuario
 * @param {number} userId - ID del usuario
 * @param {string} firebaseUid - UID de Firebase
 * @returns {Promise<boolean>} - True si se actualizó correctamente
 */
async function updateFirebaseUid(userId, firebaseUid) {
  try {
    const query = `UPDATE user SET firebase_uid = ? WHERE id = ?`;
    const result = await db.update(query, [firebaseUid, userId]);
    return result > 0;
  } catch (error) {
    console.error("Error al actualizar UID de Firebase:", error);
    return false;
  }
}

/**
 * Obtiene un usuario por email
 * @param {string} email - Email del usuario
 * @returns {Promise<Object|null>} - Usuario o null si no existe
 */
async function getUserByEmail(email) {
  try {
    const query = `SELECT id, email, user_name, profile_picture, firebase_uid 
                   FROM user WHERE email = ?`;
    const rows = await db.query(query, [email]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error al obtener usuario por email:", error);
    return null;
  }
}

/**
 * Obtiene un usuario por ID
 * @param {number} id - ID del usuario
 * @returns {Promise<Object|null>} - Usuario o null si no existe
 */
async function getUserById(id) {
  try {
    const query = `SELECT id, email, user_name, profile_picture, firebase_uid 
                   FROM user WHERE id = ?`;
    const rows = await db.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error al obtener usuario por ID:", error);
    return null;
  }
}

module.exports = {
  isUserRegistered,
  authenticateUser,
  registerUser,
  updateFirebaseUid,
  getUserByEmail,
  getUserById,
};
