import mongoose from 'mongoose';
import { Customer } from '../models/Customer.model';
import { Rating } from '../models/Rating.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';
import { User } from '../models/User.model';

export const rateVendorService = async (
  userId: string,
  vendorId: string,
  stars: number,
  review?: string,
) => {
  const user = await User.findById(userId);
  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  if (stars < 1 || stars > 5) {
    throw new ApiError(400, 'Stars must be between 1 and 5');
  }

  const existedRating = await Rating.findOne({
    customerId: customer._id,
    vendorId: vendor._id,
  });

  let rating;
  if (existedRating) {
    existedRating.stars = stars;
    existedRating.review = review;
    rating = await existedRating.save();
  } else {
    rating = await Rating.create({
      customerId: customer._id,
      vendorId: vendor._id,
      name: `${user?.firstName} ${user?.lastName}`,
      stars: stars,
      review: review,
    });
  }

  // Recalculate average rating & total ratings for this vendor
  const stats = await Rating.aggregate([
    { $match: { vendorId: vendor._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$stars' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    vendor.averageRating = parseFloat(stats[0].averageRating.toFixed(1));
    vendor.totalRatings = stats[0].totalRatings;
  } else {
    vendor.averageRating = 0;
    vendor.totalRatings = 0;
  }
  await vendor.save();

  return rating;
};

export const getAllRatingService = async (vendorId: string) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  const result = await Rating.aggregate([
    {
      $match: {
        vendorId: new mongoose.Types.ObjectId(vendorId),
      },
    },
    {
      $group: {
        _id: null,
        avgStar: { $avg: '$stars' },
        totalRatings: { $sum: 1 },
        ratings: { $push: '$$ROOT' },
      },
    },
  ]);

  return {
    result,
  };
};
