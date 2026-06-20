import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  vendorId: mongoose.Types.ObjectId;
  name: string;
  totalTokens: number;
  price: number;
  isActive: boolean;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    totalTokens: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
  'SubscriptionPlan',
  SubscriptionPlanSchema,
);
