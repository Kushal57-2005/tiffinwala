import { getNearbyVendorService } from '../services/customer.services';
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
        const customer = await Customer.findOne({ userId }).populate(
            'userId',
            'firstName lastName email phone',
        );
        if (!customer) {
            throw new ApiError(404, 'Customer not found');
        }
        return res
            .status(200)
            .json(new ApiResponse(200, customer, 'Customer profile fetched'));
    },
);

export const getVendorMenuForCustomer = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { vendorId } = req.params;
        const session =
            (req.query.session as string) === 'dinner' ? 'dinner' : 'lunch';

        const result = await getTodayMenuService(vendorId as string, session as 'lunch' | 'dinner');

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

