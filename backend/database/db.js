const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const mysql2 = require('mysql2/promise');
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

const pool2 = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
});

// 📌 Obtiene una imagen aleatoria de la carpeta "/uploads"
function getRandomProfilePicture() {
    const folderPath = path.join(__dirname, '../public/profile_pictures'); // Ruta de imágenes

    try {
        const files = fs.readdirSync(folderPath).filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
        return files[Math.floor(Math.random() * files.length)];
    } catch (error) {
        console.error("Error leyendo la carpeta de imágenes:", error);
        return 'default.png';
    }
}

// 📌 Autentica un usuario comparando email/user_name y contraseña
async function authenticateUser(emailOrUserName, password) {
    const query = `SELECT id, email, user_name, password, profile_picture FROM user WHERE email = ? OR user_name = ?`;
    const db = pool.promise();
    const [rows] = await db.execute(query, [emailOrUserName, emailOrUserName]);

    if (rows.length === 0) {
        return { error: "Credenciales incorrectas" };
    }

    const user = rows[0];

    // Comparar la contraseña hasheada
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return { error: "Credenciales incorrectas" };
    }

    return { success: true, user };
}

// 📌 Verifica si el email o el nombre de usuario ya existen
async function isUserRegistered(email, user_name) {
    const query = `SELECT email, user_name FROM user WHERE email = ? OR user_name = ?`;
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

// 📌 Registra un usuario en la base de datos con imagen de perfil aleatoria
async function registerUser(email, password, user_name) {
    try {
        const profile_picture = getRandomProfilePicture(); // Imagen aleatoria o default
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO user (email, password, user_name, profile_picture) VALUES (?, ?, ?, ?)`;
        const db = pool.promise();
        await db.execute(query, [email, hashedPassword, user_name, profile_picture]);
        return { success: true, profile_picture };
    } catch (error) {
        console.error("Error en el registro:", error);
        return { error: "Error al registrar el usuario" };
    }
}

// 📌 Crea la base de datos y sus tablas
async function createDatabase() {
    try {
        const sqlPath = path.join(__dirname, '../pokelearn.sql'); // Archivo con las sentencias SQL
        const sql = fs.readFileSync(sqlPath, 'utf8'); // Leer el archivo SQL

        const connection = await pool2.getConnection();
        await connection.query(sql);
        connection.release();

        return { message: "Base de datos creada correctamente." };
    } catch (error) {
        return { error: `Error al crear la base de datos: ${error.message}` };
    }
}



module.exports = { 
    authenticateUser, 
    isUserRegistered, 
    registerUser, 
    createDatabase
};