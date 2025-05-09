/**
 * Mensajes de error y éxito para la aplicación
 */

// Mensajes de error
const errorMessages = {
  // Errores de autenticación
  INVALID_CREDENTIALS: "Credenciales incorrectas",
  EMAIL_IN_USE: "El correo electrónico ya está en uso",
  USERNAME_IN_USE: "El nombre de usuario ya está en uso",
  MISSING_FIELDS: "Rellene todos los campos",
  REGISTRATION_ERROR: "Error al registrar el usuario",
  EMAIL_NOT_VERIFIED: "Por favor verifica tu correo electrónico antes de iniciar sesión",
  TOKEN_NOT_PROVIDED: "Token no proporcionado",
  INVALID_TOKEN: "Token inválido o expirado",
  FIREBASE_NOT_INITIALIZED: "Error de configuración del servidor: Firebase Admin SDK no inicializado",

  // Errores de usuario
  USER_NOT_FOUND: "Usuario no encontrado",
  USER_CREATE_ERROR: "Error al crear usuario",
  USER_UPDATE_ERROR: "Error al actualizar usuario",

  // Errores de equipos
  TEAM_FETCH_ERROR: "Error al obtener equipos",
  TEAM_CREATE_ERROR: "Error al crear equipo",
  TEAM_DELETE_ERROR: "Error al eliminar equipo",
  TEAM_NOT_FOUND: "Equipo no encontrado",

  // Errores de base de datos
  DATABASE_ERROR: "Error de base de datos",
  CONNECTION_ERROR: "Error de conexión a la base de datos",

  // Errores generales
  SERVER_ERROR: "Error del servidor",
  NOT_AUTHORIZED: "No autorizado",
  NOT_FOUND: "Recurso no encontrado",
  VALIDATION_ERROR: "Error de validación",
};

// Mensajes de éxito
const successMessages = {
  // Éxitos de autenticación
  LOGIN_SUCCESS: "Login exitoso",
  REGISTRATION_SUCCESS: "Registro exitoso",
  LOGOUT_SUCCESS: "Sesión cerrada correctamente",
  EMAIL_VERIFICATION_SENT: "Se ha enviado un correo de verificación",

  // Éxitos de usuario
  USER_CREATED: "Usuario creado correctamente",
  USER_UPDATED: "Usuario actualizado correctamente",

  // Éxitos de equipos
  TEAM_CREATED: "Equipo creado correctamente",
  TEAM_DELETED: "Equipo eliminado correctamente",
  TEAM_UPDATED: "Equipo actualizado correctamente",

  // Éxitos generales
  OPERATION_SUCCESS: "Operación realizada con éxito",
};

// Mensajes de verificación de Firebase
const firebaseMessages = {
  EMAIL_VERIFICATION_SENT: "Se ha enviado un correo de verificación",
  TOKEN_VERIFIED: "Token verificado correctamente",
  EMAIL_VERIFIED: "Email verificado correctamente",
};

module.exports = {
  errorMessages,
  successMessages,
  firebaseMessages,
};
