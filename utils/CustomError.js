class CustomError extends Error {
    constructor(message, statusCode) {
        super(message); // Wywołuje konstruktor klasy `Error` i ustawia wiadomość błędu
        this.statusCode = statusCode; // Ustawia kod statusu HTTP
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // Ustala, czy błąd dotyczy klienta czy serwera
        this.isOperational = true; // Oznaczamy jako błąd operacyjny (znany)

        // Zachowanie stosu (stack trace) błędu, ale bez tej funkcji konstruktora
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = CustomError;
