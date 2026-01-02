const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route to save QR code
router.post('/save_qr', authMiddleware, async (req, res) => {
    const { link, qrImageData, title } = req.body; // Pobranie tytułu
    const userId = req.user?.id; // Pobranie ID użytkownika z middleware

    if (!userId) {
        return res.status(401).json({ message: 'Użytkownik nie jest uwierzytelniony' });
    }

    try {
        const result = await qrController.saveQRCode(link, qrImageData, userId, title);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Błąd przy zapisywaniu QR kodu' });
    }
});


// Route to get QR code by ID
router.get('/get/:id', async (req, res) => { // Changed to '/get/:id'
    const { id } = req.params;
    try {
        const qrCode = await qrController.getQRCodeById(id);
        if (qrCode) {
            res.json(qrCode);
        } else {
            res.status(404).json({ message: 'QR kod nie został znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Błąd przy pobieraniu QR kodu' });
    }
});

// Route to list QR codes for the authenticated user
router.get('/list', authMiddleware, async (req, res) => {
    const userId = req.user?.id; // Pobranie ID użytkownika z middleware

    if (!userId) {
        return res.status(401).json({ message: 'Użytkownik nie jest uwierzytelniony' });
    }

    try {
        const qrCodes = await qrController.getAllQRCodesForUser(userId);
        res.json(qrCodes);
    } catch (error) {
        res.status(500).json({ message: 'Błąd przy pobieraniu QR kodów' });
    }
});

// Route to delete QR code
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Użytkownik nie jest uwierzytelniony' });
    }

    try {
        const result = await qrController.deleteQRCode(id, userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Błąd przy usuwaniu QR kodu' });
    }
});


module.exports = router;
