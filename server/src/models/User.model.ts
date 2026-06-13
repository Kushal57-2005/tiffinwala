import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    age: number;
    phone: string;
    email: string;
    password: string;
    role: 'customer' | 'vendor';
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    phoneOTP?: string;
    phoneOTPExpiry?: Date;
    emailOTP?: string;
    emailOTPExpiry?: Date;
    resetToken?: string;
    resetTokenExpiry?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'vendor'], required: true },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    phoneOTP: { type: String },
    phoneOTPExpiry: { type: Date },
    emailOTP: { type: String },
    emailOTPExpiry: { type: Date },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
});

UserSchema.pre('save', async function (this: IUser) {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (
    candidatePassword: string,
) {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
