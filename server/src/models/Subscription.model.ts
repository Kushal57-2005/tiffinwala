import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  customerId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  planName: string;
  totalTokens: number;
  remainingTokens: number;
  pricePaid: number;
  purchaseDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'exhausted';
}

const SubscriptionSchema = new Schema<ISubscription>(
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
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    totalTokens: {
      type: Number,
      required: true,
    },
    remainingTokens: {
      type: Number,
      required: true,
    },
    pricePaid: {
      type: Number,
      required: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'exhausted'],
      default: 'active',
    },
  },
  { timestamps: true },
);

// Fast lookup for "does this customer have an active subscription with this vendor"
SubscriptionSchema.index({ customerId: 1, vendorId: 1, status: 1 });

export const Subscription = mongoose.model<ISubscription>(
  'Subscription',
  SubscriptionSchema,
);
