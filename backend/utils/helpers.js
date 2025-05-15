/**
 * Funciones auxiliares para la aplicación
 */

/**
 * Formatea la respuesta para el cliente
 * @param {boolean} success - Indica si la operación fue exitosa
 * @param {string} message - Mensaje para el cliente
 * @param {Object} data - Datos adicionales para enviar al cliente (opcional)
 * @returns {Object} - Respuesta formateada
 */
function formatResponse(success, message, data = null) {
  const response = {
    success,
    message,
  };

  if (data) {
    response.data = data;
  }

  return response;
}

/**
 * Filtra los campos sensibles de un objeto usuario
 * @param {Object} user - Objeto usuario
 * @returns {Object} - Usuario sin campos sensibles
 */
function filterSensitiveData(user) {
  if (!user) return null;

  // Clonar el objeto para no modificar el original
  const filteredUser = { ...user };

  // Eliminar campos sensibles
  delete filteredUser.password;
  delete filteredUser.firebase_uid;

  return filteredUser;
}

/**
 * Genera un nombre de usuario único basado en el email
 * @param {string} email - Email del usuario
 * @param {number} randomSuffix - Sufijo aleatorio (opcional)
 * @returns {string} - Nombre de usuario único
 */
function generateUsername(email, randomSuffix = null) {
  // Extraer la parte local del email (antes del @)
  const localPart = email.split("@")[0];

  // Limpiar caracteres no permitidos
  const cleanUsername = localPart.replace(/[^a-zA-Z0-9_]/g, "");

  // Añadir sufijo aleatorio si se proporciona
  if (randomSuffix !== null) {
    return `${cleanUsername}${randomSuffix}`;
  }

  // Generar sufijo aleatorio
  const suffix = Math.floor(Math.random() * 1000);
  return `${cleanUsername}${suffix}`;
}

/**
 * Parsea y valida el ID de un usuario o equipo
 * @param {string|number} id - ID a validar
 * @returns {number|null} - ID numérico o null si es inválido
 */
function parseId(id) {
  const numericId = parseInt(id, 10);

  if (isNaN(numericId) || numericId <= 0) {
    return null;
  }

  return numericId;
}

/**
 * Determina el tipo MIME de un archivo por su extensión
 * @param {string} filename - Nombre del archivo
 * @returns {string} - Tipo MIME del archivo
 */
function getMimeType(filename) {
  const extension = filename.split(".").pop().toLowerCase();

  const mimeTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    pdf: "application/pdf",
    txt: "text/plain",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
  };

  return mimeTypes[extension] || "application/octet-stream";
}

module.exports = {
  formatResponse,
  filterSensitiveData,
  generateUsername,
  parseId,
  getMimeType,
};
