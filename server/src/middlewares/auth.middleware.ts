import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/api-error';

export interface AuthRequest extends Request {
    user?: { userId: string; role: string };
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    const token = req.cookies?.token;

    if (!token) {
        throw new ApiError(401, 'Not authenticated, please login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: string;
            role: string;
        };

        req.user = decoded;
        next();
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired token');
    }
};
