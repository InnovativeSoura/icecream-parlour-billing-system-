const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  getSalesReport,
  getProfitReport,
} = require("../controllers/reportController");

// Sales Report
router.get(
  "/sales",
  auth,
  authorizeRoles(
    "admin",
    "accountant"
  ),
  getSalesReport
);

// Profit Report
router.get(
  "/profit",
  auth,
  authorizeRoles(
    "admin",
    "accountant"
  ),
  getProfitReport
);

module.exports = router;