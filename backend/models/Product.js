import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must contain at least 2 characters"],
      maxlength: [150, "Product name cannot exceed 150 characters"],
    },

    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },

    price: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Price cannot be negative"],
    },

    costPrice: {
      type: Number,
      default: 0,
      min: [0, "Cost price cannot be negative"],
    },

    taxRate: {
      type: Number,
      default: 5,
      min: [0, "Tax rate cannot be negative"],
      max: [100, "Tax rate cannot exceed 100%"],
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

    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, "Low stock threshold cannot be negative"],
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({
  name: 1,
});

productSchema.index({
  category: 1,
});

const Product = mongoose.model(
  "Product",
  productSchema
);

export default Product;