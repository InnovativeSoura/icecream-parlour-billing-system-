const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// Get All Products
router.get("/", auth, getProducts);

// Add Product (Admin Only)
router.post(
  "/",
  auth,
  authorizeRoles("admin"),
  addProduct
);

// Update Product (Admin Only)
router.put(
  "/:id",
  auth,
  authorizeRoles("admin"),
  updateProduct
);

// Delete Product (Admin Only)
router.delete(
  "/:id",
  auth,
  authorizeRoles("admin"),
  deleteProduct
);

module.exports = router;