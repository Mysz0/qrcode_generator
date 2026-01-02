const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../db');
const bcrypt = require('bcrypt');
const moment = require('moment'); // Dodano import moment

// Znajdź użytkownika po emailu
async function findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
}

// Tworzenie nowego użytkownika
async function createUser(email, password) {
    const id = uuidv4();
    await db.query(
        'INSERT INTO users (id, email, password) VALUES (?, ?, ?)',
        [id, email, password]
    );
    return id;
}

// Znajdź użytkownika po tokenie aktywacyjnym
async function findByActivationToken(token) {
    const [rows] = await db.query(
        'SELECT * FROM users WHERE activationToken = ? AND activationTokenExpiry > ?',
        [token, new Date()]
    );
    return rows[0];
}

// Aktywuj użytkownika i wyczyść token aktywacyjny
async function activateUser(userId) {
    await db.query(
        'UPDATE users SET active = true, activationToken = NULL, activationTokenExpiry = NULL WHERE id = ?',
        [userId]
    );
}


// Wyczyść token aktywacyjny
async function clearActivationToken(userId) {
    await db.query(
        'UPDATE users SET activationToken = NULL, activationTokenExpiry = NULL WHERE id = ?',
        [userId]
    );
}

// Dodaj funkcję do zapisywania tokenu aktywacyjnego
async function saveActivationToken(userId, activationToken) {
    const query = 'UPDATE users SET activationToken = ?, activationTokenExpiry = ? WHERE id = ?';
    
    // Oblicz datę wygaśnięcia tokenu jako 'YYYY-MM-DD HH:mm:ss'
    const expiryDate = moment().add(10, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    
    const params = [activationToken, expiryDate, userId]; // Token ważny przez 10 minut w poprawnym formacie
    await db.query(query, params);
}

// Tworzenie tokenu do resetowania hasła
async function createResetPasswordToken(userId) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minut

    await db.query(
        'UPDATE users SET passwordResetToken = ?, passwordResetTokenExpires = ? WHERE id = ?',
        [resetTokenHash, expires, userId]
    );

    return resetToken; // Zwracamy surowy token
}

// Resetowanie hasła użytkownika
async function resetPassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
        'UPDATE users SET password = ?, passwordResetToken = NULL, passwordResetTokenExpires = NULL WHERE id = ?',
        [hashedPassword, userId]
    );
}

// Metoda do czyszczenia tokenu resetowania
async function clearResetToken(userId) {
    await db.query(
        'UPDATE users SET passwordResetToken = NULL, passwordResetTokenExpires = NULL WHERE id = ?',
        [userId]
    );
}

// Znajdź użytkownika po tokenie resetowania
async function findByResetToken(token) {
    const [rows] = await db.query(
        'SELECT * FROM users WHERE passwordResetToken = ? AND passwordResetTokenExpires > ?',
        [token, new Date()]
    );
    return rows[0];
}

// Aktualizowanie hasła użytkownika
async function updatePassword(userId, hashedPassword) {
    await db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
    );
}

// Find users with expired activation tokens
async function findUsersWithExpiredActivationTokens(currentTime) {
    const [rows] = await db.query(
        'SELECT id FROM users WHERE activationTokenExpiry < ? AND active = 0',
        [currentTime]
    );
    return rows;
}
async function deleteUser(userId) {
    await db.query(
        'DELETE FROM users WHERE id = ?',
        [userId]
    );
}


module.exports = {
    findByEmail,
    createUser,
    findByActivationToken,
    activateUser,
    clearActivationToken,
    saveActivationToken,
    createResetPasswordToken,
    resetPassword,
    clearResetToken,
    findByResetToken,
    updatePassword,
    findUsersWithExpiredActivationTokens,
    deleteUser  
};
