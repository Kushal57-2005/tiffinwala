import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ApiError } from '../utils/api-error';

export const requireRole = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            throw new ApiError(403, 'Access denied');
        }
        next();
    };
};
