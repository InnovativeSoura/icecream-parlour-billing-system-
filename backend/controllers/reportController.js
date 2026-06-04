const Invoice = require("../models/Invoice");
const Expense = require("../models/Expense");

// Sales Report
exports.getSalesReport = async (
  req,
  res
) => {
  try {
    const invoices = await Invoice.find();

    const totalSales = invoices.reduce(
      (sum, invoice) =>
        sum + invoice.grandTotal,
      0
    );

    res.status(200).json({
      success: true,
      totalInvoices: invoices.length,
      totalSales,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Profit Report
exports.getProfitReport = async (
  req,
  res
) => {
  try {
    const invoices = await Invoice.find();

    const expenses = await Expense.find();

    const revenue = invoices.reduce(
      (sum, invoice) =>
        sum + invoice.grandTotal,
      0
    );

    const totalExpense = expenses.reduce(
      (sum, expense) =>
        sum + expense.amount,
      0
    );

    const profit =
      revenue - totalExpense;

    res.status(200).json({
      success: true,
      revenue,
      totalExpense,
      profit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};