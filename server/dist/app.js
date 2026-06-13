"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173', // frontend URL
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Server Running for TiffinWala App');
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
// Global Error Handler Middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || []
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map