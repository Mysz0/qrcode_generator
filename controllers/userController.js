const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const validator = require('validator');
const SECRET_KEY = 'your-secret-key';
const crypto = require('crypto');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const CustomError = require('../utils/CustomError');
const moment = require('moment'); // Ensure moment is imported

// Rejestracja użytkownika
exports.register = async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    if (!password || password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    try {
        const existingUser = await userModel.findByEmail(email);

        if (existingUser) {
            return res.status(400).json({ message: 'Email is already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const userId = await userModel.createUser(email, hashedPassword);

        // Generate activation token
        const activationToken = crypto.randomBytes(32).toString('hex');
        const activationTokenExpiry = moment().add(20, 'minutes').format('YYYY-MM-DD HH:mm:ss'); // 20 minutes expiry
        await userModel.saveActivationToken(userId, activationToken, activationTokenExpiry);

        // Create activation URL
        const activationUrl = `${req.protocol}://${req.get('host')}/api/users/activate/${activationToken}`;
        const message = `Click the following link to activate your account:\n\n${activationUrl}\n\nThe activation link will be valid for 20 minutes.`;

        // Send activation email
        await sendEmail({
            email: email,
            subject: 'Account Activation',
            message: message
        });

        // Respond with message to check email
        res.status(200).json({
            status: 'success',
            message: 'Registration successful. Please check your email to activate your account.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};






// Aktywacja konta
exports.activateAccount = async (req, res) => {
    const { token } = req.params;

    try {
        // Find user by activation token
        const user = await userModel.findByActivationToken(token);

        if (!user) {
            return res.render('activation', {
                status: 'error',
                message: 'Invalid activation token.'
            });
        }

        // Check if token has expired
        const currentTime = moment().toDate();
        if (moment(user.activationTokenExpiry).isBefore(currentTime)) {
            // Token has expired, delete the user or handle accordingly
            await userModel.deleteUser(user.id);
            return res.render('activation', {
                status: 'error',
                message: 'Activation token has expired. Your account has been deleted.'
            });
        }

        // Activate the user
        await userModel.activateUser(user.id);

        // Generate JWT token
        const jwtToken = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });

        // Set JWT token in cookie
        res.cookie('jwt', jwtToken, { httpOnly: true });

        // Render success message
        res.render('activation', {
            status: 'success',
            message: 'Your account has been activated successfully. You are now logged in.'
        });
    } catch (error) {
        console.error('Activation error:', error);
        res.render('activation', {
            status: 'error',
            message: 'An error occurred during activation.'
        });
    }
};





exports.saveActivationToken = async (userId, activationToken) => {
    // Calculate the expiry time and format it as YYYY-MM-DD HH:mm:ss
    const expiryDate = moment().add(10, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    
    const query = 'UPDATE users SET activationToken = ?, activationTokenExpiry = ? WHERE id = ?';
    const params = [activationToken, expiryDate, userId];
    await db.query(query, params);
};


// Logowanie użytkownika
exports.login = async (req, res) => {
    const { email, password, rememberMe } = req.body;

    // Walidacja danych wejściowych
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Niepoprawny adres email' });
    }

    if (!password) {
        return res.status(400).json({ message: 'Hasło jest wymagane' });
    }

    try {
        const user = await userModel.findByEmail(email);

        // Sprawdzenie, czy użytkownik istnieje i czy konto zostało aktywowane
        if (user) {
            if (!user.active) {
                return res.status(403).json({ message: 'Twoje konto nie zostało aktywowane. Sprawdź email i aktywuj konto.' });
            }

            if (await bcrypt.compare(password, user.password)) {
                const token = jwt.sign(
                    { id: user.id, email: user.email }, 
                    SECRET_KEY, 
                    { expiresIn: rememberMe ? '7d' : '1h' }
                );

                // Ustawienie tokenu jako cookie, jeśli rememberMe jest zaznaczone
                res.cookie('authToken', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production', // Ustaw secure na true w trybie produkcji
                    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 1 * 60 * 60 * 1000 // 7 dni lub 1 godzina
                });

                return res.json({ token });
            } else {
                return res.status(401).json({ message: 'Niepoprawne dane logowania' });
            }
        } else {
            return res.status(401).json({ message: 'Niepoprawne dane logowania' });
        }
    } catch (error) {
        console.error('Błąd przy logowaniu:', error);
        return res.status(500).json({ message: 'Wystąpił błąd serwera' });
    }
};


// Funkcja resetowania hasła
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await userModel.findByEmail(email);

    if (!user) {
        return next(new CustomError('Nie można odnaleźć użytkownika z tym emailem', 404));
    }

    const resetToken = await userModel.createResetPasswordToken(user.id);

    const resetUrl = `${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}`;
    const message = `Link do resetowania hasła znajduje się poniżej\n\n${resetUrl}\n\nLink do resetowania hasła będzie aktywny przez 10 minut.`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Resetowanie hasła',
            message: message
        });

        res.status(200).json({
            status: 'success',
            message: 'Link do resetowania hasła został wysłany'
        });
    } catch (err) {
        // Jeśli coś poszło nie tak, upewnij się, że token i data wygaśnięcia są wyczyszczone
        await userModel.clearResetToken(user.id);

        return next(new CustomError('Wystąpił błąd przy wysyłaniu resetu hasła.', 500));
    }
});

// Funkcja resetowania hasła po kliknięciu w link
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
        return next(new CustomError('Brak wymaganych danych.', 400));
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userModel.findByResetToken(hashedToken);

    if (!user) {
        return next(new CustomError('Token jest niepoprawny lub wygasł!', 400));
    }

    if (password !== confirmPassword) {
        return next(new CustomError('Hasła nie pasują do siebie!', 400));
    }

    await userModel.resetPassword(user.id, password);
    await userModel.clearResetToken(user.id);

    res.status(200).json({
        status: 'success',
        message: 'Hasło zostało zaktualizowane'
    });
});

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token nie jest dostępny' });
    }

    try {
        // Sprawdź, czy token jest ważny
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await userModel.findByEmail(decoded.email);

        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        }

        // Sprawdź aktualne hasło
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Aktualne hasło jest nieprawidłowe' });
        }

        // Zaktualizuj hasło
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await userModel.updatePassword(user.id, hashedNewPassword);

        res.json({ status: 'success', message: 'Hasło zostało zmienione' });
    } catch (error) {
        res.status(500).json({ message: 'Wystąpił problem podczas zmiany hasła' });
    }
};
