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
| This route is mounted with express.raw() in server.js.
| Do NOT add express.json() here.
|
|--------------------------------------------------------------------------
*/

router.post(
  "/webhook",
  razorpayWebhook
);

/*
|--------------------------------------------------------------------------
| Razorpay
|--------------------------------------------------------------------------
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
| Cash / UPI / Card / Other
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

router.get(
  "/",
  protect,
  authorize(
    "admin",
    "staff"
  ),
  getPayments
);

export default router;