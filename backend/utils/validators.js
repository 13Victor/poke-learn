/**
 * Funciones de validación para la aplicación
 */

/**
 * Valida un correo electrónico
 * @param {string} email - Correo electrónico a validar
 * @returns {boolean} - True si el email es válido
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} - Resultado de la validación
 */
function validatePassword(password) {
  // Validación más estricta: mínimo 8 caracteres, una mayúscula, un número y un símbolo
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: "La contraseña debe tener al menos 8 caracteres",
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

  if (!hasUpperCase) {
    return {
      valid: false,
      message: "La contraseña debe incluir al menos una letra mayúscula",
    };
  }

  if (!hasLowerCase) {
    return {
      valid: false,
      message: "La contraseña debe incluir al menos una letra minúscula",
    };
  }

  if (!hasNumbers) {
    return {
      valid: false,
      message: "La contraseña debe incluir al menos un número",
    };
  }

  if (!hasSymbols) {
    return {
      valid: false,
      message: "La contraseña debe incluir al menos un símbolo especial (!@#$%^&*...)",
    };
  }

  return { valid: true };
}

/**
 * Valida un nombre de usuario
 * @param {string} userName - Nombre de usuario a validar
 * @returns {Object} - Resultado de la validación
 */
function validateUserName(userName) {
  if (!userName || userName.length < 3) {
    return {
      valid: false,
      message: "El nombre de usuario debe tener al menos 3 caracteres",
    };
  }

  // Solo permitir letras, números y guiones bajos
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(userName)) {
    return {
      valid: false,
      message: "El nombre de usuario solo puede contener letras, números y guiones bajos",
    };
  }

  return { valid: true };
}

/**
 * Valida los datos de registro de un usuario
 * @param {Object} userData - Datos del usuario
 * @returns {Object} - Resultado de la validación
 */
function validateUserRegistration(userData) {
  const { email, password, user_name } = userData;

  // Verificar que todos los campos están presentes
  if (!email || !password || !user_name) {
    return {
      valid: false,
      message: "Todos los campos son obligatorios",
    };
  }

  // Validar email
  if (!isValidEmail(email)) {
    return {
      valid: false,
      message: "El correo electrónico no es válido",
    };
  }

  // Validar contraseña
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return passwordValidation;
  }

  // Validar nombre de usuario
  const userNameValidation = validateUserName(user_name);
  if (!userNameValidation.valid) {
    return userNameValidation;
  }

  return { valid: true };
}

/**
 * Valida los datos de un equipo Pokémon
 * @param {Object} teamData - Datos del equipo
 * @returns {Object} - Resultado de la validación
 */
function validateTeam(teamData) {
  const { name, pokemon } = teamData;

  // Verificar nombre del equipo
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      message: "El nombre del equipo es obligatorio",
    };
  }

  // Verificar que hay Pokémon en el equipo
  if (!pokemon || !Array.isArray(pokemon) || pokemon.length === 0) {
    return {
      valid: false,
      message: "El equipo debe contener al menos un Pokémon",
    };
  }

  // Verificar cada Pokémon
  for (let i = 0; i < pokemon.length; i++) {
    const p = pokemon[i];
    if (!p.pokemon_name || !p.pokemon_id) {
      return {
        valid: false,
        message: `El Pokémon en la posición ${i + 1} debe tener nombre e ID`,
      };
    }

    // Verificar que el slot está dentro del rango válido
    if (!p.slot || p.slot < 1 || p.slot > 6) {
      return {
        valid: false,
        message: `El Pokémon ${p.pokemon_name} tiene un slot inválido (debe ser entre 1 y 6)`,
      };
    }
  }

  return { valid: true };
}

module.exports = {
  isValidEmail,
  validatePassword,
  validateUserName,
  validateUserRegistration,
  validateTeam,
};
