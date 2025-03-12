const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const {
  authenticateUser,
  registerUser,
  isUserRegistered,
} = require("../database/db");

const router = express.Router();

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "secreto_super_seguro";

/* Ruta para iniciar sesión */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Rellene los campos" });
  }

  const result = await authenticateUser(email, password);
  if (result.error) {
    return res.status(401).json({ message: result.error });
  }

  const payload = {
    id: result.user.id,
    email: result.user.email,
    user_name: result.user.user_name,
    profile_picture: result.user.profile_picture,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" });

  res.json({ message: "Login exitoso", user: result.user, token: token });
});

/* Ruta para registrar un nuevo usuario */
router.post("/register", async (req, res) => {
  const { email, password, user_name } = req.body;

  if (!email || !password || !user_name) {
    return res.status(400).json({ message: "Rellene todos los campos" });
  }

  const result = await isUserRegistered(email, user_name);
  if (result.error) {
    return res.status(401).json({ message: result.error });
  }

  const registerResult = await registerUser(email, password, user_name);
  if (registerResult.error) {
    return res.status(500).json({ message: registerResult.error });
  }

  res.json({ message: "Registro exitoso" });
});

// Montamos el sub-router bajo '/auth'
// router.use('/auth', router);

module.exports = router;
