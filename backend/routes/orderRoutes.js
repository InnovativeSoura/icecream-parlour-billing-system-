import express from "express";

import {
  createOrder,
  getOrders,
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
 * ORDER STATISTICS
 * ============================================================
 *
 * Admin / Staff only
 *
 * Must appear before /:id.
 */
router.get(
  "/stats/summary",
  protect,
  authorize("admin", "staff"),
  getOrderStats
);

/*
 * ============================================================
 * GET ORDERS
 * ============================================================
 *
 * Admin / Staff:
 *   - Can view all orders
 *
 * Customer:
 *   - Can view only their own orders
 *
 * IMPORTANT:
 * The controller must filter customer results using req.user._id.
 */
router.get(
  "/",
  protect,
  authorize("admin", "staff", "customer"),
  getOrders
);

/*
 * ============================================================
 * CREATE ORDER
 * ============================================================
 *
 * Admin / Staff:
 *   - POS orders
 *
 * Customer:
 *   - Online orders
 *
 * IMPORTANT:
 * The controller must correctly assign the authenticated
 * customer to the order when req.user.role === "customer".
 */
router.post(
  "/",
  protect,
  authorize("admin", "staff", "customer"),
  createOrder
);

/*
 * ============================================================
 * GET ORDER BY ID
 * ============================================================
 *
 * Admin / Staff:
 *   - Can view any order
 *
 * Customer:
 *   - Can view only their own order
 *
 * IMPORTANT:
 * The controller must enforce ownership for customers.
 */
router.get(
  "/:id",
  protect,
  authorize("admin", "staff", "customer"),
  getOrderById
);

/*
 * ============================================================
 * UPDATE ORDER STATUS
 * ============================================================
 *
 * Admin / Staff only
 *
 * Customers must NOT be allowed to directly change
 * order status.
 */
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "staff"),
  updateOrderStatus
);

/*
 * ============================================================
 * CANCEL ORDER
 * ============================================================
 *
 * Admin / Staff:
 *   - Can cancel orders
 *
 * Customer:
 *   - Should only be able to cancel their own eligible order.
 *
 * The controller should enforce ownership and allowed
 * cancellation statuses for customers.
 */
router.patch(
  "/:id/cancel",
  protect,
  authorize("admin", "staff", "customer"),
  cancelOrder
);

export default router;