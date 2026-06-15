import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';

export const generateToken = (userId: string, role: string): string => {
    const options: SignOptions = {
        expiresIn: (process.env.JWT_EXPIRES_IN ||
            '7d') as SignOptions['expiresIn'],
    };

    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET as string,
        options,
    );
};

export const sendTokenCookie = (res: Response, token: string): void => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};
