/**
 * Rutas de administración
 */
const express = require("express");
const { formatResponse } = require("../utils/helpers");
const { errorMessages, successMessages } = require("../utils/messages");
const { createDatabase } = require("../database/db");
const { verifyAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * Función genérica para manejar acciones de la base de datos
 * @param {Function} action - Función a ejecutar
 * @param {Object} res - Respuesta HTTP
 */
const handleDatabaseAction = async (action, res) => {
  try {
    const result = await action();
    if (result.error) {
      return res.status(500).json(formatResponse(false, result.error));
    }
    res.json(formatResponse(true, result.message));
  } catch (error) {
    console.error("Error en acción de base de datos:", error);
    res.status(500).json(formatResponse(false, error.message || errorMessages.DATABASE_ERROR));
  }
};

/**
 * @route POST /admin/create-db
 * @desc Crear la base de datos y sus tablas
 * @access Admin
 */
router.post("/create-db", verifyAdmin, async (req, res) => {
  await handleDatabaseAction(createDatabase, res);
});

/**
 * @route GET /admin/stats
 * @desc Obtener estadísticas del sistema
 * @access Admin
 */
router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    // Aquí podrías implementar la lógica para obtener estadísticas del sistema
    // Por ejemplo, número de usuarios, equipos, batallas, etc.

    // Ejemplo básico
    const stats = {
      usersCount: 0,
      teamsCount: 0,
      battlesCount: 0,
      serverUptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    res.json(formatResponse(true, "Estadísticas del sistema", { stats }));
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json(formatResponse(false, errorMessages.SERVER_ERROR));
  }
});

module.exports = router;
