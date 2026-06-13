export type Role = 'customer' | 'vendor';

export interface IUser {
    _id: string;
    firstName: string;
    lastName: string;
    age: number;
    phone: string;
    email: string;
    role: Role;
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
}
