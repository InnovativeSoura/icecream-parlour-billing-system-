const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    availableStock: {
      type: Number,
      required: true,
      default: 0,
    },

    reorderLevel: {
      type: Number,
      default: 10,
    },

    supplierName: {
      type: String,
      default: "",
    },

    supplierContact: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Inventory", inventorySchema);