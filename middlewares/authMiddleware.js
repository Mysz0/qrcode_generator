const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your-secret-key'; // Używaj tego samego klucza, co w kontrolerze użytkownika

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Pobierz token z nagłówka 'Authorization'

   // console.log('Received token:', token); // Debugowanie

    if (!token) {
        return res.status(401).json({ message: 'Token is missing' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY); // Weryfikacja tokenu przy użyciu klucza sekretnego
        req.user = decoded; // Dodaj dane użytkownika do obiektu req
        next();
    } catch (err) {
        console.error('Token verification error:', err); // Debugowanie
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;
