/**
 * Middleware de autenticación
 */
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { formatResponse } = require("../utils/helpers");
const { errorMessages } = require("../utils/messages");

dotenv.config();

// Clave secreta para verificar tokens JWT
const SECRET_KEY = process.env.JWT_SECRET || "secreto_super_seguro";

/**
 * Middleware para verificar token JWT
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Siguiente middleware
 */
const verifyToken = (req, res, next) => {
  // Obtener token del header Authorization
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Formato: Bearer TOKEN

  if (!token) {
    return res.status(403).json(formatResponse(false, errorMessages.TOKEN_NOT_PROVIDED));
  }

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, SECRET_KEY);

    // Guardar los datos del usuario en req.user
    req.user = decoded;

    // Continuar con la siguiente función
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
