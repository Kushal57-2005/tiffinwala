import { Customer } from '../models/Customer.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';

export const getNearbyVendorService = async (userId: string) => {
    const customer = await Customer.findOne({ userId });
    if (!customer) {
        throw new ApiError(404, 'Customer not found');
    }

    const [lng, lat] = customer.location.coordinates;

    if (lng === 0 && lat === 0) {
        throw new ApiError(400, 'Please set your location first');
    }

    const vendors = await Vendor.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [lng, lat] },
                distanceField: 'distanceInMeters',
                spherical: true,
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userInfo',
            },
        },
        {
            $unwind: '$userInfo',
        },
        {
            $project: {
                businessName: 1,
                isOpen: 1,
                averageRating: 1,
                totalRating: 1,
                deliveryRadiuskm: 1,
                location: 1,
                distanceInMeters: 1,
                'userInfo.firstName': 1,
                'userInfo.lastName': 1,
                'userInfo.phone': 1,
            },
        },
    ]);

    const nearbyVendors = vendors.filter((vendor) => {
        const distanceInKm = vendor.distanceInMeters / 1000;
        return distanceInKm <= vendor.deliveryRadiuskm;
    });

    return nearbyVendors;
};

export const searchVendorsService = async (query: string) => {
    if (!query || query.trim().length === 0) {
        throw new ApiError(400, 'Search query is required');
    }

    const vendors = await Vendor.find({
        $or: [
            { businessName: { $regex: query, $options: 'i' } },
            { 'location.address': { $regex: query, $options: 'i' } },
        ],
    }).populate('userId', 'firstName lastName phone');

    return vendors;
};
