import express from "express";

import {
  getInventory,
  getInventoryByProduct,
  adjustStock,
  getStockMovements,
} from "../controllers/inventoryController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * Admin / Staff
 */
router.get(
  "/",
  protect,
  authorize("admin", "staff"),
  getInventory
);

router.get(
  "/:productId",
  protect,
  authorize("admin", "staff"),
  getInventoryByProduct
);

router.get(
  "/:productId/movements",
  protect,
  authorize("admin", "staff"),
  getStockMovements
);

/*
 * Admin only
 */
router.post(
  "/:productId/adjust",
  protect,
  authorize("admin"),
  adjustStock
);

export default router;