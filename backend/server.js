const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config(); // Carga las variables de entorno

const app = express();
app.use(express.json()); // Para parsear JSON
app.use(cors()); // Permite peticiones desde el frontend

// Configuración de la conexión a MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Busca un usuario por email o nombre de usuario y verifica la contraseña.
 * @param {string} email - Email o nombre de usuario ingresado.
 * @param {string} password - Contraseña en texto plano.
 * @returns {object} - Usuario autenticado o error.
 */
async function authenticateUser(email, password) {
    const query = `SELECT id, email, user_name, password FROM users WHERE email = ? OR user_name = ?`;
    const db = pool.promise();
    const [rows] = await db.execute(query, [email, email]);

    if (rows.length === 0) {
        return { error: "Credenciales incorrectas" };
    }

    const user = rows[0];

    // Comparar la contraseña hasheada
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return { error: "Credenciales incorrectas" };
    }

    return { user };
}

/**
 * Verifica si un email o nombre de usuario ya existen en la base de datos.
 * @param {string} email - Email a verificar.
 * @param {string} user_name - Nombre de usuario a verificar.
 * @returns {object} - Mensaje de error si ya existen, o éxito.
 */
async function isUserRegistered(email, user_name) {
    const query = `SELECT email, user_name FROM users WHERE email = ? OR user_name = ?`;
    const db = pool.promise();
    const [rows] = await db.execute(query, [email, user_name]);

    if (rows.length > 0) {
        const existingUser = rows[0];
        if (existingUser.email === email) {
            return { error: "El correo electrónico ya está en uso" };
        }
        if (existingUser.user_name === user_name) {
            return { error: "El nombre de usuario ya está en uso" };
        }
    }

    return { success: true };
}

/**
 * Registra un nuevo usuario en la base de datos.
 * @param {string} email - Email del usuario.
 * @param {string} password - Contraseña en texto plano.
 * @param {string} user_name - Nombre de usuario.
 * @returns {object} - Éxito o error.
 */
async function registerUser(email, password, user_name) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO users (email, password, user_name) VALUES (?, ?, ?)`;
        const db = pool.promise();
        await db.execute(query, [email, hashedPassword, user_name]);
        return { success: true };
    } catch (error) {
        return { error: "Error al registrar el usuario" };
    }
}

// Rutas

// ✅ Ruta para iniciar sesión
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Rellene los campos' });
    }

    const result = await authenticateUser(email, password);
    if (result.error) {
        return res.status(401).json({ message: result.error });
    }

    res.json({ message: "Login exitoso", user: result.user });
});

// ✅ Ruta para registrar un nuevo usuario
app.post('/register', async (req, res) => {
    const { email, password, user_name } = req.body;

    if (!email || !password || !user_name) {
        return res.status(400).json({ message: 'Rellene todos los campos' });
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

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
