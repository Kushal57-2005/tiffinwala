"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTokenCookie = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (userId, role) => {
    const options = {
        expiresIn: (process.env.JWT_EXPIRES_IN ||
            '7d'),
    };
    return jsonwebtoken_1.default.sign({ userId, role }, process.env.JWT_SECRET, options);
};
exports.generateToken = generateToken;
const sendTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};
exports.sendTokenCookie = sendTokenCookie;
//# sourceMappingURL=jwt.js.map