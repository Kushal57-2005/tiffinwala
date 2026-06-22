import jwt, { SignOptions } from 'jsonwebtoken';

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
