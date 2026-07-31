import mongoose, { Document, Schema } from 'mongoose';

export interface IDuePayment extends Document {
  customerId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  connectionId: mongoose.Types.ObjectId;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DuePaymentSchema = new Schema<IDuePayment>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Connection',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

// Fast lookup for vendor-specific due payments in a date range
DuePaymentSchema.index({ vendorId: 1, createdAt: 1 });

export const DuePayment = mongoose.model<IDuePayment>('DuePayment', DuePaymentSchema);
