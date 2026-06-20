import mongoose, { Document, Schema } from 'mongoose';

export interface IRating extends Document {
  customerId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  name: string;
  stars: number;
  review?: string;
}

const RatingSchema = new Schema<IRating>(
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
    name:{
        type:String,
        default:'Anonymous'
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

RatingSchema.index({ customerId: 1, vendorId: 1 }, { unique: true });

export const Rating = mongoose.model<IRating>('Rating', RatingSchema);
