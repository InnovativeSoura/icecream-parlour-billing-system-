import express from "express";

import {
  getCategories,
  getActiveCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * Public
 */
router.get("/active", getActiveCategories);

/*
 * Admin / Staff
 */
router.get(
  "/",
  protect,
  authorize("admin", "staff"),
  getCategories
);

router.get(
  "/:id",
  protect,
  authorize("admin", "staff"),
  getCategoryById
);

/*
 * Admin only
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  createCategory
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateCategory
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteCategory
);

export default router;