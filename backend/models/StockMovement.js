import mongoose from "mongoose";

const stockMovementSchema =
  new mongoose.Schema(
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
      },

      inventory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
        required: true,
      },

      type: {
        type: String,
        enum: [
          "purchase",
          "sale",
          "restock",
          "adjustment",
          "damage",
          "return",
        ],
        required: true,
      },

      quantity: {
        type: Number,
        required: true,
        min: [
          0.01,
          "Quantity must be greater than zero",
        ],
      },

      previousStock: {
        type: Number,
        required: true,
        min: 0,
      },

      newStock: {
        type: Number,
        required: true,
        min: 0,
      },

      referenceType: {
        type: String,
        enum: [
          "order",
          "purchase",
          "manual",
          "return",
          "damage",
        ],
        default: "manual",
      },

      referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      reason: {
        type: String,
        trim: true,
        maxlength: [
          500,
          "Reason cannot exceed 500 characters",
        ],
        default: "",
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

stockMovementSchema.index({
  product: 1,
  createdAt: -1,
});

const StockMovement =
  mongoose.model(
    "StockMovement",
    stockMovementSchema
  );

export default StockMovement;