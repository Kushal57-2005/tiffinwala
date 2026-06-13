"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const api_error_1 = require("../utils/api-error");
const authMiddleware = (req, res, next) => {
    console.log('Cookies:', req.cookies);
    const token = req.cookies?.token;
    if (!token) {
        throw new api_error_1.ApiError(401, 'Not authenticated, please login');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        throw new api_error_1.ApiError(401, 'Invalid or expired token');
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.middleware.js.map