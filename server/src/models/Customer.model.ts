import mongoose, { Document, Schema } from 'mongoose';

export interface IFriendProfile {
    _id?: mongoose.Types.ObjectId;
    name: string;
    phone?: string;
    nickname?: string;
    createdAt?: Date;
}

export interface ICustomer extends Document {
    userId: mongoose.Types.ObjectId;
    location: {
        type: string;
        coordinates: [number, number];
        address: string;
    };
    walletBalance: number;
    friendProfiles: mongoose.Types.DocumentArray<IFriendProfile>;
}

const FriendProfileSchema = new Schema<IFriendProfile>(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        nickname: { type: String, trim: true },
    },
    { _id: true },
);

const customerSchema = new Schema<ICustomer>(
    {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
            trim: true,
        },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] },
            address: { type: String, default: ' ' },
        },
        walletBalance: { type: Number, default: 0 },
        friendProfiles: { type: [FriendProfileSchema], default: [] },
    },
    { timestamps: true },
);

customerSchema.index({ location: '2dsphere' });
export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
