const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userModel = require('../models/userModel'); // Import userModel
const path = require('path');

// Rejestracja użytkownika
router.post('/register', userController.register);

// Logowanie użytkownika
router.post('/login', userController.login);

// Żądanie resetowania hasła
router.post('/forgotPassword', userController.forgotPassword);

// Formularz do resetowania hasła
router.get('/resetPassword/:token', (req, res) => {
    res.render('resetPassword', { token: req.params.token }); // Renderowanie EJS z tokenem
});

// Resetowanie hasła (zmiana hasła za pomocą PATCH)
router.patch('/resetPassword/:token', userController.resetPassword);

router.get('/activate/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const user = await userModel.findByActivationToken(token);

        if (user) {
            if (user.active) {
                // If the account is already activated
                res.render('activation', {
                    message: 'Your account is already activated.',
                    showLoginLink: false
                });
            } else {
                // Activate the account and clear the activation token
                await userModel.activateUser(user.id);
                res.render('activation', {
                    message: 'Your account has been activated successfully.',
                    showLoginLink: true
                });
            }
        } else {
            res.render('activation', {
                message: 'Invalid or expired activation token.',
                showLoginLink: false
            });
        }
    } catch (error) {
        console.error('Error activating account:', error);
        res.status(500).render('activation', {
            message: 'An error occurred while activating your account.',
            showLoginLink: false
        });
    }
});





module.exports = router;
