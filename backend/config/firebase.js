/**
 * Configuración de Firebase Admin SDK
 */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

let firebaseInitialized = false;

/**
 * Inicializa Firebase Admin SDK
 * @returns {boolean} - True si la inicialización fue exitosa
 */
function initializeFirebase() {
  try {
    // Evitar inicializar Firebase Admin más de una vez
    if (admin.apps.length > 0) {
      console.log("Firebase Admin SDK ya está inicializado");
      return true;
    }

    console.log("Intentando inicializar Firebase Admin SDK...");

    // Intentar cargar la cuenta de servicio desde el archivo
    let serviceAccount;
    const serviceAccountPath = path.join(__dirname, "../config/firebase-service-account.json");

    if (fs.existsSync(serviceAccountPath)) {
      try {
        serviceAccount = require(serviceAccountPath);
        console.log("Archivo de cuenta de servicio cargado correctamente");
      } catch (err) {
        console.error("Error al cargar el archivo de cuenta de servicio:", err);
      }
    } else {
      console.log("Archivo de cuenta de servicio no encontrado en:", serviceAccountPath);
    }

    // Verificar si la cuenta de servicio es válida
    if (serviceAccount && serviceAccount.project_id && serviceAccount.private_key) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin inicializado con archivo de cuenta de servicio");
      firebaseInitialized = true;
      return true;
    }

    // Si no se pudo cargar la cuenta de servicio, intentar con variables de entorno
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin inicializado con variables de entorno");
      firebaseInitialized = true;
      return true;
    }

    console.error("No se encontraron credenciales de Firebase válidas");
    return false;
  } catch (error) {
    console.error("Error al inicializar Firebase Admin SDK:", error);
    return false;
  }
}

/**
 * Verifica si Firebase Admin SDK está inicializado
 * @returns {boolean} - True si está inicializado
 */
function isFirebaseInitialized() {
  return firebaseInitialized;
}

/**
 * Verifica un token de ID de Firebase
 * @param {string} idToken - Token de ID de Firebase
 * @returns {Promise<Object>} - Objeto decodificado del token
 */
async function verifyIdToken(idToken) {
  if (!firebaseInitialized) {
    throw new Error("Firebase Admin SDK no está inicializado");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error al verificar token de Firebase:", error);
    throw error;
  }
}

/**
 * Obtiene información de un usuario de Firebase
 * @param {string} uid - UID del usuario en Firebase
 * @returns {Promise<Object>} - Objeto usuario de Firebase
 */
async function getFirebaseUser(uid) {
  if (!firebaseInitialized) {
    throw new Error("Firebase Admin SDK no está inicializado");
  }

  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error("Error al obtener usuario de Firebase:", error);
    throw error;
  }
}

/**
 * Verifica si el email de un usuario está verificado
 * @param {string} uid - UID del usuario en Firebase
 * @returns {Promise<boolean>} - True si el email está verificado
 */
async function isEmailVerified(uid) {
  try {
    const userRecord = await getFirebaseUser(uid);
    return userRecord.emailVerified;
  } catch (error) {
    console.error("Error al verificar estado de email:", error);
    return false;
  }
}

// Inicializar Firebase Admin SDK al cargar el módulo
initializeFirebase();

module.exports = {
  admin,
  initializeFirebase,
  isFirebaseInitialized,
  verifyIdToken,
  getFirebaseUser,
  isEmailVerified,
};
