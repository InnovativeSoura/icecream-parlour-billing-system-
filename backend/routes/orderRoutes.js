import express from "express";

import {
  createOrder,
  createCustomerOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
} from "../controllers/orderController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router =
  express.Router();

/*
 * ============================================================
 * CUSTOMER ORDERS
 * ============================================================
 */

/*
 * GET /api/orders/my-orders
 *
 * Customer only.
 *
 * Returns only the authenticated customer's orders.
 */

router.get(
  "/my-orders",
  protect,
  authorize("customer"),
  getMyOrders
);

/*
 * ============================================================
 * CUSTOMER CHECKOUT
 * ============================================================
 *
 * POST /api/orders/customer
 *
 * Customer only.
 *
 * This is the endpoint used by MyCart.jsx.
 *
 * IMPORTANT:
 *
 * The frontend does NOT provide:
 *
 * - customer ID
 * - price
 * - subtotal
 * - tax
 * - total
 *
 * The backend calculates everything from MongoDB.
 */

router.post(
  "/customer",
  protect,
  authorize("customer"),
  createCustomerOrder
);

/*
 * ============================================================
 * ORDER STATISTICS
 * ============================================================
 *
 * GET /api/orders/stats/summary
 *
 * Admin + Staff
 */

router.get(
  "/stats/summary",
  protect,
  authorize(
    "admin",
    "staff"
  ),
  getOrderStats
);

/*
 * ============================================================
 * GET ALL ORDERS
 * ============================================================
 *
 * GET /api/orders
 *
 * Admin + Staff only.
 */

router.get(
  "/",
  protect,
  authorize(
    "admin",
    "staff"
  ),
  getOrders
);

/*
 * ============================================================
 * CREATE POS ORDER
 * ============================================================
 *
 * POST /api/orders
 *
 * Admin + Staff only.
 *
 * Customer checkout uses:
 *
 * POST /api/orders/customer
 */

router.post(
  "/",
  protect,
  authorize(
    "admin",
    "staff"
  ),
  createOrder
);

/*
 * ============================================================
 * GET ORDER BY ID
 * ============================================================
 *
 * GET /api/orders/:id
 *
 * Admin + Staff + Customer.
 *
 * Customer ownership is checked inside controller.
 */

router.get(
  "/:id",
  protect,
  authorize(
    "admin",
    "staff",
    "customer"
  ),
  getOrderById
);

/*
 * ============================================================
 * UPDATE ORDER STATUS
 * ============================================================
 *
 * PATCH /api/orders/:id/status
 *
 * Admin + Staff only.
 */

router.patch(
  "/:id/status",
  protect,
  authorize(
    "admin",
    "staff"
  ),
  updateOrderStatus
);

/*
 * ============================================================
 * CANCEL ORDER
 * ============================================================
 *
 * PATCH /api/orders/:id/cancel
 *
 * Admin + Staff only.
 */

router.patch(
  "/:id/cancel",
  protect,
  authorize("admin", "staff", "customer"),
  cancelOrder
);

export default router;