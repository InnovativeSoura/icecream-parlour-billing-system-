const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createInvoice,
  getInvoices,
} = require("../controllers/billingController");

// Create Invoice
router.post(
  "/",
  auth,
  authorizeRoles("cashier", "admin"),
  createInvoice
);

// Get All Invoices
router.get(
  "/",
  auth,
  authorizeRoles(
    "admin",
    "cashier",
    "accountant"
  ),
  getInvoices
);
router.get(
  "/invoice/:id",
  auth,
  downloadInvoice
);

module.exports = router;