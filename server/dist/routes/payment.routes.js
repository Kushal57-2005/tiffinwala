"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controllers_1 = require("../controllers/payment.controllers");
const router = (0, express_1.Router)();
router.post('/create-order', payment_controllers_1.createVendorPaymentOrder);
router.post('/verify', payment_controllers_1.verifyVendorPayment);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map