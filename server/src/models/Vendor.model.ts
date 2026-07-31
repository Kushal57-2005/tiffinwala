import mongoose, { Document, Schema } from 'mongoose';

export interface IVendor extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  deliveryRadiuskm: number;
  isOpen: boolean;
  walletBalance: number;
  platformBalance: number;
  totalRevenue: number;
  startingFee: number;
  isPlatformDebtFlagged: boolean;
  averageRating: number;
  totalRatings: number;
  isPaymentDone: boolean;
}

const VendorSchema = new Schema<IVendor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      default: 'Unknown TiffinWala',
      trim: true,
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      address: { type: String, default: ' ' },
    },
    deliveryRadiuskm: { type: Number, default: 5 },
    isOpen: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 },
    platformBalance: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    startingFee: { type: Number, default: 9999 },
    isPlatformDebtFlagged: {
      type: Boolean,
      default: false, // true when vendor can't cover monthly fee
    },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    isPaymentDone: { type: Boolean, default: false },
  },
  { timestamps: true },
);

VendorSchema.index({ location: '2dsphere' });

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
