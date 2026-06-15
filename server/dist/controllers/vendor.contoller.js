"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchVendors = exports.updateVendorProfile = exports.getVendorProfile = exports.getTodaysMenu = exports.createMenu = exports.toggleVendorOpen = void 0;
const vendor_services_1 = require("../services/vendor.services");
const async_handler_1 = require("../utils/async-handler");
const api_error_1 = require("../utils/api-error");
const api_response_1 = require("../utils/api-response");
const Vendor_model_1 = require("../models/Vendor.model");
const customer_services_1 = require("../services/customer.services");
exports.toggleVendorOpen = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const result = await (0, vendor_services_1.toggleVendorOpenService)(userId);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, `vendor is currently ${result.isOpen ? 'OPEN' : 'CLOSED'}`));
});
exports.createMenu = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { tiers, addOns, description, session } = req.body;
    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
        throw new api_error_1.ApiError(400, 'At least one tier is required');
    }
    if (!session || !['lunch', 'dinner'].includes(session)) {
        throw new api_error_1.ApiError(400, 'session must be "lunch" or "dinner"');
    }
    const userId = req.user?.userId;
    const result = await (0, vendor_services_1.createMenuService)(userId, tiers, addOns, description, session);
    return res
        .status(201)
        .json(new api_response_1.ApiResponse(201, result, `Menu created for ${result.session}`));
});
exports.getTodaysMenu = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const session = req.query.session;
    if (!session || !['lunch', 'dinner'].includes(session)) {
        throw new api_error_1.ApiError(400, 'session query param must be "lunch" or "dinner"');
    }
    const vendor = await Vendor_model_1.Vendor.findOne({ userId });
    if (!vendor) {
        throw new api_error_1.ApiError(404, 'Vendor not found');
    }
    const result = await (0, vendor_services_1.getTodayMenuService)(vendor._id.toString(), session);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, result
        ? 'Menu fetched successfully'
        : 'No menu uploaded for this session yet'));
});
exports.getVendorProfile = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const result = await (0, vendor_services_1.getVendorProfileService)(userId);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'Vendor profile fetched'));
});
exports.updateVendorProfile = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { firstname, lastname, email, phone, businessName, deliveryRadiuskm, address, coordinates, } = req.body;
    const result = await (0, vendor_services_1.updateVendorProfileService)(userId, firstname, lastname, email, phone, businessName, deliveryRadiuskm, address, coordinates);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'Vendor profile updated'));
});
exports.searchVendors = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query.q;
    const result = await (0, customer_services_1.searchVendorsService)(query);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'Search results fetched'));
});
//# sourceMappingURL=vendor.contoller.js.map