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
 * GET ALL ORDERS
 * ============================================================
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
 * Staff + Admin
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