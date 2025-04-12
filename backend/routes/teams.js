const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const { getUserTeams, createTeam, deleteTeam } = require("../database/db");

// Get teams
router.get("/", verifyToken, async (req, res) => {
  try {
    const teams = await getUserTeams(req.user.id);
    res.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ error: "Error retrieving teams" });
  }
});

// Create team
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, pokemon } = req.body;
    if (!name || !pokemon?.length) {
      return res.status(400).json({ error: "Invalid team data" });
    }

    const team = await createTeam(req.user.id, name, pokemon);
    res.status(201).json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ error: "Error creating team" });
  }
});

// Delete team
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await deleteTeam(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: "Team not found" });
    }
    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ error: "Error deleting team" });
  }
});

module.exports = router;
