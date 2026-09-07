import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: [0.01, "Quantity must be greater than zero"],
    },

    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Unit price cannot be negative"],
    },

    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: true,
  }
);

const orderSchema = new mongoose.Schema(
  {
    /*
     * Human-readable unique order number.
     *
     * Example:
     * ORD-20260907-00001
     */
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    /*
     * Optional customer.
     *
     * Walk-in bills can have no customer record.
     */
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    /*
     * Snapshot of customer information.
     *
     * This preserves historical billing information even if
     * the customer later changes their profile.
     */
    customerSnapshot: {
      name: {
        type: String,
        trim: true,
        default: "",
      },

      phone: {
        type: String,
        trim: true,
        default: "",
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },

      address: {
        type: String,
        trim: true,
        default: "",
      },
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one item",
      },
    },

    /*
     * Monetary breakdown.
     */
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    taxAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    /*
     * Payment information is intentionally kept separate.
     * Razorpay integration will populate these later.
     */
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "upi",
        "card",
        "razorpay",
        "other",
        "unpaid",
      ],
      default: "unpaid",
    },

    /*
     * These fields will be populated by the payment module.
     */
    paymentId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    paymentOrderId: {
      type: String,
      trim: true,
      default: "",
    },

    paymentSignature: {
      type: String,
      trim: true,
      default: "",
    },

    /*
     * Order lifecycle.
     */
    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "confirmed",
        "processing",
        "completed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    orderType: {
      type: String,
      enum: [
        "pos",
        "online",
      ],
      default: "pos",
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Notes cannot exceed 1000 characters",
      ],
      default: "",
    },

    /*
     * Staff/admin who created the order.
     */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * Useful timestamps for reporting.
     */
    paidAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Reporting indexes.
 */
orderSchema.index({
  createdAt: -1,
});

orderSchema.index({
  customer: 1,
  createdAt: -1,
});

orderSchema.index({
  paymentStatus: 1,
  createdAt: -1,
});

orderSchema.index({
  status: 1,
  createdAt: -1,
});

/*
 * Round monetary values before validation/save.
 */
orderSchema.pre("validate", function (next) {
  const moneyFields = [
    "subtotal",
    "discountAmount",
    "taxAmount",
    "totalAmount",
  ];

  moneyFields.forEach((field) => {
    if (typeof this[field] === "number") {
      this[field] =
        Math.round(this[field] * 100) / 100;
    }
  });

  this.items.forEach((item) => {
    if (typeof item.unitPrice === "number") {
      item.unitPrice =
        Math.round(item.unitPrice * 100) / 100;
    }

    if (typeof item.taxAmount === "number") {
      item.taxAmount =
        Math.round(item.taxAmount * 100) / 100;
    }

    if (typeof item.discountAmount === "number") {
      item.discountAmount =
        Math.round(item.discountAmount * 100) / 100;
    }

    if (typeof item.subtotal === "number") {
      item.subtotal =
        Math.round(item.subtotal * 100) / 100;
    }

    if (typeof item.total === "number") {
      item.total =
        Math.round(item.total * 100) / 100;
    }
  });

  next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;