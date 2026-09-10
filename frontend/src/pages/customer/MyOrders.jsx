import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaIceCream,
  FaReceipt,
  FaSearch,
  FaSpinner,
  FaTimesCircle,
  FaTruck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../../api/api";
import "./CustomerOrders.css";

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    icon: FaClock,
    className: "status-draft",
  },
  pending: {
    label: "Pending",
    icon: FaClock,
    className: "status-pending",
  },
  confirmed: {
    label: "Confirmed",
    icon: FaCheckCircle,
    className: "status-confirmed",
  },
  processing: {
    label: "Preparing",
    icon: FaTruck,
    className: "status-processing",
  },
  completed: {
    label: "Completed",
    icon: FaCheckCircle,
    className: "status-completed",
  },
  cancelled: {
    label: "Cancelled",
    icon: FaTimesCircle,
    className: "status-cancelled",
  },
  refunded: {
    label: "Refunded",
    icon: FaReceipt,
    className: "status-refunded",
  },
};

const PAYMENT_CONFIG = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
};

const CustomerOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
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
      console.error("Customer orders error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to load your orders"
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order?.orderNumber
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        order?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const formatDate = (date) => {
    if (!date) return "—";

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
    if (!date) return "";

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

  const getStatusConfig = (status) => {
    return (
      STATUS_CONFIG[status] || {
        label: status || "Unknown",
        icon: FaExclamationCircle,
        className: "status-default",
      }
    );
  };

  const toggleOrder = (orderId) => {
    setExpandedOrder((current) =>
      current === orderId ? null : orderId
    );
  };

  const handleStartShopping = () => {
    navigate("/customer/products");
  };

  return (
    <main className="customer-orders-page">
      <div className="customer-orders-container">

        {/* ==================================================
            HEADER
        ================================================== */}
        <motion.div
          className="orders-page-header"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          <div>
            <span className="orders-eyebrow">
              ORDER HISTORY
            </span>

            <h1>My Orders</h1>

            <p>
              Track your orders and revisit your
              favourite ice cream moments.
            </p>
          </div>

          <motion.button
            className="continue-shopping-btn"
            onClick={handleStartShopping}
            whileHover={{
              y: -2,
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.98,
            }}
          >
            <FaIceCream />
            Continue Shopping
            <FaArrowRight />
          </motion.button>
        </motion.div>

        {/* ==================================================
            SUMMARY
        ================================================== */}
        {!loading && orders.length > 0 && (
          <motion.div
            className="orders-summary"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
            }}
          >
            <div className="summary-card">
              <div className="summary-icon purple">
                <FaReceipt />
              </div>

              <div>
                <span>Total Orders</span>
                <strong>{orders.length}</strong>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon orange">
                <FaClock />
              </div>

              <div>
                <span>Active Orders</span>

                <strong>
                  {
                    orders.filter((order) =>
                      [
                        "pending",
                        "confirmed",
                        "processing",
                      ].includes(order.status)
                    ).length
                  }
                </strong>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon green">
                <FaCheckCircle />
              </div>

              <div>
                <span>Completed</span>

                <strong>
                  {
                    orders.filter(
                      (order) =>
                        order.status ===
                        "completed"
                    ).length
                  }
                </strong>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon pink">
                <FaReceipt />
              </div>

              <div>
                <span>Total Spent</span>

                <strong>
                  {formatCurrency(
                    orders.reduce(
                      (total, order) =>
                        total +
                        Number(
                          order.totalAmount || 0
                        ),
                      0
                    )
                  )}
                </strong>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================================================
            FILTERS
        ================================================== */}
        {!loading && orders.length > 0 && (
          <motion.div
            className="orders-toolbar"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
          >
            <div className="orders-search">
              <FaSearch />

              <input
                type="text"
                placeholder="Search by order number..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div className="status-filters">
              {[
                ["all", "All"],
                ["pending", "Pending"],
                ["processing", "Preparing"],
                ["completed", "Completed"],
                ["cancelled", "Cancelled"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={
                    statusFilter === value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter(value)
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ==================================================
            LOADING
        ================================================== */}
        {loading && (
          <div className="orders-loading">
            <div className="loading-spinner">
              <FaSpinner />
            </div>

            <h3>Loading your orders...</h3>

            <p>
              Please wait while we retrieve your
              order history.
            </p>
          </div>
        )}

        {/* ==================================================
            EMPTY
        ================================================== */}
        {!loading && orders.length === 0 && (
          <motion.div
            className="orders-empty"
            initial={{
              opacity: 0,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
          >
            <div className="empty-icon">
              <FaBoxOpen />
            </div>

            <span className="empty-label">
              ORDER HISTORY
            </span>

            <h2>No orders yet</h2>

            <p>
              Your delicious ice cream orders will
              appear here after your first purchase.
            </p>

            <button
              onClick={handleStartShopping}
              className="empty-shopping-btn"
            >
              <FaIceCream />
              Start Shopping
              <FaArrowRight />
            </button>
          </motion.div>
        )}

        {/* ==================================================
            NO FILTER RESULTS
        ================================================== */}
        {!loading &&
          orders.length > 0 &&
          filteredOrders.length === 0 && (
            <div className="orders-empty filtered-empty">
              <div className="empty-icon">
                <FaSearch />
              </div>

              <h2>No matching orders</h2>

              <p>
                Try changing your search or status
                filter.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="empty-shopping-btn"
              >
                Clear Filters
              </button>
            </div>
          )}

        {/* ==================================================
            ORDER LIST
        ================================================== */}
        {!loading &&
          filteredOrders.length > 0 && (
            <div className="orders-list">
              {filteredOrders.map(
                (order, index) => {
                  const status =
                    getStatusConfig(
                      order.status
                    );

                  const StatusIcon =
                    status.icon;

                  const isExpanded =
                    expandedOrder ===
                    order.id ||
                    expandedOrder ===
                    order._id;

                  const orderId =
                    order.id ||
                    order._id;

                  return (
                    <motion.article
                      key={orderId}
                      className={`order-card ${
                        isExpanded
                          ? "expanded"
                          : ""
                      }`}
                      initial={{
                        opacity: 0,
                        y: 20,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: index * 0.06,
                      }}
                    >
                      {/* ORDER TOP */}
                      <div className="order-card-top">

                        <div className="order-identity">
                          <div className="order-icon">
                            <FaReceipt />
                          </div>

                          <div>
                            <span>
                              ORDER NUMBER
                            </span>

                            <h3>
                              {order.orderNumber ||
                                "Order"}
                            </h3>

                            <p>
                              <FaCalendarAlt />
                              {formatDate(
                                order.createdAt
                              )}
                              <span>
                                {formatTime(
                                  order.createdAt
                                )}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div
                          className={`order-status ${status.className}`}
                        >
                          <StatusIcon />
                          {status.label}
                        </div>
                      </div>

                      {/* ORDER META */}
                      <div className="order-meta">

                        <div>
                          <span>ITEMS</span>
                          <strong>
                            {Array.isArray(
                              order.items
                            )
                              ? order.items.reduce(
                                  (
                                    total,
                                    item
                                  ) =>
                                    total +
                                    Number(
                                      item.quantity ||
                                        0
                                    ),
                                  0
                                )
                              : 0}
                          </strong>
                        </div>

                        <div>
                          <span>PAYMENT</span>

                          <strong>
                            {
                              PAYMENT_CONFIG[
                                order
                                  .paymentStatus
                              ]
                            ||
                              order.paymentStatus ||
                              "Pending"}
                          </strong>
                        </div>

                        <div>
                          <span>METHOD</span>

                          <strong>
                            {order.paymentMethod
                              ? order.paymentMethod
                                  .charAt(0)
                                  .toUpperCase() +
                                order.paymentMethod.slice(
                                  1
                                )
                              : "—"}
                          </strong>
                        </div>

                        <div className="order-total">
                          <span>TOTAL</span>

                          <strong>
                            {formatCurrency(
                              order.totalAmount
                            )}
                          </strong>
                        </div>

                      </div>

                      {/* EXPAND BUTTON */}
                      <button
                        className="view-order-btn"
                        onClick={() =>
                          toggleOrder(orderId)
                        }
                      >
                        {isExpanded
                          ? "Hide Details"
                          : "View Order Details"}

                        <FaArrowRight
                          className={
                            isExpanded
                              ? "rotate"
                              : ""
                          }
                        />
                      </button>

                      {/* ORDER DETAILS */}
                      {isExpanded && (
                        <motion.div
                          className="order-details"
                          initial={{
                            opacity: 0,
                            height: 0,
                          }}
                          animate={{
                            opacity: 1,
                            height: "auto",
                          }}
                        >
                          <div className="details-heading">
                            <div>
                              <span>
                                ORDER DETAILS
                              </span>

                              <h4>
                                Items in your order
                              </h4>
                            </div>
                          </div>

                          <div className="order-items">
                            {Array.isArray(
                              order.items
                            ) &&
                              order.items.map(
                                (item, itemIndex) => {
                                  const product =
                                    item.product;

                                  const image =
                                    product?.image;

                                  return (
                                    <div
                                      className="order-item"
                                      key={
                                        item._id ||
                                        `${orderId}-${itemIndex}`
                                      }
                                    >
                                      <div className="item-image">
                                        {image ? (
                                          <img
                                            src={image}
                                            alt={
                                              item.name ||
                                              "Ice cream"
                                            }
                                          />
                                        ) : (
                                          <FaIceCream />
                                        )}
                                      </div>

                                      <div className="item-info">
                                        <h5>
                                          {item.name ||
                                            product?.name ||
                                            "Ice Cream"}
                                        </h5>

                                        <span>
                                          {item.sku ||
                                            product?.sku ||
                                            "Product"}
                                        </span>
                                      </div>

                                      <div className="item-quantity">
                                        ×{" "}
                                        {item.quantity}
                                      </div>

                                      <div className="item-price">
                                        {formatCurrency(
                                          item.total
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                          </div>

                          {/* TOTAL BREAKDOWN */}
                          <div className="order-breakdown">
                            <div>
                              <span>
                                Subtotal
                              </span>

                              <strong>
                                {formatCurrency(
                                  order.subtotal
                                )}
                              </strong>
                            </div>

                            {Number(
                              order.discountAmount
                            ) > 0 && (
                              <div className="discount-row">
                                <span>
                                  Discount
                                </span>

                                <strong>
                                  -
                                  {formatCurrency(
                                    order.discountAmount
                                  )}
                                </strong>
                              </div>
                            )}

                            <div>
                              <span>
                                Tax
                              </span>

                              <strong>
                                {formatCurrency(
                                  order.taxAmount
                                )}
                              </strong>
                            </div>

                            <div className="grand-total">
                              <span>
                                Total
                              </span>

                              <strong>
                                {formatCurrency(
                                  order.totalAmount
                                )}
                              </strong>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.article>
                  );
                }
              )}
            </div>
          )}
      </div>
    </main>
  );
};

export default CustomerOrders;