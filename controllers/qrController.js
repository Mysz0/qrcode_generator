const db = require('../db'); // Importowanie bazy danych
const { v4: uuidv4 } = require('uuid'); // Do generowania unikalnych ID

// Funkcja do zapisywania QR kodu
async function saveQRCode(link, qrImage, userId, title) {
    try {
        const id = uuidv4(); // Generowanie unikalnego ID
        const [result] = await db.query(
            'INSERT INTO qr_codes (id, link, qr_image, user_id, title) VALUES (?, ?, ?, ?, ?)',
            [id, link, qrImage, userId, title]
        );
        return { qrId: id }; // Zwracanie wygenerowanego ID
    } catch (error) {
        console.error('Błąd przy zapisywaniu QR kodu:', error);
        throw error;
    }
}


// Funkcja do pobierania QR kodu według ID
async function getQRCodeById(id) {
    try {
        const [rows] = await db.query(
            'SELECT * FROM qr_codes WHERE id = ?',
            [id]
        );
        return rows[0];
    } catch (error) {
        console.error('Błąd przy pobieraniu QR kodu:', error);
        throw error;
    }
}

// Funkcja do pobierania wszystkich QR kodów dla użytkownika
async function getAllQRCodesForUser(userId) {
    try {
        const [rows] = await db.query('SELECT * FROM qr_codes WHERE user_id = ?', [userId]);
        return rows;
    } catch (error) {
        console.error('Błąd przy pobieraniu QR kodów dla użytkownika:', error);
        throw error;
    }
}

// Funkcja do usuwania QR kodu
async function deleteQRCode(id, userId) {
    try {
        // Sprawdź, czy QR kod należy do użytkownika
        const qrCode = await getQRCodeById(id);
        if (qrCode.user_id !== userId) {
            throw new Error('Nie masz uprawnień do usunięcia tego QR kodu');
        }

        // Usuń QR kod
        await db.query('DELETE FROM qr_codes WHERE id = ?', [id]);
        return { message: 'QR kod został usunięty' };
    } catch (error) {
        console.error('Błąd przy usuwaniu QR kodu:', error);
        throw error;
    }
}


module.exports = {
    saveQRCode,
    getQRCodeById,
    getAllQRCodesForUser,
    deleteQRCode
};
