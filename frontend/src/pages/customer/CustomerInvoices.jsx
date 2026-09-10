import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaFileInvoice,
  FaPrint,
  FaReceipt,
  FaSearch,
  FaTimes,
  FaWallet,
  FaShoppingBag,
  FaCreditCard,
  FaChevronRight,
} from "react-icons/fa";

import api from "../../api/api";
import "./CustomerInvoices.css";

const CustomerInvoices = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  /*
   * ============================================================
   * LOAD CUSTOMER ORDERS
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    const loadInvoices = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await api.get("/orders/my-orders");

        const data = response.data;

        const customerOrders = Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.data)
          ? data.data
          : [];

        if (mounted) {
          setOrders(customerOrders);
        }
      } catch (error) {
        console.error("Load customer invoices error:", error);

        if (mounted) {
          setErrorMessage(
            error.response?.data?.message ||
              "Unable to load your invoices."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInvoices();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ============================================================
   * HELPERS
   * ============================================================
   */

  const getOrderId = (order) => {
    return order?._id || order?.id;
  };

  const getInvoiceNumber = (order) => {
    if (!order) return "INV-000000";

    if (order.invoiceNumber) {
      return order.invoiceNumber;
    }

    if (order.orderNumber) {
      return order.orderNumber.replace(/^ORD-/, "INV-");
    }

    const id = getOrderId(order);

    return `INV-${String(id || "000000")
      .slice(-8)
      .toUpperCase()}`;
  };

  const getPaymentLabel = (method) => {
    const labels = {
      razorpay: "Razorpay",
      cash: "Cash",
      upi: "UPI",
      card: "Card",
      other: "Other",
      unpaid: "Unpaid",
    };

    return labels[method] || "Payment";
  };

  const getStatusClass = (status) => {
    if (status === "paid") return "paid";
    if (
      ["pending", "partially_paid"].includes(status)
    ) {
      return "pending";
    }

    if (
      ["failed", "cancelled", "refunded"].includes(status)
    ) {
      return "danger";
    }

    return "neutral";
  };

  const getStatusLabel = (status) => {
    if (!status) return "Unknown";

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  const getItemCount = (order) => {
    if (!Array.isArray(order?.items)) {
      return 0;
    }

    return order.items.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  };

  /*
   * ============================================================
   * FILTERED INVOICES
   * ============================================================
   */

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const paymentStatus =
        String(order.paymentStatus || "").toLowerCase();

      const orderStatus =
        String(order.status || "").toLowerCase();

      let matchesFilter = true;

      if (filter === "paid") {
        matchesFilter = paymentStatus === "paid";
      }

      if (filter === "pending") {
        matchesFilter =
          paymentStatus === "pending" ||
          ["pending", "confirmed", "processing"].includes(
            orderStatus
          );
      }

      if (filter === "cancelled") {
        matchesFilter =
          paymentStatus === "cancelled" ||
          orderStatus === "cancelled";
      }

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const invoiceNumber =
        getInvoiceNumber(order).toLowerCase();

      const orderNumber =
        String(order.orderNumber || "").toLowerCase();

      const paymentId =
        String(order.paymentId || "").toLowerCase();

      const itemNames = Array.isArray(order.items)
        ? order.items
            .map((item) => item.name || "")
            .join(" ")
            .toLowerCase()
        : "";

      return (
        invoiceNumber.includes(normalizedSearch) ||
        orderNumber.includes(normalizedSearch) ||
        paymentId.includes(normalizedSearch) ||
        itemNames.includes(normalizedSearch)
      );
    });
  }, [orders, search, filter]);

  /*
   * ============================================================
   * SUMMARY
   * ============================================================
   */

  const summary = useMemo(() => {
    const paidOrders = orders.filter(
      (order) =>
        String(order.paymentStatus).toLowerCase() === "paid"
    );

    const pendingOrders = orders.filter(
      (order) =>
        String(order.paymentStatus).toLowerCase() ===
        "pending"
    );

    const totalSpent = paidOrders.reduce(
      (total, order) =>
        total + Number(order.totalAmount || 0),
      0
    );

    return {
      total: orders.length,
      paid: paidOrders.length,
      pending: pendingOrders.length,
      spent: totalSpent,
    };
  }, [orders]);

  /*
   * ============================================================
   * PRINT INVOICE
   * ============================================================
   */

  const handlePrint = () => {
    window.print();
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="customer-invoices-page">
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <motion.header
        className="customer-invoices-header"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="customer-invoices-heading">
          <button
            type="button"
            className="customer-invoices-back"
            onClick={() =>
              navigate("/customer/dashboard")
            }
            aria-label="Back to dashboard"
          >
            <FaArrowLeft />
          </button>

          <div>
            <span className="customer-invoices-eyebrow">
              ACCOUNT
            </span>

            <h1>Invoices & Receipts</h1>

            <p>
              View your order invoices and payment
              receipts in one place.
            </p>
          </div>
        </div>
      </motion.header>

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <section className="invoice-summary-grid">
        <motion.div
          className="invoice-summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="invoice-summary-icon purple">
            <FaFileInvoice />
          </div>

          <div>
            <span>Total Invoices</span>
            <strong>{summary.total}</strong>
          </div>
        </motion.div>

        <motion.div
          className="invoice-summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="invoice-summary-icon green">
            <FaCheckCircle />
          </div>

          <div>
            <span>Paid</span>
            <strong>{summary.paid}</strong>
          </div>
        </motion.div>

        <motion.div
          className="invoice-summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="invoice-summary-icon orange">
            <FaClock />
          </div>

          <div>
            <span>Pending</span>
            <strong>{summary.pending}</strong>
          </div>
        </motion.div>

        <motion.div
          className="invoice-summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="invoice-summary-icon pink">
            <FaWallet />
          </div>

          <div>
            <span>Total Spent</span>
            <strong>
              {formatCurrency(summary.spent)}
            </strong>
          </div>
        </motion.div>
      </section>

      {/* ======================================================
          INVOICE CONTENT
      ====================================================== */}

      <motion.section
        className="invoice-content-card"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="invoice-toolbar">
          <div>
            <span className="invoice-section-label">
              PAYMENT HISTORY
            </span>

            <h2>Your Invoices</h2>

            <p>
              Keep track of your purchases and payment
              receipts.
            </p>
          </div>

          <div className="invoice-toolbar-right">
            <div className="invoice-search">
              <FaSearch />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search invoice or order..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FILTERS */}

        <div className="invoice-filters">
          <button
            type="button"
            className={
              filter === "all"
                ? "invoice-filter active"
                : "invoice-filter"
            }
            onClick={() => setFilter("all")}
          >
            All
            <span>{orders.length}</span>
          </button>

          <button
            type="button"
            className={
              filter === "paid"
                ? "invoice-filter active"
                : "invoice-filter"
            }
            onClick={() => setFilter("paid")}
          >
            Paid
            <span>{summary.paid}</span>
          </button>

          <button
            type="button"
            className={
              filter === "pending"
                ? "invoice-filter active"
                : "invoice-filter"
            }
            onClick={() => setFilter("pending")}
          >
            Pending
            <span>{summary.pending}</span>
          </button>

          <button
            type="button"
            className={
              filter === "cancelled"
                ? "invoice-filter active danger"
                : "invoice-filter"
            }
            onClick={() => setFilter("cancelled")}
          >
            Cancelled
            <span>
              {
                orders.filter(
                  (order) =>
                    order.paymentStatus ===
                      "cancelled" ||
                    order.status === "cancelled"
                ).length
              }
            </span>
          </button>
        </div>

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <div className="invoice-loading">
            <div className="invoice-spinner" />

            <h3>Loading your invoices...</h3>

            <p>
              Please wait while we retrieve your
              payment history.
            </p>
          </div>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {!loading && errorMessage && (
          <div className="invoice-empty-state error">
            <div className="invoice-empty-icon">
              <FaFileInvoice />
            </div>

            <h3>Unable to load invoices</h3>

            <p>{errorMessage}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="invoice-primary-button"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {!loading &&
          !errorMessage &&
          filteredOrders.length === 0 && (
            <div className="invoice-empty-state">
              <div className="invoice-empty-icon">
                <FaReceipt />
              </div>

              <h3>
                {search
                  ? "No matching invoices"
                  : "No invoices yet"}
              </h3>

              <p>
                {search
                  ? "Try searching with another invoice number or order."
                  : "Your invoices and payment receipts will appear here after you place an order."}
              </p>

              {!search && (
                <button
                  type="button"
                  className="invoice-primary-button"
                  onClick={() =>
                    navigate("/customer/products")
                  }
                >
                  <FaShoppingBag />
                  Start Shopping
                </button>
              )}
            </div>
          )}

        {/* ==================================================
            INVOICE LIST
        ================================================== */}

        {!loading &&
          !errorMessage &&
          filteredOrders.length > 0 && (
            <div className="invoice-list">
              {filteredOrders.map((order, index) => {
                const paymentStatus =
                  order.paymentStatus || "pending";

                return (
                  <motion.article
                    key={
                      getOrderId(order) ||
                      `${order.orderNumber}-${index}`
                    }
                    className="invoice-row"
                    initial={{
                      opacity: 0,
                      y: 12,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: index * 0.04,
                    }}
                  >
                    <div className="invoice-row-icon">
                      <FaFileInvoice />
                    </div>

                    <div className="invoice-main-info">
                      <div className="invoice-number-line">
                        <strong>
                          {getInvoiceNumber(order)}
                        </strong>

                        <span
                          className={`invoice-status ${getStatusClass(
                            paymentStatus
                          )}`}
                        >
                          {paymentStatus === "paid" && (
                            <FaCheckCircle />
                          )}

                          {paymentStatus ===
                            "pending" && (
                            <FaClock />
                          )}

                          {getStatusLabel(
                            paymentStatus
                          )}
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
                          {getItemCount(order)}{" "}
                          {getItemCount(order) === 1
                            ? "item"
                            : "items"}
                        </span>

                        <span>
                          <FaCreditCard />
                          {getPaymentLabel(
                            order.paymentMethod
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="invoice-amount">
                      <span>Total Amount</span>

                      <strong>
                        {formatCurrency(
                          order.totalAmount
                        )}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="invoice-view-button"
                      onClick={() =>
                        setSelectedInvoice(order)
                      }
                    >
                      <span>View</span>
                      <FaChevronRight />
                    </button>
                  </motion.article>
                );
              })}
            </div>
          )}
      </motion.section>

      {/* ======================================================
          INVOICE MODAL
      ====================================================== */}

      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            className="invoice-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                setSelectedInvoice(null);
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
              {/* MODAL HEADER */}

              <div className="invoice-modal-header">
                <div>
                  <span className="invoice-section-label">
                    PAYMENT RECEIPT
                  </span>

                  <h2>
                    {getInvoiceNumber(
                      selectedInvoice
                    )}
                  </h2>
                </div>

                <div className="invoice-modal-actions">
                  <button
                    type="button"
                    className="invoice-print-button"
                    onClick={handlePrint}
                  >
                    <FaPrint />
                    Print
                  </button>

                  <button
                    type="button"
                    className="invoice-close-button"
                    onClick={() =>
                      setSelectedInvoice(null)
                    }
                    aria-label="Close invoice"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* PRINTABLE INVOICE */}

              <div className="printable-invoice">
                <div className="print-invoice-brand">
                  <div className="print-brand-icon">
                    <FaReceipt />
                  </div>

                  <div>
                    <h3>IceCream</h3>
                    <span>PARLOUR</span>
                  </div>
                </div>

                <div className="print-invoice-title">
                  <span>INVOICE</span>

                  <strong>
                    {getInvoiceNumber(
                      selectedInvoice
                    )}
                  </strong>
                </div>

                <div className="invoice-detail-grid">
                  <div>
                    <span>Order Number</span>
                    <strong>
                      {selectedInvoice.orderNumber ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Order Date</span>
                    <strong>
                      {formatDateTime(
                        selectedInvoice.createdAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Payment Method</span>
                    <strong>
                      {getPaymentLabel(
                        selectedInvoice.paymentMethod
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Payment Status</span>
                    <strong
                      className={
                        selectedInvoice.paymentStatus ===
                        "paid"
                          ? "invoice-paid-text"
                          : "invoice-pending-text"
                      }
                    >
                      {getStatusLabel(
                        selectedInvoice.paymentStatus
                      )}
                    </strong>
                  </div>
                </div>

                <div className="invoice-customer-box">
                  <span>BILLED TO</span>

                  <strong>
                    {
                      selectedInvoice
                        .customerSnapshot?.name
                    }
                  </strong>

                  {selectedInvoice
                    .customerSnapshot?.email && (
                    <small>
                      {
                        selectedInvoice
                          .customerSnapshot.email
                      }
                    </small>
                  )}

                  {selectedInvoice
                    .customerSnapshot?.phone && (
                    <small>
                      {
                        selectedInvoice
                          .customerSnapshot.phone
                      }
                    </small>
                  )}
                </div>

                <div className="invoice-items-table">
                  <div className="invoice-table-head">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>

                  {(selectedInvoice.items || []).map(
                    (item, itemIndex) => (
                      <div
                        className="invoice-table-row"
                        key={
                          item.product ||
                          `${item.name}-${itemIndex}`
                        }
                      >
                        <div>
                          <strong>
                            {item.name ||
                              "Ice Cream"}
                          </strong>

                          {item.sku && (
                            <small>
                              SKU: {item.sku}
                            </small>
                          )}
                        </div>

                        <span>
                          {item.quantity || 0}
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

                <div className="invoice-totals">
                  <div>
                    <span>Subtotal</span>
                    <strong>
                      {formatCurrency(
                        selectedInvoice.subtotal
                      )}
                    </strong>
                  </div>

                  {Number(
                    selectedInvoice.discountAmount
                  ) > 0 && (
                    <div className="invoice-discount">
                      <span>Discount</span>
                      <strong>
                        -
                        {formatCurrency(
                          selectedInvoice.discountAmount
                        )}
                      </strong>
                    </div>
                  )}

                  <div>
                    <span>Tax</span>
                    <strong>
                      {formatCurrency(
                        selectedInvoice.taxAmount
                      )}
                    </strong>
                  </div>

                  <div className="invoice-grand-total">
                    <span>Total Paid</span>
                    <strong>
                      {formatCurrency(
                        selectedInvoice.totalAmount
                      )}
                    </strong>
                  </div>
                </div>

                {selectedInvoice.paymentId && (
                  <div className="invoice-payment-reference">
                    <span>Payment Reference</span>

                    <strong>
                      {selectedInvoice.paymentId}
                    </strong>
                  </div>
                )}

                <div className="invoice-thank-you">
                  <strong>
                    Thank you for choosing IceCream!
                  </strong>

                  <span>
                    We hope every scoop makes your
                    day a little sweeter.
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerInvoices;