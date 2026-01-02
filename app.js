const express = require('express');
const path = require('path');
const app = express();
const authMiddleware = require('./middlewares/authMiddleware');
const CustomError = require('./controllers/CustomError');
const qrRoutes = require('./routes/qrRoutes');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config(); // Dodaj tę linię, aby załadować zmienne środowiskowe

app.use(express.json());
app.use(express.static('public'));

// Ustawienie katalogu z widokami
app.set('views', path.join(__dirname, 'views'));

// Ustawienie silnika szablonów
app.set('view engine', 'ejs');

// Trasy wymagające autoryzacji
app.use('/api/qr-codes', authMiddleware, qrRoutes);
app.use('/api/users', userRoutes);

// Middleware obsługujący błędy
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
});

const port = 3001;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
