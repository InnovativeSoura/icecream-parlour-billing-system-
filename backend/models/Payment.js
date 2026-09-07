import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // Related order
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
      index: true,
    },

    // User who initiated the payment
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Customer associated with the order
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    // Payment gateway / method
    gateway: {
      type: String,
      enum: [
        "razorpay",
        "cash",
        "upi",
        "card",
        "other",
      ],
      required: [true, "Payment gateway is required"],
      index: true,
    },

    // Amount in INR
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Payment amount cannot be negative"],
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
      maxlength: 3,
    },

    // Internal payment lifecycle
    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "paid",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      default: "created",
      index: true,
    },

    // Razorpay Order ID
    razorpayOrderId: {
      type: String,
      trim: true,
      default: null,
      sparse: true,
      unique: true,
      index: true,
    },

    // Razorpay Payment ID
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: null,
      sparse: true,
      unique: true,
      index: true,
    },

    // Signature returned by Razorpay Checkout
    razorpaySignature: {
      type: String,
      trim: true,
      default: null,
    },

    // Razorpay receipt
    receipt: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    // Amount actually captured by gateway, in paise
    gatewayAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    gatewayCurrency: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
      maxlength: 3,
    },

    // Payment failure information
    failureReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    failureCode: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    // Additional gateway information
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Application-specific metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Important timestamps
    paidAt: {
      type: Date,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    webhookReceivedAt: {
      type: Date,
      default: null,
    },

    // Refund tracking
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastRefundAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

// Quickly find payment attempts for an order.
paymentSchema.index({
  order: 1,
  createdAt: -1,
});

// Useful for payment dashboards/reconciliation.
paymentSchema.index({
  status: 1,
  createdAt: -1,
});

// Gateway reconciliation.
paymentSchema.index({
  gateway: 1,
  status: 1,
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

paymentSchema.pre("validate", function (next) {
  if (this.amount !== undefined && this.amount !== null) {
    this.amount = Math.round(Number(this.amount) * 100) / 100;
  }

  if (
    this.refundedAmount !== undefined &&
    this.refundedAmount !== null
  ) {
    this.refundedAmount =
      Math.round(Number(this.refundedAmount) * 100) / 100;
  }

  next();
});

/*
|--------------------------------------------------------------------------
| Instance helpers
|--------------------------------------------------------------------------
*/

paymentSchema.methods.isSuccessful = function () {
  return this.status === "paid";
};

paymentSchema.methods.isRefunded = function () {
  return (
    this.status === "refunded" ||
    this.status === "partially_refunded"
  );
};

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;