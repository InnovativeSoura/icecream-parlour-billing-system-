import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
      unique: true,
    },

    currentStock: {
      type: Number,
      default: 0,
      min: [0, "Current stock cannot be negative"],
    },

    reservedStock: {
      type: Number,
      default: 0,
      min: [0, "Reserved stock cannot be negative"],
    },

    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, "Low stock threshold cannot be negative"],
    },

    unit: {
      type: String,
      enum: [
        "piece",
        "scoop",
        "cup",
        "cone",
        "pack",
        "ml",
        "gram",
        "kg",
      ],
      default: "piece",
    },

    lastRestockedAt: {
      type: Date,
      default: null,
    },

    lastStockUpdateAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

inventorySchema.virtual("availableStock").get(
  function () {
    return Math.max(
      0,
      this.currentStock - this.reservedStock
    );
  }
);

inventorySchema.virtual("isLowStock").get(
  function () {
    return (
      this.currentStock <=
      this.lowStockThreshold
    );
  }
);

inventorySchema.set(
  "toJSON",
  {
    virtuals: true,
  }
);

inventorySchema.set(
  "toObject",
  {
    virtuals: true,
  }
);

const Inventory = mongoose.model(
  "Inventory",
  inventorySchema
);

export default Inventory;