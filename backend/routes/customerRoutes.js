const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  addCustomer,
  getCustomers,
  searchCustomer,
} = require("../controllers/customerController");

// Add Customer
router.post("/", auth, addCustomer);

// Get All Customers
router.get("/", auth, getCustomers);

// Search Customer
router.get("/search", auth, searchCustomer);

module.exports = router;