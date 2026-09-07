import express from "express";

import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  activateCustomer,
  getCustomerStats,
  getCustomerByPhone,
} from "../controllers/customerController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * ============================================================
 * CUSTOMER STATISTICS
 * ============================================================
 *
 * IMPORTANT:
 * This route must appear before /:id.
 */
router.get(
  "/stats/summary",
  protect,
  authorize("admin", "staff"),
  getCustomerStats
);

/*
 * ============================================================
 * SEARCH CUSTOMER BY PHONE
 * ============================================================
 *
 * IMPORTANT:
 * This route must appear before /:id.
 */
router.get(
  "/phone/:phone",
  protect,
  authorize("admin", "staff"),
  getCustomerByPhone
);

/*
 * ============================================================
 * GET ALL CUSTOMERS
 * ============================================================
 */
router.get(
  "/",
  protect,
  authorize("admin", "staff"),
  getCustomers
);

/*
 * ============================================================
 * CREATE CUSTOMER
 * ============================================================
 *
 * Admin + Staff
 *
 * Staff needs this for walk-in customers during POS billing.
 */
router.post(
  "/",
  protect,
  authorize("admin", "staff"),
  createCustomer
);

/*
 * ============================================================
 * GET CUSTOMER BY ID
 * ============================================================
 */
router.get(
  "/:id",
  protect,
  authorize("admin", "staff"),
  getCustomerById
);

/*
 * ============================================================
 * UPDATE CUSTOMER
 * ============================================================
 */
router.put(
  "/:id",
  protect,
  authorize("admin", "staff"),
  updateCustomer
);

/*
 * ============================================================
 * DEACTIVATE CUSTOMER
 * ============================================================
 *
 * Admin only.
 *
 * This is soft deletion.
 */
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteCustomer
);

/*
 * ============================================================
 * ACTIVATE CUSTOMER
 * ============================================================
 */
router.patch(
  "/:id/activate",
  protect,
  authorize("admin"),
  activateCustomer
);

export default router;