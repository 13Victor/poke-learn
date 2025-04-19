const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Importar rutas
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const dataRoutes = require("./routes/data");
const teamRoutes = require("./routes/teams");
const battleRouter = require("./routes/battle");

dotenv.config(); // Cargar variables de entorno

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/data", dataRoutes);
app.use("/teams", teamRoutes);
app.use("/battle", battleRouter);

// Servir archivos estáticos desde la carpeta de imágenes
app.use("/uploads/profile_pictures", express.static(path.join(__dirname, "public/profile_pictures")));

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
