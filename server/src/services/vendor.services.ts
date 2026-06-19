import mongoose from 'mongoose';
import { IAddOn, ITier, MenuItem } from '../models/MenuItem.model';
import { User } from '../models/User.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';
import { getTodayUTC } from '../utils/getTodayUTC';
import { getCurrentSession } from '../utils/session';

export const toggleVendorOpenService = async (userId: string) => {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
        throw new ApiError(404, 'Vendor not found');
    }

    vendor.isOpen = !vendor.isOpen;
    await vendor.save();

    return {
        isOpen: vendor.isOpen,
        message: `Vendor is now ${vendor.isOpen ? 'OPEN' : 'CLOSED'}`,
    };
};

export const createMenuService = async (
    userId: string,
    tiers: ITier[],
    addOns: IAddOn[],
    description: string,
    session: 'lunch' | 'dinner',
) => {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
        throw new ApiError(404, 'Vendor not found');
    }

    if (!tiers || tiers.length === 0) {
        throw new ApiError(400, 'At least one tier is required');
    }

    for (const tier of tiers) {
        if (!tier.items || tier.items.length === 0) {
            throw new ApiError(
                400,
                `Tier "${tier.name}" must have at least one item`,
            );
        }
    }

    if (!session || !['lunch', 'dinner'].includes(session)) {
        throw new ApiError(400, 'session must be "lunch" or "dinner"');
    }

    const today = getTodayUTC();

    const existing = await MenuItem.findOne({
        vendorId: vendor._id,
        session,
        date: today,
        isExpired: false,
    });

    await MenuItem.updateMany(
        {
            vendorId: vendor._id,
            session,
            _id: { $ne: existing?._id },
            date: { $lt: today },
        },
        { $set: { isExpired: true } },
    );

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

    const menuItem = await MenuItem.create({
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

export const getTodayMenuService = async (
    vendorId: string,
    session: 'lunch' | 'dinner',
) => {
    const today = getTodayUTC();

    const result = await MenuItem.findOne({
        vendorId,
        session,
        date: today,
        isExpired: false,
    });
    return result;
};

export const getVendorProfileService = async (userId: string) => {
    const vendor = await Vendor.findOne({ userId }).populate(
        'userId',
        'firstName lastName email phone',
    );

    if (!vendor) {
        throw new ApiError(404, 'Vendor not found.');
    }

    return vendor;
};

export const updateVendorProfileService = async (
    userId: string,
    firstname?: string,
    lastname?: string,
    email?: string,
    phone?: string,
    businessName?: string,
    deliveryRadiuskm?: number,
    address?: string,
    coordinates?: [number, number],
) => {
    // STEP 1 - build User update object
    const userUpdateData: Record<string, any> = {};
    if (firstname) userUpdateData.firstName = firstname;
    if (lastname) userUpdateData.lastName = lastname;
    if (email) userUpdateData.email = email;
    if (phone) userUpdateData.phone = phone;

    // STEP 2 - build Vendor update object (with dot notation for nested fields)
    const vendorUpdateData: Record<string, any> = {};
    if (businessName) vendorUpdateData.businessName = businessName;
    if (deliveryRadiuskm) vendorUpdateData.deliveryRadiuskm = deliveryRadiuskm;
    if (address) vendorUpdateData['location.address'] = address;
    if (coordinates) vendorUpdateData['location.coordinates'] = coordinates;

    // STEP 3 - update User (if any user fields provided)
    if (Object.keys(userUpdateData).length > 0) {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: userUpdateData },
            { new: true, runValidators: true },
        );

        if (!updatedUser) {
            throw new ApiError(404, 'User not found');
        }
    }

    // STEP 4 - update Vendor (if any vendor fields provided)
    let updatedVendor = await Vendor.findOne({ userId }).populate(
        'userId',
        'firstName lastName email phone',
    );

    if (!updatedVendor) {
        throw new ApiError(404, 'Vendor not found');
    }

    if (Object.keys(vendorUpdateData).length > 0) {
        updatedVendor = await Vendor.findOneAndUpdate(
            { userId },
            { $set: vendorUpdateData },
            { new: true, runValidators: true },
        ).populate('userId', 'firstName lastName email phone');
    }

    return updatedVendor;
};

