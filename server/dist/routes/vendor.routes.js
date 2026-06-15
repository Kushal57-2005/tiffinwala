"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vendor_contoller_1 = require("../controllers/vendor.contoller");
const role_middleware_1 = require("../middlewares/role.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/menu/create-menu', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('vendor'), vendor_contoller_1.createMenu);
router.get('/menu/today', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('vendor'), vendor_contoller_1.getTodaysMenu);
router.put('/toggle', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('vendor'), vendor_contoller_1.toggleVendorOpen);
router
    .route('/profile')
    .get(auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('vendor'), vendor_contoller_1.getVendorProfile)
    .put(auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('vendor'), vendor_contoller_1.updateVendorProfile);
exports.default = router;
//# sourceMappingURL=vendor.routes.js.map