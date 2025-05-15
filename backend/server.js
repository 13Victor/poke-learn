/**
 * Servidor principal para Poke-Learn
 */
const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// Cargar variables de entorno
dotenv.config();

// Importar configuración de Firebase
const firebase = require("./config/firebase");

// Importar rutas
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const dataRoutes = require("./routes/data");
const teamRoutes = require("./routes/teams");
const battleRoutes = require("./routes/battle");

// Inicializar Firebase Admin SDK
if (!firebase.isFirebaseInitialized()) {
  console.warn("⚠️ Firebase Admin SDK no inicializado. Algunas funcionalidades podrían no estar disponibles.");
}

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para servir archivos estáticos
app.use("/uploads/profile_pictures", express.static(path.join(__dirname, "public/profile_pictures")));
app.use(express.static(path.join(__dirname, "public")));

// Middleware para logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configurar rutas
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/data", dataRoutes);
app.use("/teams", teamRoutes);
app.use("/battle", battleRoutes);

// Ruta para verificar que el servidor está funcionando
app.get("/", (req, res) => {
  res.json({
    message: "Poke-Learn API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// Manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error("Error en el servidor:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log("==========================================================");
  console.log(`🚀 Servidor de Poke-Learn ejecutándose en puerto ${PORT} 🚀`);
  console.log(`- URL del servidor: http://localhost:${PORT}`);
  console.log(`- Modo: ${process.env.NODE_ENV || "desarrollo"}`);
  console.log(`- Timestamp: ${new Date().toISOString()}`);
  console.log("==========================================================");
});

// Manejo de errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
