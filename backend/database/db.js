const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();

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

// Busca un usuario por email o nombre de usuario y verifica la contraseña
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

// Verifica si un email o nombre de usuario ya existen en la base de datos
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

// Registra un nuevo usuario en la base de datos
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

module.exports = { authenticateUser, isUserRegistered, registerUser };
