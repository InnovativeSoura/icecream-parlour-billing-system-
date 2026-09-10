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
 * ORDER STATISTICS
 * ============================================================
 *
 * Admin + Staff
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
 * CUSTOMER — MY ORDERS
 * ============================================================
 *
 * GET /api/orders/my-orders
 *
 * Customer only
 */
router.get(
  "/my-orders",
  protect,
  authorize("customer"),
  getMyOrders
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
 *
 * Used by POS.
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
 *
 * Admin + Staff
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
 * Admin + Staff
 */
router.patch(
  "/:id/cancel",
  protect,
  authorize("admin", "staff"),
  cancelOrder
);

export default router;