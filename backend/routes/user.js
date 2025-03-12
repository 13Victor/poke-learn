const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("", verifyToken, (req, res) => {
  res.json({ message: "Perfil del usuario", user: req.user });
});

module.exports = router;
