import express from "express";

import {
  createOrder,
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
 * CUSTOMER ORDERS
 * ============================================================
 *
 * GET /api/orders/my-orders
 *
 * Customer only
 *
 * IMPORTANT:
 * This route must appear before /:id.
 */
router.get(
  "/my-orders",
  protect,
  authorize("customer"),
  getMyOrders
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
  authorize("admin", "staff"),
  getOrderStats
);

/*
 * ============================================================
 * GET ALL ORDERS
 * ============================================================
 *
 * Admin + Staff
 */
router.get(
  "/",
  protect,
  authorize("admin", "staff"),
  getOrders
);

/*
 * ============================================================
 * CREATE ORDER
 * ============================================================
 *
 * Admin + Staff
 */
router.post(
  "/",
  protect,
  authorize("admin", "staff"),
  createOrder
);

/*
 * ============================================================
 * GET ORDER BY ID
 * ============================================================
 *
 * Admin + Staff
 */
router.get(
  "/:id",
  protect,
  authorize("admin", "staff"),
  getOrderById
);

/*
 * ============================================================
 * UPDATE ORDER STATUS
 * ============================================================
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
 */
router.patch(
  "/:id/cancel",
  protect,
  authorize("admin", "staff"),
  cancelOrder
);

export default router;