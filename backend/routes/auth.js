/**
 * Rutas de autenticación
 */
const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

// Importar utilitarios y configuraciones
const { errorMessages, successMessages } = require("../utils/messages");
const { formatResponse, filterSensitiveData } = require("../utils/helpers");
const { validateUserRegistration } = require("../utils/validators");
const firebase = require("../config/firebase");

// Importar consultas a la base de datos
const {
  isUserRegistered,
  authenticateUser,
  registerUser,
  getUserByEmail,
  updateFirebaseUid,
  getUserById,
  updateUserPassword, // Nueva función para actualizar contraseña
} = require("../database/userQueries");

const router = express.Router();

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "secreto_super_seguro";

// Generar token JWT
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    user_name: user.user_name,
    profile_picture: user.profile_picture,
  };

  return jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });
}

/**
 * @route POST /auth/login
 * @desc Iniciar sesión (método tradicional)
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(formatResponse(false, errorMessages.MISSING_FIELDS));
    }

    const result = await authenticateUser(email, password);

    if (result.error) {
      return res.status(401).json(formatResponse(false, result.error));
    }

    const token = generateToken(result.user);

    res.json(
      formatResponse(true, successMessages.LOGIN_SUCCESS, {
        user: filterSensitiveData(result.user),
        token,
      })
    );
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json(formatResponse(false, errorMessages.SERVER_ERROR));
  }
});

/**
 * @route POST /auth/register
 * @desc Registrar un nuevo usuario (método tradicional)
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, user_name, firebase_uid } = req.body;

    // Validar datos de registro con requisitos más estrictos
    const validation = validateUserRegistration({ email, password, user_name });
    if (!validation.valid) {
      return res.status(400).json(formatResponse(false, validation.message));
    }

    // Verificar si el usuario ya está registrado
    const userCheck = await isUserRegistered(email, user_name);
    if (userCheck.error) {
      return res.status(401).json(formatResponse(false, userCheck.error));
    }

    // Registrar usuario
    const registerResult = await registerUser(email, password, user_name, firebase_uid || null);

    if (registerResult.error) {
      return res.status(500).json(formatResponse(false, registerResult.error));
    }

    res.json(formatResponse(true, successMessages.REGISTRATION_SUCCESS));
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json(formatResponse(false, errorMessages.SERVER_ERROR));
  }
});

/**
 * @route POST /auth/reset-password
 * @desc Verificar que el usuario existe antes de enviar email de reset
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(formatResponse(false, "Email es requerido"));
    }

    // Verificar si el usuario existe en nuestra base de datos
    const user = await getUserByEmail(email);

    if (!user) {
      // Por seguridad, no revelar si el usuario existe o no
      return res.json(formatResponse(true, "Si el correo está registrado, recibirás un enlace de restablecimiento"));
    }

    // Si el usuario existe, podemos proceder
    // El email real se enviará desde el frontend usando Firebase
    res.json(formatResponse(true, "Si el correo está registrado, recibirás un enlace de restablecimiento"));
  } catch (error) {
    console.error("Error en reset-password:", error);
    res.status(500).json(formatResponse(false, errorMessages.SERVER_ERROR));
  }
});

/**
 * @route POST /auth/confirm-password-reset
 * @desc Confirmar el restablecimiento de contraseña (opcional, para logs o estadísticas)
 */
router.post("/confirm-password-reset", async (req, res) => {
  try {
    const { email, firebase_uid } = req.body;

    if (!email && !firebase_uid) {
      return res.status(400).json(formatResponse(false, "Email o Firebase UID es requerido"));
    }

    // Buscar usuario por email o Firebase UID
    let user;
    if (firebase_uid) {
      // Buscar por Firebase UID (más seguro)
      user = await getUserById(firebase_uid); // Necesitarás implementar esta función si no existe
    } else {
      user = await getUserByEmail(email);
    }

    if (!user) {
      return res.status(404).json(formatResponse(false, "Usuario no encontrado"));
    }

    // Aquí podrías actualizar algún campo como "last_password_reset" si lo tienes
    // o simplemente registrar el evento para logs/estadísticas

    res.json(formatResponse(true, "Restablecimiento de contraseña confirmado"));
  } catch (error) {
    console.error("Error en confirm-password-reset:", error);
    res.status(500).json(formatResponse(false, errorMessages.SERVER_ERROR));
  }
});

/**
 * @route POST /auth/login-firebase
 * @desc Iniciar sesión con Firebase
 */
router.post("/login-firebase", async (req, res) => {
  try {
    // Verificar si se proporciona la información del usuario o el token
    const { firebase_token, user_info } = req.body;

    // Variables para almacenar la información del usuario validada
    let validatedUid, validatedEmail, emailVerified;

    // Si tenemos token, lo verificamos primero (enfoque más seguro)
    if (firebase_token) {
      // Verificar que Firebase está inicializado
      if (!firebase.isFirebaseInitialized()) {
        return res.status(500).json(formatResponse(false, errorMessages.FIREBASE_NOT_INITIALIZED));
      }

      try {
        // Verificar el token de Firebase
        const decodedToken = await firebase.verifyIdToken(firebase_token);
        validatedUid = decodedToken.uid;
        validatedEmail = decodedToken.email;

        // Verificar si el email está verificado directamente con Firebase Admin
        const firebaseUser = await firebase.getFirebaseUser(validatedUid);
        emailVerified = firebaseUser.emailVerified;
      } catch (error) {
        console.error("Error al verificar token de Firebase:", error);
        return res
          .status(401)
          .json(formatResponse(false, `${errorMessages.INVALID_TOKEN}: ${error.message}`, { details: error.code }));
      }
    }
    // Si no hay token, usamos la información de usuario enviada (menos seguro)
    else if (user_info && user_info.uid && user_info.email) {
      validatedUid = user_info.uid;
      validatedEmail = user_info.email;
      emailVerified = user_info.emailVerified;

      // Verificación adicional si Firebase Admin está inicializado y el usuario tiene verificación de email
      if (firebase.isFirebaseInitialized() && emailVerified) {
        try {
          // Doble verificación de usuario con Firebase (opcional, pero más seguro)
          const firebaseUser = await firebase.getFirebaseUser(validatedUid);

          // Verificar que la información coincida
          if (firebaseUser.email !== validatedEmail) {
            return res.status(401).json(formatResponse(false, "Información de usuario inválida"));
          }

          // Obtener el estado real de verificación de email desde Firebase
          emailVerified = firebaseUser.emailVerified;
        } catch (error) {
          console.error("Error al verificar usuario con Firebase:", error);
          // Continuamos con la información proporcionada por el cliente si hay error
        }
      }
    } else {
      // No hay suficiente información para autenticar
      return res.status(400).json(formatResponse(false, errorMessages.TOKEN_NOT_PROVIDED));
    }

    // Verificar si el email está verificado
    if (!emailVerified) {
      return res.status(403).json(formatResponse(false, errorMessages.EMAIL_NOT_VERIFIED));
    }

    // Buscar usuario en la base de datos local
    let user = await getUserByEmail(validatedEmail);

    // Si el usuario no existe, crearlo
    if (!user) {
      // Generar nombre de usuario a partir del email
      const userName = validatedEmail.split("@")[0] + Math.floor(Math.random() * 1000);

      // Registrar el usuario con contraseña aleatoria
      const registerResult = await registerUser(
        validatedEmail,
        Math.random().toString(36).slice(-12), // Contraseña aleatoria más larga
        userName,
        validatedUid
      );

      if (registerResult.error) {
        return res.status(500).json(formatResponse(false, registerResult.error));
      }

      // Obtener el usuario recién creado
      user = await getUserByEmail(validatedEmail);

      if (!user) {
        return res.status(500).json(formatResponse(false, errorMessages.USER_CREATE_ERROR));
      }
    }
    // Si el usuario existe pero no tiene Firebase UID o es diferente, actualizarlo
    else if (!user.firebase_uid || user.firebase_uid !== validatedUid) {
      await updateFirebaseUid(user.id, validatedUid);

      // Actualizar objeto user con el UID actualizado
      user.firebase_uid = validatedUid;
    }

    // Generar token JWT para nuestra aplicación
    const token = generateToken(user);

    // Devolver respuesta exitosa
    res.json(
      formatResponse(true, successMessages.LOGIN_SUCCESS, {
        user: filterSensitiveData(user),
        token,
      })
    );
  } catch (error) {
    console.error("Error general en login-firebase:", error);

    // Log detallado para ayudar a diagnosticar el problema
    console.error("Stack trace:", error.stack);

    res.status(500).json(
      formatResponse(false, `${errorMessages.SERVER_ERROR}: ${error.message}`, {
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      })
    );
  }
});

/**
 * @route GET /auth/test-firebase
 * @desc Verificar que Firebase Admin SDK está inicializado
 */
router.get("/test-firebase", (req, res) => {
  try {
    const isInitialized = firebase.isFirebaseInitialized();

    if (!isInitialized) {
      return res.status(500).json(formatResponse(false, errorMessages.FIREBASE_NOT_INITIALIZED));
    }

    res.json(
      formatResponse(true, "Firebase Admin SDK inicializado correctamente", {
        appsLength: firebase.admin.apps.length,
      })
    );
  } catch (error) {
    console.error("Error al verificar Firebase:", error);
    res.status(500).json(formatResponse(false, errorMessages.SERVER_ERROR));
  }
});

/**
 * @route GET /auth/check
 * @desc Verificar token JWT y obtener información del usuario
 */
router.get("/check", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth Header recibido:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Header de autorización inválido o ausente");
      return res.status(401).json(formatResponse(false, errorMessages.TOKEN_NOT_PROVIDED));
    }

    const token = authHeader.split(" ")[1]; // Formato: Bearer TOKEN

    if (!token || token === "undefined" || token === "null") {
      console.log("Token inválido o es 'undefined'/'null'");
      return res.status(401).json(formatResponse(false, "Token inválido o ausente"));
    }

    console.log("Token recibido:", token.substring(0, 15) + "...");

    try {
      // Asegurarse de que el SECRET_KEY sea correcto
      console.log("Verificando token con SECRET_KEY:", SECRET_KEY.substring(0, 3) + "..."); // Solo para depuración

      // Verificar y decodificar el token
      const decoded = jwt.verify(token, SECRET_KEY);
      console.log("Token decodificado correctamente. ID de usuario:", decoded.id);

      // Obtener información actualizada del usuario
      const userId = decoded.id;
      const user = await getUserById(userId);

      if (!user) {
        console.log("Usuario no encontrado en la BD:", userId);
        return res.status(404).json(formatResponse(false, errorMessages.USER_NOT_FOUND));
      }

      // Respuesta exitosa
      return res.json(
        formatResponse(true, "Token válido", {
          user: filterSensitiveData(user),
          decoded: process.env.NODE_ENV === "development" ? decoded : undefined, // Solo en desarrollo
        })
      );
    } catch (error) {
      console.error("Error específico al verificar token:", error.message);
      console.error("Tipo de error:", error.name);

      if (error.name === "TokenExpiredError") {
        return res.status(401).json(formatResponse(false, "Token expirado. Por favor, inicia sesión nuevamente."));
      } else if (error.name === "JsonWebTokenError") {
        return res.status(401).json(formatResponse(false, `Error en el token: ${error.message}`));
      }

      return res.status(401).json(formatResponse(false, errorMessages.INVALID_TOKEN));
    }
  } catch (error) {
    console.error("Error general en auth/check:", error);
    res.status(500).json(formatResponse(false, errorMessages.SERVER_ERROR));
  }
});

module.exports = router;
