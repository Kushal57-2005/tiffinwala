import mongoose, { Document, Schema } from 'mongoose';

export interface IMonthlyBill extends Document {
  vendorId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  totalRevenue: number;
  platformFeeCharged: number;
  netPaid: number;
  deductedFromPlatformBalance: number;
  deductedFromWallet: number;
  status: 'paid' | 'partial' | 'failed';
  generatedAt: Date;
}

const MonthlyBillSchema = new Schema<IMonthlyBill>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    totalRevenue: { type: Number, required: true },
    platformFeeCharged: { type: Number, required: true },
    netPaid: { type: Number, required: true },
    deductedFromPlatformBalance: { type: Number, default: 0 },
    deductedFromWallet: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['paid', 'partial', 'failed'],
      default: 'paid',
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Prevent duplicate bill for same vendor+month+year
MonthlyBillSchema.index({ vendorId: 1, month: 1, year: 1 }, { unique: true });

export const MonthlyBill = mongoose.model<IMonthlyBill>(
  'MonthlyBill',
  MonthlyBillSchema,
);
