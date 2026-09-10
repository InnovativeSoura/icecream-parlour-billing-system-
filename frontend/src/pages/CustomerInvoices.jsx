import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronRight,
  FaClock,
  FaFileInvoice,
  FaPrint,
  FaReceipt,
  FaSearch,
  FaTimes,
  FaShoppingBag,
  FaSpinner,
  FaRupeeSign,
  FaCreditCard,
  FaExclamationCircle,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import api from "../api/api";

import "./CustomerInvoices.css";

const CustomerInvoices = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [search, setSearch] = useState("");

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const response = await api.get("/orders/my-orders");

      const data = response?.data;

      setOrders(
        Array.isArray(data?.orders)
          ? data.orders
          : []
      );
    } catch (error) {
      console.error(
        "Customer invoices error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to load your invoices"
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return orders;
    }

    return orders.filter((order) => {
      const orderNumber =
        String(order?.orderNumber || "")
          .toLowerCase();

      const paymentMethod =
        String(order?.paymentMethod || "")
          .toLowerCase();

      const status =
        String(order?.status || "")
          .toLowerCase();

      return (
        orderNumber.includes(query) ||
        paymentMethod.includes(query) ||
        status.includes(query)
      );
    });
  }, [orders, search]);

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  const getItemCount = (order) => {
    return Array.isArray(order?.items)
      ? order.items.reduce(
          (total, item) =>
            total + (Number(item?.quantity) || 0),
          0
        )
      : 0;
  };

  const getPaymentLabel = (method) => {
    const labels = {
      razorpay: "Razorpay",
      upi: "UPI",
      card: "Card",
      cash: "Cash",
      other: "Other",
      unpaid: "Unpaid",
    };

    return (
      labels[String(method || "").toLowerCase()] ||
      "Payment"
    );
  };

  const getStatusClass = (status) => {
    const normalized = String(
      status || ""
    ).toLowerCase();

    if (
      normalized === "completed" ||
      normalized === "confirmed"
    ) {
      return "invoice-status success";
    }

    if (
      normalized === "cancelled" ||
      normalized === "refunded"
    ) {
      return "invoice-status danger";
    }

    return "invoice-status pending";
  };

  const getStatusIcon = (status) => {
    const normalized = String(
      status || ""
    ).toLowerCase();

    if (
      normalized === "completed" ||
      normalized === "confirmed"
    ) {
      return <FaCheckCircle />;
    }

    if (
      normalized === "cancelled" ||
      normalized === "refunded"
    ) {
      return <FaTimes />;
    }

    return <FaClock />;
  };

  const openInvoice = (order) => {
    setSelectedInvoice(order);
  };

  const closeInvoice = () => {
    setSelectedInvoice(null);
  };

  const printInvoice = (order) => {
    if (!order) {
      return;
    }

    const items = Array.isArray(order.items)
      ? order.items
      : [];

    const itemRows = items
      .map(
        (item) => `
          <tr>
            <td>${item?.name || "Product"}</td>
            <td>${item?.quantity || 0}</td>
            <td>${formatCurrency(
              item?.unitPrice
            )}</td>
            <td>${formatCurrency(
              item?.total
            )}</td>
          </tr>
        `
      )
      .join("");

    const customer =
      order.customerSnapshot || {};

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=800"
      );

    if (!printWindow) {
      toast.error(
        "Please allow pop-ups to print the invoice"
      );
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${
            order.orderNumber || ""
          }</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 40px;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
              color: #202338;
              background: #ffffff;
            }

            .invoice {
              max-width: 850px;
              margin: 0 auto;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 24px;
              border-bottom: 2px solid #ece8ff;
            }

            .brand {
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .logo {
              width: 46px;
              height: 46px;
              border-radius: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 22px;
              background:
                linear-gradient(
                  135deg,
                  #7557f5,
                  #d46eb2
                );
            }

            .brand h1 {
              margin: 0;
              font-size: 24px;
            }

            .brand span {
              display: block;
              margin-top: 3px;
              font-size: 9px;
              letter-spacing: 2px;
              color: #999db1;
            }

            .invoice-title {
              text-align: right;
            }

            .invoice-title h2 {
              margin: 0;
              font-size: 28px;
            }

            .invoice-title p {
              margin: 5px 0 0;
              color: #777b91;
              font-size: 13px;
            }

            .details {
              display: grid;
              grid-template-columns:
                1fr 1fr;
              gap: 30px;
              margin: 32px 0;
            }

            .detail-box {
              padding: 20px;
              border-radius: 14px;
              background: #f8f7fc;
            }

            .detail-box h3 {
              margin: 0 0 10px;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #7a6ee8;
            }

            .detail-box p {
              margin: 4px 0;
              font-size: 13px;
            }

            table {
              width: 100%;
              border-collapse:
                collapse;
            }

            th {
              padding: 13px;
              text-align: left;
              font-size: 11px;
              text-transform:
                uppercase;
              color: #777b91;
              background: #f7f6fb;
            }

            td {
              padding: 14px 13px;
              border-bottom:
                1px solid #ecebf2;
              font-size: 13px;
            }

            .summary {
              width: 320px;
              margin-left: auto;
              margin-top: 25px;
            }

            .summary-row {
              display: flex;
              justify-content:
                space-between;
              padding: 8px 0;
              font-size: 13px;
            }

            .total {
              margin-top: 8px;
              padding-top: 14px;
              border-top:
                2px solid #ded9ff;
              font-size: 18px;
              font-weight: 700;
            }

            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top:
                1px solid #ecebf2;
              text-align: center;
              color: #888c9d;
              font-size: 11px;
            }

            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>

        <body>
          <div class="invoice">

            <div class="header">
              <div class="brand">
                <div class="logo">
                  🍦
                </div>

                <div>
                  <h1>IceCream</h1>
                  <span>PARLOUR</span>
                </div>
              </div>

              <div class="invoice-title">
                <h2>INVOICE</h2>
                <p>
                  ${
                    order.orderNumber ||
                    "Invoice"
                  }
                </p>
              </div>
            </div>

            <div class="details">

              <div class="detail-box">
                <h3>Bill To</h3>
                <p>
                  <strong>
                    ${
                      customer.name ||
                      "Customer"
                    }
                  </strong>
                </p>

                ${
                  customer.email
                    ? `<p>${customer.email}</p>`
                    : ""
                }

                ${
                  customer.phone
                    ? `<p>${customer.phone}</p>`
                    : ""
                }
              </div>

              <div class="detail-box">
                <h3>Invoice Details</h3>

                <p>
                  Date:
                  <strong>
                    ${formatDate(
                      order.createdAt
                    )}
                  </strong>
                </p>

                <p>
                  Time:
                  <strong>
                    ${formatTime(
                      order.createdAt
                    )}
                  </strong>
                </p>

                <p>
                  Payment:
                  <strong>
                    ${getPaymentLabel(
                      order.paymentMethod
                    )}
                  </strong>
                </p>
              </div>

            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <div class="summary">

              <div class="summary-row">
                <span>Subtotal</span>
                <strong>
                  ${formatCurrency(
                    order.subtotal
                  )}
                </strong>
              </div>

              <div class="summary-row">
                <span>Discount</span>
                <strong>
                  - ${formatCurrency(
                    order.discountAmount
                  )}
                </strong>
              </div>

              <div class="summary-row">
                <span>Tax</span>
                <strong>
                  ${formatCurrency(
                    order.taxAmount
                  )}
                </strong>
              </div>

              <div class="summary-row total">
                <span>Total</span>
                <strong>
                  ${formatCurrency(
                    order.totalAmount
                  )}
                </strong>
              </div>

            </div>

            <div class="footer">
              Thank you for choosing
              IceCream Parlour.
              <br />
              We hope to serve you again soon!
            </div>

          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  const totalInvoices = orders.length;

  const paidInvoices = orders.filter(
    (order) =>
      String(
        order?.paymentStatus || ""
      ).toLowerCase() === "paid"
  ).length;

  const totalSpent = orders.reduce(
    (total, order) =>
      total +
      (Number(order?.totalAmount) || 0),
    0
  );

  return (
    <div className="customer-invoices-page">

      {/* PAGE HEADER */}
      <motion.div
        className="invoices-page-header"
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
      >
        <div>
          <div className="invoices-eyebrow">
            <FaReceipt />
            BILLING HISTORY
          </div>

          <h1>My Invoices</h1>

          <p>
            View your purchase history,
            payment details and invoices.
          </p>
        </div>

        <button
          className="invoice-back-btn"
          onClick={() =>
            navigate(
              "/customer/dashboard"
            )
          }
        >
          <FaArrowLeft />
          Dashboard
        </button>
      </motion.div>

      {/* STATISTICS */}
      <motion.div
        className="invoice-stat-grid"
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.05,
        }}
      >
        <div className="invoice-stat-card">
          <div className="invoice-stat-icon purple">
            <FaFileInvoice />
          </div>

          <div>
            <span>Total Invoices</span>
            <strong>
              {totalInvoices}
            </strong>
          </div>
        </div>

        <div className="invoice-stat-card">
          <div className="invoice-stat-icon green">
            <FaCheckCircle />
          </div>

          <div>
            <span>Paid Invoices</span>
            <strong>
              {paidInvoices}
            </strong>
          </div>
        </div>

        <div className="invoice-stat-card">
          <div className="invoice-stat-icon pink">
            <FaRupeeSign />
          </div>

          <div>
            <span>Total Spent</span>
            <strong>
              {formatCurrency(
                totalSpent
              )}
            </strong>
          </div>
        </div>
      </motion.div>

      {/* TOOLBAR */}
      <motion.div
        className="invoice-toolbar"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 0.1,
        }}
      >
        <div className="invoice-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search invoice or order number..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          {search && (
            <button
              onClick={() =>
                setSearch("")
              }
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="invoice-count">
          <FaFileInvoice />
          {filteredOrders.length}{" "}
          invoice
          {filteredOrders.length !==
          1
            ? "s"
            : ""}
        </div>
      </motion.div>

      {/* CONTENT */}
      {loading ? (
        <div className="invoice-state">
          <div className="invoice-loading-icon">
            <FaSpinner />
          </div>

          <h3>
            Loading your invoices
          </h3>

          <p>
            Please wait while we
            retrieve your billing
            history.
          </p>
        </div>
      ) : filteredOrders.length ===
        0 ? (
        <motion.div
          className="invoice-empty-state"
          initial={{
            opacity: 0,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
        >
          <div className="invoice-empty-icon">
            {search ? (
              <FaSearch />
            ) : (
              <FaFileInvoice />
            )}
          </div>

          <h2>
            {search
              ? "No invoices found"
              : "No invoices yet"}
          </h2>

          <p>
            {search
              ? "Try searching with a different order number."
              : "Your invoices will appear here after you place your first order."}
          </p>

          <button
            onClick={() =>
              navigate(
                "/customer/products"
              )
            }
          >
            <FaShoppingBag />
            Start Shopping
            <FaChevronRight />
          </button>
        </motion.div>
      ) : (
        <div className="invoice-list">

          <AnimatePresence>
            {filteredOrders.map(
              (order, index) => (
                <motion.div
                  key={
                    order.id ||
                    order._id ||
                    order.orderNumber ||
                    index
                  }
                  className="invoice-card"
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  transition={{
                    delay:
                      index * 0.04,
                  }}
                >
                  <div className="invoice-card-main">

                    <div className="invoice-card-icon">
                      <FaFileInvoice />
                    </div>

                    <div className="invoice-card-info">
                      <div className="invoice-order-row">
                        <h3>
                          {order.orderNumber ||
                            "Invoice"}
                        </h3>

                        <span
                          className={getStatusClass(
                            order.status
                          )}
                        >
                          {getStatusIcon(
                            order.status
                          )}

                          {order.status ||
                            "pending"}
                        </span>
                      </div>

                      <div className="invoice-meta">

                        <span>
                          <FaCalendarAlt />
                          {formatDate(
                            order.createdAt
                          )}
                        </span>

                        <span>
                          <FaShoppingBag />
                          {getItemCount(
                            order
                          )}{" "}
                          item
                          {getItemCount(
                            order
                          ) !== 1
                            ? "s"
                            : ""}
                        </span>

                        <span>
                          <FaCreditCard />
                          {getPaymentLabel(
                            order.paymentMethod
                          )}
                        </span>

                      </div>
                    </div>

                    <div className="invoice-card-total">
                      <span>Total Amount</span>

                      <strong>
                        {formatCurrency(
                          order.totalAmount
                        )}
                      </strong>

                      <small>
                        {order.paymentStatus ===
                        "paid"
                          ? "Payment completed"
                          : "Payment pending"}
                      </small>
                    </div>

                    <div className="invoice-card-actions">

                      <button
                        className="invoice-view-btn"
                        onClick={() =>
                          openInvoice(
                            order
                          )
                        }
                      >
                        <FaFileInvoice />
                        View
                      </button>

                      <button
                        className="invoice-print-btn"
                        onClick={() =>
                          printInvoice(
                            order
                          )
                        }
                        title="Print invoice"
                      >
                        <FaPrint />
                      </button>

                    </div>

                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      )}

      {/* INVOICE MODAL */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            className="invoice-modal-overlay"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeInvoice();
              }
            }}
          >
            <motion.div
              className="invoice-modal"
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 20,
              }}
            >

              <div className="invoice-modal-header">

                <div>
                  <span>
                    INVOICE
                  </span>

                  <h2>
                    {
                      selectedInvoice.orderNumber
                    }
                  </h2>
                </div>

                <button
                  onClick={
                    closeInvoice
                  }
                  className="invoice-modal-close"
                >
                  <FaTimes />
                </button>

              </div>

              <div className="invoice-modal-body">

                <div className="invoice-modal-brand">
                  <div className="invoice-modal-logo">
                    🍦
                  </div>

                  <div>
                    <h3>
                      IceCream
                    </h3>

                    <span>
                      PARLOUR
                    </span>
                  </div>
                </div>

                <div className="invoice-modal-details">

                  <div>
                    <span>
                      Invoice Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedInvoice.createdAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Payment
                    </span>

                    <strong>
                      {getPaymentLabel(
                        selectedInvoice.paymentMethod
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      {
                        selectedInvoice.paymentStatus ||
                        "pending"
                      }
                    </strong>
                  </div>

                </div>

                <div className="invoice-customer-box">

                  <span>
                    BILLED TO
                  </span>

                  <strong>
                    {
                      selectedInvoice
                        .customerSnapshot
                        ?.name ||
                      "Customer"
                    }
                  </strong>

                  {selectedInvoice
                    .customerSnapshot
                    ?.email && (
                    <p>
                      {
                        selectedInvoice
                          .customerSnapshot
                          .email
                      }
                    </p>
                  )}

                  {selectedInvoice
                    .customerSnapshot
                    ?.phone && (
                    <p>
                      {
                        selectedInvoice
                          .customerSnapshot
                          .phone
                      }
                    </p>
                  )}

                </div>

                <div className="invoice-items">

                  <div className="invoice-items-head">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>

                  {(
                    selectedInvoice.items ||
                    []
                  ).map(
                    (item, index) => (
                      <div
                        className="invoice-item-row"
                        key={
                          item.product?._id ||
                          item.product ||
                          index
                        }
                      >
                        <div>
                          <strong>
                            {item.name}
                          </strong>

                          {item.sku && (
                            <small>
                              SKU:{" "}
                              {item.sku}
                            </small>
                          )}
                        </div>

                        <span>
                          {
                            item.quantity
                          }
                        </span>

                        <span>
                          {formatCurrency(
                            item.unitPrice
                          )}
                        </span>

                        <strong>
                          {formatCurrency(
                            item.total
                          )}
                        </strong>
                      </div>
                    )
                  )}

                </div>

                <div className="invoice-summary">

                  <div>
                    <span>
                      Subtotal
                    </span>

                    <strong>
                      {formatCurrency(
                        selectedInvoice.subtotal
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Discount
                    </span>

                    <strong className="discount">
                      -{" "}
                      {formatCurrency(
                        selectedInvoice.discountAmount
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Tax
                    </span>

                    <strong>
                      {formatCurrency(
                        selectedInvoice.taxAmount
                      )}
                    </strong>
                  </div>

                  <div className="invoice-grand-total">
                    <span>
                      Grand Total
                    </span>

                    <strong>
                      {formatCurrency(
                        selectedInvoice.totalAmount
                      )}
                    </strong>
                  </div>

                </div>

              </div>

              <div className="invoice-modal-footer">

                <button
                  className="invoice-modal-secondary"
                  onClick={
                    closeInvoice
                  }
                >
                  Close
                </button>

                <button
                  className="invoice-modal-primary"
                  onClick={() =>
                    printInvoice(
                      selectedInvoice
                    )
                  }
                >
                  <FaPrint />
                  Print Invoice
                </button>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CustomerInvoices;