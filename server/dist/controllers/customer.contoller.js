"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVendorMenuForCustomer = exports.getCustomerProfile = exports.getNearbyVendors = void 0;
const customer_services_1 = require("../services/customer.services");
const vendor_services_1 = require("../services/vendor.services");
const Customer_model_1 = require("../models/Customer.model");
const async_handler_1 = require("../utils/async-handler");
const api_error_1 = require("../utils/api-error");
const api_response_1 = require("../utils/api-response");
exports.getNearbyVendors = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const result = await (0, customer_services_1.getNearbyVendorService)(userId);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'Nearby vendors fetched'));
});
exports.getCustomerProfile = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const customer = await Customer_model_1.Customer.findOne({ userId }).populate('userId', 'firstName lastName email phone');
    if (!customer) {
        throw new api_error_1.ApiError(404, 'Customer not found');
    }
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, customer, 'Customer profile fetched'));
});
exports.getVendorMenuForCustomer = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { vendorId } = req.params;
    const session = req.query.session === 'dinner' ? 'dinner' : 'lunch';
    const result = await (0, vendor_services_1.getTodayMenuService)(vendorId, session);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, result
        ? 'Menu fetched successfully'
        : 'No menu uploaded for today'));
});
//# sourceMappingURL=customer.contoller.js.map