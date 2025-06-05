/**
 * Middleware de autenticación
 */
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { formatResponse } = require("../utils/helpers");
const { errorMessages } = require("../utils/messages");
const { getUserById } = require("../database/userQueries");

dotenv.config();

// Clave secreta para verificar tokens JWT
const SECRET_KEY = process.env.JWT_SECRET || "secreto_super_seguro";

/**
 * Middleware para verificar token JWT
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Siguiente middleware
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Formato: Bearer TOKEN

  if (!token) {
    return res.status(403).json(formatResponse(false, errorMessages.TOKEN_NOT_PROVIDED));
  }

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, SECRET_KEY);

    // Obtener el usuario desde la base de datos para incluir el user_name y profile_picture
    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(404).json(formatResponse(false, errorMessages.USER_NOT_FOUND));
    }

    // Guardar los datos del usuario en req.user
    req.user = {
      id: decoded.id,
      user_name: user.user_name, // Nombre de usuario
      email: user.email,
      profile_picture: user.profile_picture, // Imagen de perfil
    };

    next();
  } catch (error) {
    console.error("Error al verificar token:", error.message);
    return res.status(401).json(formatResponse(false, errorMessages.INVALID_TOKEN));
  }
};

/**
 * Middleware para verificar que el usuario es administrador
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Siguiente middleware
 */
const verifyAdmin = (req, res, next) => {
  // Primero verificar que el usuario está autenticado
  verifyToken(req, res, () => {
    // Comprobar si el usuario tiene rol de administrador
    if (req.user && req.user.role === "admin") {
      return next();
    }

    return res.status(403).json(formatResponse(false, "Acceso denegado: requiere rol de administrador"));
  });
};

module.exports = {
  verifyToken,
  verifyAdmin,
};
