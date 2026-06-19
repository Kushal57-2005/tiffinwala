import mongoose, { Document, Schema } from 'mongoose';

export interface IConnection extends Document {
  customerId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  pendingDue: number;
}

const ConnectionSchema = new Schema<IConnection>(
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
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    pendingDue: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

ConnectionSchema.index({ customerId: 1, vendorId: 1 }, { unique: true });

export const Connection = mongoose.model<IConnection>(
  'Connection',
  ConnectionSchema,
);
