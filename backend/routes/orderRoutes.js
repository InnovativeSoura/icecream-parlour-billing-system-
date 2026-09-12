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

const router = express.Router();

/*
 * ============================================================
 * CUSTOMER ROUTES
 * ============================================================
 */

/*
 * Get logged-in customer's orders
 * GET /api/orders/my-orders
 */
router.get(
  "/my-orders",
  protect,
  authorize("customer"),
  getMyOrders
);

/*
 * Create online order from customer portal
 * POST /api/orders/customer
 */
router.post(
  "/customer",
  protect,
  authorize("customer"),
  createCustomerOrder
);


/*
 * ============================================================
 * ADMIN / STAFF ROUTES
 * ============================================================
 */

/*
 * Order statistics
 * GET /api/orders/stats/summary
 */
router.get(
  "/stats/summary",
  protect,
  authorize("admin", "staff"),
  getOrderStats
);

/*
 * Get all orders
 * GET /api/orders
 */
router.get(
  "/",
  protect,
  authorize("admin", "staff"),
  getOrders
);

/*
 * Create POS order
 * POST /api/orders
 */
router.post(
  "/",
  protect,
  authorize("admin", "staff"),
  createOrder
);


/*
 * ============================================================
 * INDIVIDUAL ORDER ROUTES
 * ============================================================
 */

/*
 * Get a specific order
 * GET /api/orders/:id
 */
router.get(
  "/:id",
  protect,
  authorize("admin", "staff", "customer"),
  getOrderById
);

/*
 * Update order status
 * PATCH /api/orders/:id/status
 *
 * Admin + Staff only
 */
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "staff"),
  updateOrderStatus
);

/*
 * Cancel order
 * PATCH /api/orders/:id/cancel
 *
 * Admin + Staff + Customer
 *
 * Customer ownership is checked inside cancelOrder().
 */
router.patch(
  "/:id/cancel",
  protect,
  authorize("admin", "staff", "customer"),
  cancelOrder
);

export default router;