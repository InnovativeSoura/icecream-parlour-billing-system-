const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const generateInvoice = require("../utils/generateInvoice");

// Create Invoice
exports.createInvoice = async (req, res) => {
  // create invoice code
};

// Get All Invoices
exports.getInvoices = async (req, res) => {
  // get invoices code
};

// Download Invoice PDF
exports.downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("customer");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const pdfBuffer = await generateInvoice(invoice);

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoiceNo}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};