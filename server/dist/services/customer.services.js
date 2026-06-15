"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchVendorsService = exports.getNearbyVendorService = void 0;
const Customer_model_1 = require("../models/Customer.model");
const Vendor_model_1 = require("../models/Vendor.model");
const api_error_1 = require("../utils/api-error");
const getNearbyVendorService = async (userId) => {
    const customer = await Customer_model_1.Customer.findOne({ userId });
    if (!customer) {
        throw new api_error_1.ApiError(404, 'Customer not found');
    }
    const [lng, lat] = customer.location.coordinates;
    if (lng === 0 && lat === 0) {
        throw new api_error_1.ApiError(400, 'Please set your location first');
    }
    const vendors = await Vendor_model_1.Vendor.aggregate([
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
exports.getNearbyVendorService = getNearbyVendorService;
const searchVendorsService = async (query) => {
    if (!query || query.trim().length === 0) {
        throw new api_error_1.ApiError(400, 'Search query is required');
    }
    const vendors = await Vendor_model_1.Vendor.find({
        $or: [
            { businessName: { $regex: query, $options: 'i' } },
            { 'location.address': { $regex: query, $options: 'i' } },
        ],
    }).populate('userId', 'firstName lastName phone');
    return vendors;
};
exports.searchVendorsService = searchVendorsService;
//# sourceMappingURL=customer.services.js.map