import { Customer } from '../models/Customer.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';
import { getTodayUTC } from '../utils/getTodayUTC';
import { getCurrentSession } from '../utils/session';

export const getNearbyVendorService = async (userId: string) => {
    const customer = await Customer.findOne({ userId });
    if (!customer) {
        throw new ApiError(404, 'Customer not found');
    }

    const [lng = 0, lat = 0] = customer.location.coordinates || [];

    if (lng === 0 && lat === 0) {
        throw new ApiError(400, 'Please set your location first');
    }

    const today = getTodayUTC();
    const session = getCurrentSession();

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
        // Join today's menu for the current session
        {
            $lookup: {
                from: 'menuitems',
                let: { vendorId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$vendorId', '$$vendorId'] },
                            session,
                            date: today,
                            isExpired: false,
                        },
                    },
                    { $limit: 1 },
                ],
                as: 'todayMenu',
            },
        },
        {
            $addFields: {
                tiers: {
                    $ifNull: [{ $arrayElemAt: ['$todayMenu.tiers', 0] }, []],
                },
                addOns: {
                    $ifNull: [{ $arrayElemAt: ['$todayMenu.addOns', 0] }, []],
                },
                description: {
                    $ifNull: [
                        { $arrayElemAt: ['$todayMenu.description', 0] },
                        '',
                    ],
                },
            },
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
                tiers: 1,
                addOns: 1,
                description: 1,
            },
        },
    ]);

    const nearbyVendors = vendors.filter((vendor) => {
        const distanceInKm = vendor.distanceInMeters / 1000;
        return distanceInKm <= vendor.deliveryRadiuskm;
    });

    return nearbyVendors;
};

export const updateCustomerLocationService = async (
    userId: string,
    address: string | undefined,
    coordinates: [number, number],
) => {
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        throw new ApiError(400, 'Valid coordinates are required');
    }

    const [lat, lng] = coordinates.map(Number);
    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        (lat === 0 && lng === 0)
    ) {
        throw new ApiError(400, 'Please choose a valid location');
    }

    const updateData: Record<string, any> = {
        'location.type': 'Point',
        'location.coordinates': [lng, lat],
    };

    if (address && address.trim()) {
        updateData['location.address'] = address.trim();
    }

    const customer = await Customer.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, runValidators: true },
    ).populate('userId', 'firstName lastName email phone');

    if (!customer) {
        throw new ApiError(404, 'Customer not found');
    }

    return customer;
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

export const getCustomerProfileService = async (userId: string) => {
    const customer = await Customer.findOne({ userId }).populate(
        'userId',
        'firstName lastName email phone',
    );
    if (!customer) {
        throw new ApiError(404, 'Customer not found');
    }

    return customer;
};

export const updateCustomerProfileService = async (
    userId: string,
    firstname?: string,
    lastname?: string,
    email?: string,
    phone?: string,
    address?: string,
    coordinates?: [number, number],
) => {
    // Build User update payload
    const userUpdateData: Record<string, any> = {};
    if (firstname) userUpdateData.firstName = firstname;
    if (lastname) userUpdateData.lastName = lastname;
    if (email) userUpdateData.email = email;
    if (phone) userUpdateData.phone = phone;

    if (Object.keys(userUpdateData).length > 0) {
        const updatedUser = await (
            await import('../models/User.model')
        ).User.findByIdAndUpdate(
            userId,
            { $set: userUpdateData },
            { new: true, runValidators: true },
        );
        if (!updatedUser) throw new ApiError(404, 'User not found');
    }

    // Build Customer update payload
    const customerUpdateData: Record<string, any> = {};
    if (address && address.trim()) {
        customerUpdateData['location.address'] = address.trim();
    }
    if (
        Array.isArray(coordinates) &&
        coordinates.length === 2 &&
        !(coordinates[0] === 0 && coordinates[1] === 0)
    ) {
        customerUpdateData['location.type'] = 'Point';
        // coordinates expected as [lng, lat] (GeoJSON order)
        customerUpdateData['location.coordinates'] = coordinates;
    }

    const customer = await Customer.findOneAndUpdate(
        { userId },
        { $set: customerUpdateData },
        { new: true, runValidators: true },
    ).populate('userId', 'firstName lastName email phone');

    if (!customer) throw new ApiError(404, 'Customer not found');

    return customer;
};
