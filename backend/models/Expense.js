const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Electricity",
        "Rent",
        "Salary",
        "Maintenance",
        "Raw Materials",
        "Other",
      ],
      default: "Other",
    },

    description: {
      type: String,
      default: "",
    },

    expenseDate: {
      type: Date,
      default: Date.now,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Expense", expenseSchema);