import {
    addFriendProfileService,
    editFriendProfileService,
    getCustomerProfileService,
    getFriendProfilesService,
    getNearbyVendorService,
    getVendorPublicDetailsService,
    removeFriendProfileService,
    updateCustomerLocationService,
    updateCustomerProfileService,
} from '../services/customer.services';
import { getTodayMenuService } from '../services/vendor.services';
import { Customer } from '../models/Customer.model';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../utils/api-error';
import { ApiResponse } from '../utils/api-response';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';

export const getNearbyVendors = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId as string;

        const result = await getNearbyVendorService(userId);

        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Nearby vendors fetched'));
    },
);

export const getCustomerProfile = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId as string;
        const result = await getCustomerProfileService(userId);
        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Customer profile fetched'));
    },
);

export const updateCustomerProfile = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId as string;
        const { firstname, lastname, email, phone, address, coordinates } =
            req.body;

        const result = await updateCustomerProfileService(
            userId,
            firstname,
            lastname,
            email,
            phone,
            address,
            coordinates,
        );

        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Customer profile updated'));
    },
);

export const updateCustomerLocation = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId as string;
        const { address, location, coordinates } = req.body;
        const locationCoordinates = location?.coordinates || coordinates;

        const result = await updateCustomerLocationService(
            userId,
            address,
            locationCoordinates,
        );

        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Customer location updated'));
    },
);

export const getVendorMenuForCustomer = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { vendorId } = req.params;
        const session =
            (req.query.session as string) === 'dinner' ? 'dinner' : 'lunch';

        const result = await getTodayMenuService(
            vendorId as string,
            session as 'lunch' | 'dinner',
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    result
                        ? 'Menu fetched successfully'
                        : 'No menu uploaded for today',
                ),
            );
    },
);

export const getVendorProfile = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId as string;

        const result = await getCustomerProfileService(userId);

        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Customers profile fetched'));
    },
);

export const getFriendProfiles = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId as string;
        const result = await getFriendProfilesService(userId);
        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Friend profiles fetched'));
    },
);

export const addFriendProfile = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId as string;
        const { name, phone, nickname } = req.body;

        if (!name?.trim()) {
            throw new ApiError(400, 'Friend name is required');
        }

        const result = await addFriendProfileService(
            userId,
            name,
            phone,
            nickname,
        );
        return res
            .status(201)
            .json(new ApiResponse(201, result, 'Friend profile added'));
    },
);

export const editFriendProfile = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId as string;
        const friendId = req.params.friendId as string;
        const { name, phone, nickname } = req.body;

        const result = await editFriendProfileService(
            userId,
            friendId,
            name,
            phone,
            nickname,
        );
        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Friend profile updated'));
    },
);

export const removeFriendProfile = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId as string;
        const friendId = req.params.friendId as string;
        const result = await removeFriendProfileService(userId, friendId);
        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Friend profile removed'));
    },
);

export const getVendorPublicDetails = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const vendorId = req.params.vendorId as string;

        const result = await getVendorPublicDetailsService(vendorId);

        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Vendor Details Fetched'));
    },
);
