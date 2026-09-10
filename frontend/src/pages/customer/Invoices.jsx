import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFileInvoiceDollar,
  FaSearch,
  FaEye,
  FaDownload,
  FaTimes,
  FaCalendarAlt,
  FaCreditCard,
  FaReceipt,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

import api from "../../api/api";
import "./Invoices.css";

const Invoices = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const response = await api.get("/orders/my-orders");

      setOrders(response.data?.orders || []);
    } catch (error) {
      console.error("Invoice fetch error:", error);

      toast.error(
        error.response?.data?.message || "Unable to load invoices"
      );
    } finally {
      setLoading(false);
    }
  };

  const invoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return orders;

    return orders.filter((order) => {
      return (
        order.orderNumber?.toLowerCase().includes(query) ||
        order.paymentMethod?.toLowerCase().includes(query) ||
        order.paymentStatus?.toLowerCase().includes(query)
      );
    });
  }, [orders, search]);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPaymentIcon = (method) => {
    switch (method?.toLowerCase()) {
      case "razorpay":
      case "card":
        return <FaCreditCard />;

      case "upi":
        return <FaReceipt />;

      case "cash":
        return <FaReceipt />;

      default:
        return <FaCreditCard />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return <FaCheckCircle />;

      case "pending":
        return <FaClock />;

      case "failed":
      case "cancelled":
        return <FaTimesCircle />;

      default:
        return <FaClock />;
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "status-paid";

      case "pending":
        return "status-pending";

      case "failed":
      case "cancelled":
        return "status-failed";

      default:
        return "status-pending";
    }
  };

  const handleDownload = (invoice) => {
    /*
     * PDF generation can be connected later to a backend
     * invoice/PDF endpoint.
     */
    toast.info("Invoice PDF download will be connected next.");
  };

  return (
    <div className="customer-invoices-page">
      {/* HEADER */}
      <motion.div
        className="invoices-header"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <span className="invoices-eyebrow">
            <FaFileInvoiceDollar />
            BILLING CENTER
          </span>

          <h1>My Invoices</h1>

          <p>
            View your order invoices, payment details, and purchase history.
          </p>
        </div>

        <div className="invoice-header-icon">
          <FaFileInvoiceDollar />
        </div>
      </motion.div>

      {/* SUMMARY */}
      <div className="invoice-summary-grid">
        <motion.div
          className="invoice-summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="summary-icon">
            <FaFileInvoiceDollar />
          </div>

          <div>
            <span>Total Invoices</span>
            <strong>{orders.length}</strong>
          </div>
        </motion.div>

        <motion.div
          className="invoice-summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="summary-icon paid">
            <FaCheckCircle />
          </div>

          <div>
            <span>Paid Orders</span>
            <strong>
              {
                orders.filter(
                  (order) =>
                    order.paymentStatus?.toLowerCase() === "paid"
                ).length
              }
            </strong>
          </div>
        </motion.div>

        <motion.div
          className="invoice-summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="summary-icon amount">
            <FaReceipt />
          </div>

          <div>
            <span>Total Spent</span>
            <strong>
              {formatCurrency(
                orders
                  .filter(
                    (order) =>
                      order.paymentStatus?.toLowerCase() === "paid"
                  )
                  .reduce(
                    (total, order) =>
                      total + Number(order.totalAmount || 0),
                    0
                  )
              )}
            </strong>
          </div>
        </motion.div>
      </div>

      {/* TOOLBAR */}
      <div className="invoices-toolbar">
        <div className="invoice-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search invoice or order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="invoice-count">
          {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* CONTENT */}
      <div className="invoices-card">
        {loading ? (
          <div className="invoice-loading">
            <div className="invoice-spinner" />
            <p>Loading your invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="invoice-empty">
            <div className="empty-invoice-icon">
              <FaFileInvoiceDollar />
            </div>

            <h3>No invoices found</h3>

            <p>
              {search
                ? "Try a different search term."
                : "Your invoices will appear here after you place an order."}
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="invoice-table-wrapper">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((order, index) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.03,
                      }}
                    >
                      <td>
                        <div className="invoice-number">
                          <div className="invoice-mini-icon">
                            <FaFileInvoiceDollar />
                          </div>

                          <div>
                            <strong>
                              {order.orderNumber || "Invoice"}
                            </strong>

                            <small>
                              {order._id
                                ? `#${order._id.slice(-8).toUpperCase()}`
                                : ""}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="invoice-date">
                          <strong>{formatDate(order.createdAt)}</strong>
                          <span>{formatTime(order.createdAt)}</span>
                        </div>
                      </td>

                      <td>
                        <span className="item-count">
                          {order.items?.length || 0} item
                          {order.items?.length !== 1 ? "s" : ""}
                        </span>
                      </td>

                      <td>
                        <div className="payment-method">
                          {getPaymentIcon(order.paymentMethod)}
                          <span>
                            {order.paymentMethod
                              ? order.paymentMethod
                                  .charAt(0)
                                  .toUpperCase() +
                                order.paymentMethod.slice(1)
                              : "Unpaid"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`invoice-status ${getStatusClass(
                            order.paymentStatus
                          )}`}
                        >
                          {getStatusIcon(order.paymentStatus)}
                          {order.paymentStatus || "Pending"}
                        </span>
                      </td>

                      <td>
                        <strong className="invoice-total">
                          {formatCurrency(order.totalAmount)}
                        </strong>
                      </td>

                      <td>
                        <div className="invoice-actions">
                          <button
                            type="button"
                            className="invoice-action view"
                            title="View Invoice"
                            onClick={() =>
                              setSelectedInvoice(order)
                            }
                          >
                            <FaEye />
                          </button>

                          <button
                            type="button"
                            className="invoice-action download"
                            title="Download Invoice"
                            onClick={() =>
                              handleDownload(order)
                            }
                          >
                            <FaDownload />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="invoice-mobile-list">
              {invoices.map((order) => (
                <motion.div
                  className="invoice-mobile-card"
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="mobile-invoice-top">
                    <div className="invoice-number">
                      <div className="invoice-mini-icon">
                        <FaFileInvoiceDollar />
                      </div>

                      <div>
                        <strong>
                          {order.orderNumber || "Invoice"}
                        </strong>

                        <small>
                          {formatDate(order.createdAt)}
                        </small>
                      </div>
                    </div>

                    <span
                      className={`invoice-status ${getStatusClass(
                        order.paymentStatus
                      )}`}
                    >
                      {getStatusIcon(order.paymentStatus)}
                      {order.paymentStatus || "Pending"}
                    </span>
                  </div>

                  <div className="mobile-invoice-details">
                    <div>
                      <span>Items</span>
                      <strong>
                        {order.items?.length || 0}
                      </strong>
                    </div>

                    <div>
                      <span>Payment</span>
                      <strong>
                        {order.paymentMethod || "Unpaid"}
                      </strong>
                    </div>

                    <div>
                      <span>Total</span>
                      <strong>
                        {formatCurrency(order.totalAmount)}
                      </strong>
                    </div>
                  </div>

                  <div className="mobile-invoice-actions">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedInvoice(order)
                      }
                    >
                      <FaEye />
                      View Invoice
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(order)
                      }
                    >
                      <FaDownload />
                      Download
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* INVOICE MODAL */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            className="invoice-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedInvoice(null)}
          >
            <motion.div
              className="invoice-modal"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="invoice-modal-header">
                <div>
                  <span>INVOICE</span>
                  <h2>
                    {selectedInvoice.orderNumber ||
                      "Invoice"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="invoice-modal-meta">
                <div>
                  <FaCalendarAlt />
                  <div>
                    <span>Date</span>
                    <strong>
                      {formatDate(
                        selectedInvoice.createdAt
                      )}
                    </strong>
                  </div>
                </div>

                <div>
                  <FaCreditCard />
                  <div>
                    <span>Payment</span>
                    <strong>
                      {selectedInvoice.paymentMethod ||
                        "Unpaid"}
                    </strong>
                  </div>
                </div>

                <div>
                  <FaCheckCircle />
                  <div>
                    <span>Status</span>
                    <strong>
                      {selectedInvoice.paymentStatus ||
                        "Pending"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="invoice-modal-items">
                <h3>Order Items</h3>

                {selectedInvoice.items?.map((item, index) => (
                  <div
                    className="invoice-item"
                    key={`${item.product?._id || item.product || index}-${index}`}
                  >
                    <div>
                      <strong>
                        {item.name || "Ice Cream Item"}
                      </strong>

                      <span>
                        Qty: {item.quantity || 1}
                      </span>
                    </div>

                    <strong>
                      {formatCurrency(
                        item.total ??
                          (Number(item.unitPrice || 0) *
                            Number(item.quantity || 1))
                      )}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="invoice-modal-total">
                <span>Total Amount</span>
                <strong>
                  {formatCurrency(
                    selectedInvoice.totalAmount
                  )}
                </strong>
              </div>

              <div className="invoice-modal-footer">
                <button
                  type="button"
                  className="modal-download"
                  onClick={() =>
                    handleDownload(selectedInvoice)
                  }
                >
                  <FaDownload />
                  Download Invoice
                </button>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setSelectedInvoice(null)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Invoices;