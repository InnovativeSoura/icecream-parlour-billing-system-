import express from "express";

import {
  getMyOrders,
  createCustomerOrder,
  getOrderStats,
  getOrders,
  createOrder,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/orderController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CUSTOMER ROUTES
|--------------------------------------------------------------------------
*/

// Customer order history
router.get(
  "/my-orders",
  protect,
  authorize("customer"),
  getMyOrders
);

// Customer creates online order
router.post(
  "/customer",
  protect,
  authorize("customer"),
  createCustomerOrder
);


/*
|--------------------------------------------------------------------------
| ADMIN / STAFF ROUTES
|--------------------------------------------------------------------------
*/

// Order statistics
router.get(
  "/stats/summary",
  protect,
  authorize("admin", "staff"),
  getOrderStats
);

// All orders
router.get(
  "/",
  protect,
  authorize("admin", "staff"),
  getOrders
);

// Create POS order
router.post(
  "/",
  protect,
  authorize("admin", "staff"),
  createOrder
);


/*
|--------------------------------------------------------------------------
| SHARED ORDER ROUTES
|--------------------------------------------------------------------------
*/

// Get individual order
router.get(
  "/:id",
  protect,
  authorize("admin", "staff", "customer"),
  getOrderById
);

// Update order status
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "staff"),
  updateOrderStatus
);

// Cancel order
// Customer can cancel their own eligible order.
// Admin/staff can cancel orders according to business rules.
router.patch(
  "/:id/cancel",
  protect,
  authorize("admin", "staff", "customer"),
  cancelOrder
);

export default router;