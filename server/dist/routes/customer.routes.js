"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const customer_contoller_1 = require("../controllers/customer.contoller");
const vendor_contoller_1 = require("../controllers/vendor.contoller");
const router = (0, express_1.Router)();
router.get('/profile', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('customer'), customer_contoller_1.getCustomerProfile);
router.get('/vendors/nearby', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('customer'), customer_contoller_1.getNearbyVendors);
router.get('/vendors/search', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('customer'), vendor_contoller_1.searchVendors);
router.get('/vendors/:vendorId/menu', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('customer'), customer_contoller_1.getVendorMenuForCustomer);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map