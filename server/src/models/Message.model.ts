import mongoose, { Schema } from 'mongoose';

export interface IMessage {
  customerId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  senderRole: 'customer' | 'vendor';
  text: string;
  isRead: boolean;
  isComplaint: boolean;
  complaintStatus: 'none' | 'raised' | 'acknowledged' | 'resolved';
  createdAt?: Date;
}

const MessageSchema = new Schema<IMessage>(
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
    senderRole: {
      type: String,
      enum: ['customer', 'vendor'],
    },
    text: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isComplaint: {
      type: Boolean,
      default: false,
    },
    complaintStatus: {
      type: String,
      enum: ['none', 'raised', 'acknowledged', 'resolved'],
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
