const PDFDocument = require("pdfkit");

const generateInvoice = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
      });

      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));

      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc
        .fontSize(24)
        .text("ICE CREAM PARLOUR", {
          align: "center",
        });

      doc
        .fontSize(12)
        .text("Billing Invoice", {
          align: "center",
        });

      doc.moveDown();

      // Invoice Details
      doc.fontSize(12);

      doc.text(`Invoice No: ${invoice.invoiceNo}`);
      doc.text(
        `Date: ${new Date(
          invoice.createdAt
        ).toLocaleDateString()}`
      );

      doc.moveDown();

      // Customer Details
      doc.fontSize(14).text("Customer Details");

      doc.fontSize(12);

      doc.text(
        `Customer: ${
          invoice.customer?.name || "Walk-In Customer"
        }`
      );

      if (invoice.customer?.phone) {
        doc.text(
          `Phone: ${invoice.customer.phone}`
        );
      }

      doc.moveDown();

      // Items Header
      doc.fontSize(14).text("Items");

      doc.moveDown(0.5);

      doc.text(
        "------------------------------------------------------"
      );

      doc.text(
        "Item                 Qty      Price      Total"
      );

      doc.text(
        "------------------------------------------------------"
      );

      // Items
      invoice.items.forEach((item) => {
        doc.text(
          `${item.name.padEnd(20)}
${String(item.quantity).padEnd(8)}
₹${item.price.toFixed(2).padEnd(10)}
₹${item.total.toFixed(2)}`
        );
      });

      doc.text(
        "------------------------------------------------------"
      );

      doc.moveDown();

      // Totals
      doc.text(
        `Subtotal : ₹${invoice.subtotal.toFixed(
          2
        )}`,
        {
          align: "right",
        }
      );

      doc.text(
        `GST : ₹${invoice.gst.toFixed(2)}`,
        {
          align: "right",
        }
      );

      doc.text(
        `Discount : ₹${invoice.discount.toFixed(
          2
        )}`,
        {
          align: "right",
        }
      );

      doc.moveDown();

      doc
        .fontSize(16)
        .text(
          `Grand Total : ₹${invoice.grandTotal.toFixed(
            2
          )}`,
          {
            align: "right",
          }
        );

      doc.moveDown();

      doc.text(
        `Payment Method: ${invoice.paymentMethod}`,
        {
          align: "right",
        }
      );

      doc.moveDown(2);

      // Footer
      doc
        .fontSize(12)
        .text(
          "Thank you for visiting our Ice Cream Parlour!",
          {
            align: "center",
          }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateInvoice;