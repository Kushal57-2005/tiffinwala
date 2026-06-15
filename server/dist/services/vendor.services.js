"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendorProfileService = exports.getVendorProfileService = exports.getTodayMenuService = exports.createMenuService = exports.toggleVendorOpenService = void 0;
const MenuItem_model_1 = require("../models/MenuItem.model");
const User_model_1 = require("../models/User.model");
const Vendor_model_1 = require("../models/Vendor.model");
const api_error_1 = require("../utils/api-error");
const toggleVendorOpenService = async (userId) => {
    const vendor = await Vendor_model_1.Vendor.findOne({ userId });
    if (!vendor) {
        throw new api_error_1.ApiError(404, 'Vendor not found');
    }
    vendor.isOpen = !vendor.isOpen;
    await vendor.save();
    return {
        isOpen: vendor.isOpen,
        message: `Vendor is now ${vendor.isOpen ? 'OPEN' : 'CLOSED'}`,
    };
};
exports.toggleVendorOpenService = toggleVendorOpenService;
const createMenuService = async (userId, tiers, addOns, description, session) => {
    const vendor = await Vendor_model_1.Vendor.findOne({ userId });
    if (!vendor) {
        throw new api_error_1.ApiError(404, 'Vendor not found');
    }
    if (!tiers || tiers.length === 0) {
        throw new api_error_1.ApiError(400, 'At least one tier is required');
    }
    for (const tier of tiers) {
        if (!tier.items || tier.items.length === 0) {
            throw new api_error_1.ApiError(400, `Tier "${tier.name}" must have at least one item`);
        }
    }
    if (!session || !['lunch', 'dinner'].includes(session)) {
        throw new api_error_1.ApiError(400, 'session must be "lunch" or "dinner"');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await MenuItem_model_1.MenuItem.findOne({
        vendorId: vendor._id,
        session,
        date: today,
        isExpired: false,
    });
    await MenuItem_model_1.MenuItem.updateMany({
        vendorId: vendor._id,
        session,
        _id: { $ne: existing?._id },
        date: { $lt: today },
    }, { $set: { isExpired: true } });
    if (existing) {
        // Locked fields (name, price, items, maxQuantity, remainingQuantity)
        // for tiers that already exist — only NEW tiers get added as-is
        const existingNames = new Set(existing.tiers.map((t) => t.name));
        const newTiers = tiers
            .filter((t) => !existingNames.has(t.name))
            .map((t) => ({ ...t, remainingQuantity: t.maxQuantity }));
        existing.tiers = [...existing.tiers, ...newTiers];
        existing.addOns = addOns || [];
        existing.description = description;
        await existing.save();
        return existing;
    }
    const tiersWithRemaining = tiers.map((tier) => ({
        ...tier,
        remainingQuantity: tier.maxQuantity,
    }));
    const menuItem = await MenuItem_model_1.MenuItem.create({
        vendorId: vendor._id,
        session,
        tiers: tiersWithRemaining,
        addOns: addOns || [],
        description,
        date: today,
        isExpired: false,
    });
    return menuItem;
};
exports.createMenuService = createMenuService;
const getTodayMenuService = async (vendorId, session) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await MenuItem_model_1.MenuItem.findOne({
        vendorId,
        session,
        date: today,
        isExpired: false,
    });
};
exports.getTodayMenuService = getTodayMenuService;
const getVendorProfileService = async (userId) => {
    const vendor = await Vendor_model_1.Vendor.findOne({ userId }).populate('userId', 'firstName lastName email phone');
    if (!vendor) {
        throw new api_error_1.ApiError(404, 'Vendor not found.');
    }
    return vendor;
};
exports.getVendorProfileService = getVendorProfileService;
const updateVendorProfileService = async (userId, firstname, lastname, email, phone, businessName, deliveryRadiuskm, address, coordinates) => {
    // STEP 1 - build User update object
    const userUpdateData = {};
    if (firstname)
        userUpdateData.firstName = firstname;
    if (lastname)
        userUpdateData.lastName = lastname;
    if (email)
        userUpdateData.email = email;
    if (phone)
        userUpdateData.phone = phone;
    // STEP 2 - build Vendor update object (with dot notation for nested fields)
    const vendorUpdateData = {};
    if (businessName)
        vendorUpdateData.businessName = businessName;
    if (deliveryRadiuskm)
        vendorUpdateData.deliveryRadiuskm = deliveryRadiuskm;
    if (address)
        vendorUpdateData['location.address'] = address;
    if (coordinates)
        vendorUpdateData['location.coordinates'] = coordinates;
    // STEP 3 - update User (if any user fields provided)
    if (Object.keys(userUpdateData).length > 0) {
        const updatedUser = await User_model_1.User.findByIdAndUpdate(userId, { $set: userUpdateData }, { new: true, runValidators: true });
        if (!updatedUser) {
            throw new api_error_1.ApiError(404, 'User not found');
        }
    }
    // STEP 4 - update Vendor (if any vendor fields provided)
    let updatedVendor = await Vendor_model_1.Vendor.findOne({ userId }).populate('userId', 'firstName lastName email phone');
    if (!updatedVendor) {
        throw new api_error_1.ApiError(404, 'Vendor not found');
    }
    if (Object.keys(vendorUpdateData).length > 0) {
        updatedVendor = await Vendor_model_1.Vendor.findOneAndUpdate({ userId }, { $set: vendorUpdateData }, { new: true, runValidators: true }).populate('userId', 'firstName lastName email phone');
    }
    return updatedVendor;
};
exports.updateVendorProfileService = updateVendorProfileService;
//# sourceMappingURL=vendor.services.js.map