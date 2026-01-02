const db = require('../db');  // Połączenie z bazą danych

exports.saveQRCode = async (link, qrImage) => {
    const [result] = await db.query(
        'INSERT INTO qr_codes (id, link, qr_image) VALUES (UUID(), ?, ?)',
        [link, qrImage]
    );
    
    // Wybierz UUID po wstawieniu
    const [rows] = await db.query('SELECT id FROM qr_codes WHERE link = ? ORDER BY created_at DESC LIMIT 1', [link]);
    
    return rows.length ? rows[0].id : null;  // Zwróć UUID z bazy
};

exports.deleteQRCode = async (id, userId) => {
    const qrCode = await exports.findQRCodeById(id);
    if (!qrCode) {
        throw new Error('QR kod nie istnieje');
    }

    if (qrCode.user_id !== userId) {
        throw new Error('Nie masz uprawnień do usunięcia tego QR kodu');
    }

    const [result] = await db.query('DELETE FROM qr_codes WHERE id = ?', [id]);
    return result.affectedRows > 0 ? { message: 'QR kod został usunięty' } : { message: 'QR kod nie znaleziony' };
};



exports.findQRCodeById = async (id) => {
    const [rows] = await db.query('SELECT * FROM qr_codes WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
};