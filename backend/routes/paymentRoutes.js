import express from "express";

import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  recordManualPayment,
  getPaymentByOrder,
  getPayments,
  razorpayWebhook,
} from "../controllers/paymentController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Razorpay Webhook
|--------------------------------------------------------------------------
|
| IMPORTANT:
| server.js registers this endpoint with express.raw()
| BEFORE express.json().
|
| Do NOT add express.json() to this route.
|
|--------------------------------------------------------------------------
*/

router.post(
  "/webhook",
  razorpayWebhook
);

/*
|--------------------------------------------------------------------------
| Razorpay Customer / Online Payment
|--------------------------------------------------------------------------
*/

/*
 * Create a Razorpay order
 *
 * POST:
 * /api/payments/razorpay/create-order
 *
 * Allowed:
 * - admin
 * - staff
 * - customer
 */
router.post(
  "/razorpay/create-order",
  protect,
  authorize(
    "admin",
    "staff",
    "customer"
  ),
  createRazorpayOrder
);

/*
 * Verify Razorpay payment
 *
 * POST:
 * /api/payments/razorpay/verify
 *
 * Allowed:
 * - admin
 * - staff
 * - customer
 */
router.post(
  "/razorpay/verify",
  protect,
  authorize(
    "admin",
    "staff",
    "customer"
  ),
  verifyRazorpayPayment
);

/*
|--------------------------------------------------------------------------
| Manual POS Payments
|--------------------------------------------------------------------------
|
| Payment methods:
| - cash
| - UPI
| - card
| - other
|
| Only admin and staff can record manual POS payments.
|
|--------------------------------------------------------------------------
*/

router.post(
  "/manual",
  protect,
  authorize(
    "admin",
    "staff"
  ),
  recordManualPayment
);

/*
|--------------------------------------------------------------------------
| Payment Queries
|--------------------------------------------------------------------------
*/

/*
 * Get payment associated with a specific order
 *
 * GET:
 * /api/payments/order/:orderId
 *
 * Allowed:
 * - admin
 * - staff
 * - customer
 *
 * Customer ownership must additionally be checked
 * inside the controller.
 */
router.get(
  "/order/:orderId",
  protect,
  authorize(
    "admin",
    "staff",
    "customer"
  ),
  getPaymentByOrder
);

/*
 * Get all payments
 *
 * GET:
 * /api/payments
 *
 * Only admin and staff.
 */
router.get(
  "/",
  protect,
  authorize(
    "admin",
    "staff"
  ),
  getPayments
);

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default router;