import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderTier {
  tierName: string;
  quantity: number;
  pricePerUnit: number;
}

export interface IOrderAddOn {
  addOnName: string;
  quantity: number;
  pricePerUnit: number;
}

export interface IOrder extends Document {
  customerId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  menuItemId: mongoose.Types.ObjectId;
  session: 'lunch' | 'dinner';
  tiers: IOrderTier[];
  addOns: IOrderAddOn[];
  forProfiles: string[];
  totalAmount: number;
  paymentMethod: 'wallet' | 'token';
  note?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'delivered' | 'received';
  customerLocation: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  date: Date;
}

const OrderTierSchema = new Schema<IOrderTier>(
  {
    tierName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerUnit: { type: Number, required: true },
  },
  { _id: false },
);

const OrderAddOnSchema = new Schema<IOrderAddOn>(
  {
    addOnName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerUnit: { type: Number, required: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
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
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    session: {
      type: String,
      enum: ['lunch', 'dinner'],
      required: true,
    },
    tiers: {
      type: [OrderTierSchema],
      required: true,
      validate: {
        validator: (arr: IOrderTier[]) => arr.length > 0,
        message: 'At least one tier must be ordered',
      },
    },
    addOns: {
      type: [OrderAddOnSchema],
      default: [],
    },
    forProfiles: {
      type: [String],
      default: ['Myself'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['wallet','token'],
      default: 'wallet',
    },
    note: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'delivered', 'received'],
      default: 'pending',
    },
    customerLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: {
        type: String,
        default: '',
      },
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Index for vendor fetching orders efficiently
OrderSchema.index({ vendorId: 1, date: 1, status: 1 });
// Index for customer fetching their orders
OrderSchema.index({ customerId: 1, date: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
