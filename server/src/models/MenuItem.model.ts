import mongoose, { Document, Schema } from 'mongoose';

export interface ITier {
    name: string;
    items: string[];
    price: number;
    maxQuantity: number;
    remainingQuantity: number;
}

export interface IAddOn {
    name: string;
    price: number;
}

export interface IMenuItem extends Document {
    vendorId: mongoose.Types.ObjectId;
    session: 'lunch' | 'dinner';
    tiers: ITier[];
    addOns: IAddOn[];
    description: string;
    date: Date;
    isExpired: boolean;
}

const TierSchema = new Schema<ITier>(
    {
        name: { type: String, required: true, trim: true },
        items: {
            type: [String],
            required: true,
            validate: {
                validator: (arr: string[]) => arr.length > 0,
                message: 'At least one item is required in tier',
            },
        },
        price: { type: Number, required: true },
        maxQuantity: { type: Number, required: true },
        remainingQuantity: { type: Number, required: true },
    },
    { _id: false },
);

const AddOnSchema = new Schema<IAddOn>(
    {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true },
    },
    { _id: false },
);

const MenuItemSchema = new Schema<IMenuItem>(
    {
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
        },
        session: { type: String, enum: ['lunch', 'dinner'], required: true },
        tiers: {
            type: [TierSchema],
            required: true,
            validate: {
                validator: (arr: ITier[]) => arr.length > 0,
                message: 'At least one tier is required',
            },
        },
        addOns: { type: [AddOnSchema], default: [] },
        description: { type: String, default: '', trim: true },
        date: { type: Date, required: true },
        isExpired: { type: Boolean, required: true },
    },
    { timestamps: true },
);

MenuItemSchema.index({ vendorId: 1, session: 1, date: 1 }, { unique: true });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
