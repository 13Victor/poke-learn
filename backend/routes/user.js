/**
 * Rutas de usuario
 */
const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const { formatResponse, asyncHandler } = require("../utils/helpers");
const { errorMessages, successMessages } = require("../utils/messages");
const { getUserById } = require("../database/userQueries");

const router = express.Router();

/**
 * @route GET /user
 * @desc Obtener perfil del usuario autenticado
 */
router.get("", verifyToken, async (req, res) => {
  // El middleware verifyToken añade el usuario autenticado a req.user
  // Comprobar si necesitamos más detalles del usuario desde la base de datos
  const userId = req.user.id;

  try {
    // Si necesitamos obtener información actualizada del usuario
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json(formatResponse(false, errorMessages.USER_NOT_FOUND));
    }

    // Responder con el perfil del usuario
    res.json(formatResponse(true, "Perfil del usuario", { user }));
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    res.status(500).json(formatResponse(false, errorMessages.SERVER_ERROR));
  }
});

/**
 * @route GET /user/teams
 * @desc Obtener equipos del usuario
 */
router.get("/teams", verifyToken, async (req, res) => {
  const userId = req.user.id;

  const { getUserTeams } = require("../database/teamQueries");

  try {
    const teams = await getUserTeams(userId);
    res.json(formatResponse(true, "Equipos del usuario", { teams }));
  } catch (error) {
    console.error("Error al obtener equipos del usuario:", error);
    res.status(500).json(formatResponse(false, errorMessages.TEAM_FETCH_ERROR));
  }
});

/**
 * @route PUT /user/profile
 * @desc Actualizar perfil del usuario
 */
router.put("/profile", verifyToken, async (req, res) => {
  const userId = req.user.id;
  // Implementar actualización de perfil
  // ...

  res.json(formatResponse(true, successMessages.USER_UPDATED));
});

/**
 * @route DELETE /user/account
 * @desc Eliminar cuenta de usuario
 */
router.delete("/account", verifyToken, async (req, res) => {
  const userId = req.user.id;
  // Implementar eliminación de cuenta
  // ...

  res.json(formatResponse(true, "Cuenta eliminada correctamente"));
});

module.exports = router;
