"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const api_error_1 = require("../utils/api-error");
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            throw new api_error_1.ApiError(403, 'Access denied');
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=role.middleware.js.map