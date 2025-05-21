/**
 * Rutas para gestión de equipos Pokémon
 */
const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const { formatResponse, parseId } = require("../utils/helpers");
const { errorMessages, successMessages } = require("../utils/messages");
const { validateTeam } = require("../utils/validators");
// Importar el objeto db
const db = require("../database/db");
const { getUserTeams, createTeam, deleteTeam, getTeamById, updateTeam } = require("../database/teamQueries");

const router = express.Router();

/**
 * @route GET /teams
 * @desc Obtener todos los equipos del usuario
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const teams = await getUserTeams(userId);
    res.json(formatResponse(true, "Equipos del usuario", { teams }));
  } catch (error) {
    console.error("Error al obtener equipos:", error);
    res.status(500).json(formatResponse(false, errorMessages.TEAM_FETCH_ERROR));
  }
});

/**
 * @route GET /teams/:id
 * @desc Obtener un equipo por ID
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const teamId = parseId(req.params.id);

    if (!teamId) {
      return res.status(400).json(formatResponse(false, "ID de equipo inválido"));
    }

    const team = await getTeamById(teamId, userId);

    if (!team) {
      return res.status(404).json(formatResponse(false, errorMessages.TEAM_NOT_FOUND));
    }

    res.json(formatResponse(true, "Equipo encontrado", { team }));
  } catch (error) {
    console.error("Error al obtener equipo:", error);
    res.status(500).json(formatResponse(false, errorMessages.TEAM_FETCH_ERROR));
  }
});

/**
 * @route POST /teams
 * @desc Crear un nuevo equipo
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, pokemon } = req.body;

    // Validar datos del equipo
    const validation = validateTeam({ name, pokemon });
    if (!validation.valid) {
      return res.status(400).json(formatResponse(false, validation.message));
    }

    const team = await createTeam(userId, name, pokemon);
    res.status(201).json(formatResponse(true, successMessages.TEAM_CREATED, { team }));
  } catch (error) {
    console.error("Error al crear equipo:", error);
    res.status(500).json(formatResponse(false, errorMessages.TEAM_CREATE_ERROR));
  }
});

/**
 * @route PUT /teams/:id
 * @desc Actualizar un equipo
 */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const teamId = parseId(req.params.id);

    if (!teamId) {
      return res.status(400).json(formatResponse(false, "ID de equipo inválido"));
    }

    const { name, pokemon } = req.body;

    // Validar datos del equipo
    const validation = validateTeam({ name, pokemon });
    if (!validation.valid) {
      return res.status(400).json(formatResponse(false, validation.message));
    }

    // Usar la función updateTeam en lugar de la lógica en línea
    try {
      await updateTeam(teamId, userId, name, pokemon);
      res.json(formatResponse(true, successMessages.TEAM_UPDATED));
    } catch (error) {
      if (error.message.includes("no encontrado")) {
        return res.status(404).json(formatResponse(false, errorMessages.TEAM_NOT_FOUND));
      }
      throw error; // Re-lanzar para que lo capture el try/catch externo
    }
  } catch (error) {
    console.error("Error al actualizar equipo:", error);
    res.status(500).json(formatResponse(false, errorMessages.TEAM_UPDATE_ERROR || "Error al actualizar equipo"));
  }
});

/**
 * @route DELETE /teams/:id
 * @desc Eliminar un equipo
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const teamId = parseId(req.params.id);

    if (!teamId) {
      return res.status(400).json(formatResponse(false, "ID de equipo inválido"));
    }

    const deleted = await deleteTeam(teamId, userId);

    if (!deleted) {
      return res.status(404).json(formatResponse(false, errorMessages.TEAM_NOT_FOUND));
    }

    res.json(formatResponse(true, successMessages.TEAM_DELETED));
  } catch (error) {
    console.error("Error al eliminar equipo:", error);
    res.status(500).json(formatResponse(false, errorMessages.TEAM_DELETE_ERROR));
  }
});

module.exports = router;
