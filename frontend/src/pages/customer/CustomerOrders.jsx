// frontend/src/pages/customer/CustomerOrders.jsx

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaCreditCard,
  FaEye,
  FaFilter,
  FaReceipt,
  FaRedo,
  FaSearch,
  FaShoppingBag,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../../api/api";
import "./CustomerOrders.css";

const CustomerOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState(null);

  /* =========================================================
     FETCH ORDERS
  ========================================================= */

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await api.get("/orders/my-orders");

      const data = response?.data;

      if (data?.success) {
        const receivedOrders = Array.isArray(data.orders) ? data.orders : [];

        setOrders(receivedOrders);
      } else {
        setOrders([]);

        toast.error(data?.message || "Unable to load your orders");
      }
    } catch (error) {
      console.error("Customer orders error:", error);

      setOrders([]);

      toast.error(
        error?.response?.data?.message || "Unable to load your orders",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     ORDER HELPERS
  ========================================================= */

  const getOrderId = (order) => {
    return order?._id || order?.id || null;
  };

  const getOrderNumber = (order) => {
    const orderNumber = order?.orderNumber;

    if (orderNumber) {
      return orderNumber;
    }

    const id = getOrderId(order);

    return id ? `#${id.slice(-6).toUpperCase()}` : "#UNKNOWN";
  };

  const getOrderDate = (order) => {
    if (!order?.createdAt) {
      return "Date unavailable";
    }

    const date = new Date(order.createdAt);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getOrderTime = (order) => {
    if (!order?.createdAt) {
      return "";
    }

    const date = new Date(order.createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Pending";
    }

    return String(status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatPaymentMethod = (method) => {
    if (!method || method === "unpaid") {
      return "Pending";
    }

    if (method === "razorpay") {
      return "Razorpay";
    }

    return String(method)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount);

    return `₹${(Number.isFinite(numericAmount)
      ? numericAmount
      : 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getItemCount = (order) => {
    if (!Array.isArray(order?.items)) {
      return 0;
    }

    return order.items.reduce(
      (total, item) => total + Number(item?.quantity || 0),
      0,
    );
  };

  /* =========================================================
     STATUS CLASSES
  ========================================================= */

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "completed";

      case "confirmed":
        return "confirmed";

      case "processing":
        return "processing";

      case "pending":
        return "pending";

      case "cancelled":
        return "cancelled";

      case "refunded":
        return "refunded";

      case "draft":
        return "default";

      default:
        return "default";
    }
  };

  const getPaymentClass = (status) => {
    switch (status) {
      case "paid":
        return "paid";

      case "failed":
        return "failed";

      case "refunded":
        return "refunded";

      case "cancelled":
        return "cancelled";

      case "partially_refunded":
        return "refunded";

      default:
        return "pending";
    }
  };

  /* =========================================================
     CANCEL ELIGIBILITY
  ========================================================= */

  const canCancelOrder = (order) => {
    if (!order) {
      return false;
    }

    /*
     * Some older customer orders may not have an explicit
     * `status` field in the API response.
     *
     * The UI already treats a missing status as "Pending",
     * so cancellation must use the same fallback.
     */
    const rawOrderStatus = String(order?.status ?? "")
      .trim()
      .toLowerCase();

    const orderStatus = rawOrderStatus || "pending";

    /*
     * Missing paymentStatus is also treated as pending.
     */
    const rawPaymentStatus = String(order?.paymentStatus ?? "")
      .trim()
      .toLowerCase();

    const paymentStatus = rawPaymentStatus || "pending";

    /*
     * Customer can cancel while the order has not
     * moved beyond pending/confirmed.
     */
    const cancellableStatuses = ["pending", "confirmed"];

    /*
     * Paid/refunded/cancelled orders must never
     * show the customer cancellation action.
     */
    const blockedPaymentStatuses = [
      "paid",
      "refunded",
      "cancelled",
      "partially_refunded",
    ];

    return (
      cancellableStatuses.includes(orderStatus) &&
      !blockedPaymentStatuses.includes(paymentStatus)
    );
  };

  /* =========================================================
     FILTER ORDERS
  ========================================================= */

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return orders.filter((order) => {
      const orderNumber = getOrderNumber(order).toLowerCase();

      const matchesSearch = !searchValue || orderNumber.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || order?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const stats = useMemo(() => {
    const total = orders.length;

    const completed = orders.filter(
      (order) => order?.status === "completed",
    ).length;

    const pending = orders.filter((order) =>
      ["pending", "confirmed", "processing"].includes(order?.status),
    ).length;

    const spent = orders
      .filter((order) => order?.paymentStatus === "paid")
      .reduce((sum, order) => sum + Number(order?.totalAmount || 0), 0);

    return {
      total,
      completed,
      pending,
      spent,
    };
  }, [orders]);

  /* =========================================================
     ORDER DETAILS
  ========================================================= */

  const toggleOrder = (orderId) => {
    setExpandedOrder((current) => (current === orderId ? null : orderId));
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const closeModal = () => {
    if (cancellingOrderId) {
      return;
    }

    setSelectedOrder(null);
  };

  /* =========================================================
     CANCEL CONFIRMATION
  ========================================================= */

  const openCancelConfirmation = (order) => {
    if (!canCancelOrder(order)) {
      toast.info("This order can no longer be cancelled.");

      return;
    }

    setCancelConfirmOrder(order);
  };

  const closeCancelConfirmation = () => {
    if (cancellingOrderId) {
      return;
    }

    setCancelConfirmOrder(null);
  };

  /* =========================================================
     CANCEL ORDER
  ========================================================= */

  const handleCancelOrder = async (order) => {
    const orderId = getOrderId(order);

    if (!orderId) {
      toast.error("Invalid order.");
      return;
    }

    if (!canCancelOrder(order)) {
      toast.info("This order can no longer be cancelled.");

      setCancelConfirmOrder(null);

      return;
    }

    try {
      setCancellingOrderId(orderId);

      const response = await api.patch(`/orders/${orderId}/cancel`);

      const data = response?.data;

      if (!data?.success) {
        toast.error(data?.message || "Unable to cancel order.");

        return;
      }

      const serverOrder = data?.order;

      /*
       * Update the order immediately in local state.
       * This avoids waiting for a second API request
       * just to update the visible status.
       */
      const updatedOrder = {
        ...order,
        ...(serverOrder || {}),
        status: "cancelled",
        paymentStatus: serverOrder?.paymentStatus || "cancelled",
      };

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          getOrderId(currentOrder) === orderId ? updatedOrder : currentOrder,
        ),
      );

      /*
       * Keep the details modal synchronized if it
       * was displaying the cancelled order.
       */
      if (selectedOrder && getOrderId(selectedOrder) === orderId) {
        setSelectedOrder(updatedOrder);
      }

      /*
       * Collapse the order card after cancellation.
       */
      if (expandedOrder === orderId) {
        setExpandedOrder(null);
      }

      setCancelConfirmOrder(null);

      toast.success("Order cancelled successfully.");
    } catch (error) {
      console.error("Cancel order error:", error);

      toast.error(error?.response?.data?.message || "Unable to cancel order.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  /* =========================================================
     REORDER
  ========================================================= */

  const handleReorder = (order) => {
    if (!Array.isArray(order?.items) || order.items.length === 0) {
      toast.error("This order cannot be reordered.");

      return;
    }

    /*
     * Cart integration can be connected here.
     */
    toast.info("Reorder will be connected to your shopping cart.");
  };

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  const renderEmptyState = () => (
    <motion.div
      className="customer-orders-empty"
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
    >
      <div className="empty-icon">
        <FaShoppingBag />
      </div>

      <h2>No orders found</h2>

      <p>
        {search || statusFilter !== "all"
          ? "Try changing your search or filter."
          : "You haven't placed any orders yet."}
      </p>

      {!search && statusFilter === "all" && (
        <button
          type="button"
          className="start-shopping-btn"
          onClick={() => navigate("/customer/products")}
        >
          <FaShoppingBag />
          Start Shopping
        </button>
      )}
    </motion.div>
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="customer-orders-page">
      <div className="customer-orders-container">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <motion.header
          className="customer-orders-header"
          initial={{
            opacity: 0,
            y: -18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/customer/dashboard")}
          >
            <FaArrowLeft />
            Dashboard
          </button>

          <div className="header-content">
            <div>
              <span className="page-eyebrow">MY ACCOUNT</span>

              <h1>My Orders</h1>

              <p>Track your orders and view your purchase history.</p>
            </div>

            <div className="header-icon">
              <FaReceipt />
            </div>
          </div>
        </motion.header>

        {/* =====================================================
            STATS
        ===================================================== */}

        <motion.section
          className="orders-stats"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.08,
          }}
        >
          <div className="stat-card">
            <div className="stat-icon">
              <FaShoppingBag />
            </div>

            <div>
              <span>Total Orders</span>
              <strong>{stats.total}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaClock />
            </div>

            <div>
              <span>In Progress</span>
              <strong>{stats.pending}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaBoxOpen />
            </div>

            <div>
              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaCreditCard />
            </div>

            <div>
              <span>Total Spent</span>

              <strong>{formatCurrency(stats.spent)}</strong>
            </div>
          </div>
        </motion.section>

        {/* =====================================================
            FILTER TOOLBAR
        ===================================================== */}

        <motion.section
          className="orders-toolbar"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.12,
          }}
        >
          <div className="orders-search">
            <FaSearch />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by order number..."
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

          <div className="status-filter">
            <FaFilter />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Orders</option>

              <option value="pending">Pending</option>

              <option value="confirmed">Confirmed</option>

              <option value="processing">Processing</option>

              <option value="completed">Completed</option>

              <option value="cancelled">Cancelled</option>

              <option value="refunded">Refunded</option>
            </select>
          </div>

          <button
            type="button"
            className="refresh-orders"
            onClick={fetchOrders}
            disabled={loading}
          >
            <FaRedo className={loading ? "spin" : ""} />
            Refresh
          </button>
        </motion.section>

        {/* =====================================================
            ORDERS LIST
        ===================================================== */}

        <section className="orders-list-section">
          {loading ? (
            <div className="orders-loading">
              <FaSpinner className="spin" />

              <p>Loading your orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="orders-list">
              <AnimatePresence>
                {filteredOrders.map((order, index) => {
                  const orderId = getOrderId(order);

                  const isExpanded = expandedOrder === orderId;

                  const isCancelling = cancellingOrderId === orderId;

                  const cancellable = canCancelOrder(order);

                  return (
                    <motion.article
                      className="order-card"
                      key={orderId}
                      initial={{
                        opacity: 0,
                        y: 18,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: index * 0.04,
                      }}
                    >
                      {/* =================================================
                            ORDER CARD HEADER
                        ================================================= */}

                      <div className="order-card-main">
                        <div className="order-product-icon">
                          <FaReceipt />
                        </div>

                        <div className="order-main-info">
                          <div className="order-number-row">
                            <h2>{getOrderNumber(order)}</h2>

                            <span
                              className={`order-status ${getStatusClass(
                                order.status,
                              )}`}
                            >
                              {formatStatus(order.status)}
                            </span>
                          </div>

                          <div className="order-meta">
                            <span>
                              <FaCalendarAlt />

                              {getOrderDate(order)}
                            </span>

                            <span>
                              <FaClock />

                              {getOrderTime(order)}
                            </span>

                            <span>
                              <FaBoxOpen />
                              {getItemCount(order)}{" "}
                              {getItemCount(order) === 1 ? "item" : "items"}
                            </span>
                          </div>
                        </div>

                        <div className="order-total">
                          <span>Total</span>

                          <strong>{formatCurrency(order.totalAmount)}</strong>

                          <small
                            className={`payment-status ${getPaymentClass(
                              order.paymentStatus,
                            )}`}
                          >
                            {formatStatus(order.paymentStatus)}
                          </small>
                        </div>

                        {/* =================================================
                              QUICK ACTIONS
                          ================================================= */}

                        <div className="order-card-actions">
                          {cancellable && (
                            <button
                              type="button"
                              className="quick-cancel-btn"
                              onClick={() => openCancelConfirmation(order)}
                              disabled={isCancelling || !!cancellingOrderId}
                              title="Cancel Order"
                            >
                              {isCancelling ? (
                                <>
                                  <FaSpinner className="spin" />

                                  <span>Cancelling</span>
                                </>
                              ) : (
                                <>
                                  <FaTimes />

                                  <span>Cancel</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            className="expand-order"
                            onClick={() => toggleOrder(orderId)}
                            aria-label={
                              isExpanded
                                ? "Hide order details"
                                : "Show order details"
                            }
                            title={isExpanded ? "Hide details" : "Show details"}
                          >
                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                        </div>
                      </div>

                      {/* =================================================
                            EXPANDED DETAILS
                        ================================================= */}

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            className="order-details"
                            initial={{
                              height: 0,
                              opacity: 0,
                            }}
                            animate={{
                              height: "auto",
                              opacity: 1,
                            }}
                            exit={{
                              height: 0,
                              opacity: 0,
                            }}
                          >
                            <div className="order-items">
                              <h3>Order Items</h3>

                              {Array.isArray(order.items) &&
                                order.items.map((item, itemIndex) => (
                                  <div
                                    className="order-item"
                                    key={item._id || `${orderId}-${itemIndex}`}
                                  >
                                    <div className="item-image">
                                      {item?.product?.image ? (
                                        <img
                                          src={item.product.image}
                                          alt={item.name || "Ice cream"}
                                          onError={(event) => {
                                            event.currentTarget.style.display =
                                              "none";
                                          }}
                                        />
                                      ) : (
                                        <FaIceCreamFallback />
                                      )}
                                    </div>

                                    <div className="item-info">
                                      <strong>
                                        {item.name || "Ice Cream"}
                                      </strong>

                                      <span>
                                        {item.quantity} ×{" "}
                                        {formatCurrency(item.unitPrice)}
                                      </span>
                                    </div>

                                    <strong className="item-total">
                                      {formatCurrency(item.total)}
                                    </strong>
                                  </div>
                                ))}
                            </div>

                            {/* =================================================
                                  ORDER SUMMARY
                              ================================================= */}

                            <div className="order-summary">
                              <div>
                                <span>Subtotal</span>

                                <strong>
                                  {formatCurrency(order.subtotal)}
                                </strong>
                              </div>

                              <div>
                                <span>Discount</span>

                                <strong>
                                  -{formatCurrency(order.discountAmount)}
                                </strong>
                              </div>

                              <div>
                                <span>Tax</span>

                                <strong>
                                  {formatCurrency(order.taxAmount)}
                                </strong>
                              </div>

                              <div className="summary-total">
                                <span>Grand Total</span>

                                <strong>
                                  {formatCurrency(order.totalAmount)}
                                </strong>
                              </div>
                            </div>

                            {/* =================================================
                                  ORDER FOOTER
                              ================================================= */}

                            <div className="order-footer">
                              <div className="payment-info">
                                <span>Payment Method</span>

                                <strong>
                                  {formatPaymentMethod(order.paymentMethod)}
                                </strong>
                              </div>

                              <div className="order-actions">
                                <button
                                  type="button"
                                  onClick={() => handleViewOrder(order)}
                                >
                                  <FaEye />
                                  View Details
                                </button>

                                {cancellable && (
                                  <button
                                    type="button"
                                    className="cancel-order-btn"
                                    onClick={() =>
                                      openCancelConfirmation(order)
                                    }
                                    disabled={
                                      isCancelling || !!cancellingOrderId
                                    }
                                  >
                                    {isCancelling ? (
                                      <>
                                        <FaSpinner className="spin" />
                                        Cancelling...
                                      </>
                                    ) : (
                                      <>
                                        <FaTimes />
                                        Cancel Order
                                      </>
                                    )}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  className="reorder-btn"
                                  onClick={() => handleReorder(order)}
                                >
                                  <FaRedo />
                                  Reorder
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      {/* =========================================================
          ORDER DETAILS MODAL
      ========================================================= */}

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            className="order-modal-overlay"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={closeModal}
          >
            <motion.div
              className="order-modal"
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <span>ORDER DETAILS</span>

                  <h2>{getOrderNumber(selectedOrder)}</h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close order details"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-status-row">
                <span
                  className={`order-status ${getStatusClass(
                    selectedOrder.status,
                  )}`}
                >
                  {formatStatus(selectedOrder.status)}
                </span>

                <span
                  className={`payment-status ${getPaymentClass(
                    selectedOrder.paymentStatus,
                  )}`}
                >
                  Payment: {formatStatus(selectedOrder.paymentStatus)}
                </span>
              </div>

              <div className="modal-items">
                {Array.isArray(selectedOrder.items) &&
                  selectedOrder.items.map((item, index) => (
                    <div className="modal-item" key={item._id || index}>
                      <div>
                        <strong>{item.name || "Ice Cream"}</strong>

                        <span>
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </span>
                      </div>

                      <strong>{formatCurrency(item.total)}</strong>
                    </div>
                  ))}
              </div>

              <div className="modal-total">
                <span>Order Total</span>

                <strong>{formatCurrency(selectedOrder.totalAmount)}</strong>
              </div>

              <div className="modal-date">
                <FaCalendarAlt />
                {getOrderDate(selectedOrder)} at {getOrderTime(selectedOrder)}
              </div>

              {canCancelOrder(selectedOrder) && (
                <div className="modal-cancel-section">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => {
                      setSelectedOrder(null);

                      openCancelConfirmation(selectedOrder);
                    }}
                    disabled={!!cancellingOrderId}
                  >
                    <FaTimes />
                    Cancel This Order
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          CANCEL CONFIRMATION MODAL
      ========================================================= */}

      <AnimatePresence>
        {cancelConfirmOrder && (
          <motion.div
            className="cancel-modal-overlay"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={closeCancelConfirmation}
          >
            <motion.div
              className="cancel-modal"
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="cancel-modal-icon">
                <FaTimes />
              </div>

              <div className="cancel-modal-content">
                <span className="cancel-modal-eyebrow">CANCEL ORDER</span>

                <h2>Cancel this order?</h2>

                <p>
                  Are you sure you want to cancel{" "}
                  <strong>{getOrderNumber(cancelConfirmOrder)}</strong>?
                </p>

                <div className="cancel-order-summary">
                  <span>Order Total</span>

                  <strong>
                    {formatCurrency(cancelConfirmOrder.totalAmount)}
                  </strong>
                </div>

                <div className="cancel-warning">
                  <FaClock />

                  <span>This action cannot be undone.</span>
                </div>
              </div>

              <div className="cancel-modal-actions">
                <button
                  type="button"
                  className="cancel-keep-btn"
                  onClick={closeCancelConfirmation}
                  disabled={!!cancellingOrderId}
                >
                  Keep Order
                </button>

                <button
                  type="button"
                  className="cancel-confirm-btn"
                  onClick={() => handleCancelOrder(cancelConfirmOrder)}
                  disabled={!!cancellingOrderId}
                >
                  {cancellingOrderId ? (
                    <>
                      <FaSpinner className="spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <FaTimes />
                      Yes, Cancel Order
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

/* =============================================================
   ICE CREAM FALLBACK
============================================================= */

const FaIceCreamFallback = () => <span className="item-fallback-icon">🍦</span>;

export default CustomerOrders;
