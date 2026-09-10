import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaExclamationCircle,
  FaFilter,
  FaIceCream,
  FaReceipt,
  FaRedo,
  FaRupeeSign,
  FaSearch,
  FaShoppingBag,
  FaTimesCircle,
  FaTruck,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import api from "../../api/api";
import "./MyOrders.css";

const MyOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/orders/my-orders");

      const receivedOrders =
        response?.data?.orders ||
        response?.data?.data ||
        [];

      setOrders(
        Array.isArray(receivedOrders)
          ? receivedOrders
          : []
      );
    } catch (error) {
      console.error("Customer orders error:", error);

      setOrders([]);

      if (error?.response?.status !== 404) {
        toast.error(
          error?.response?.data?.message ||
            "Unable to load your orders"
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOrderNumber = (order) => {
    return (
      order?.orderNumber ||
      order?.invoiceNumber ||
      `#${String(order?._id || "").slice(-8).toUpperCase()}`
    );
  };

  const getStatusClass = (status) => {
    const normalized = String(status || "")
      .toLowerCase()
      .replace(/\s+/g, "_");

    if (
      [
        "completed",
        "confirmed",
        "paid",
      ].includes(normalized)
    ) {
      return "success";
    }

    if (
      [
        "pending",
        "processing",
        "draft",
      ].includes(normalized)
    ) {
      return "warning";
    }

    if (
      [
        "cancelled",
        "canceled",
        "failed",
        "refunded",
      ].includes(normalized)
    ) {
      return "danger";
    }

    return "neutral";
  };

  const getStatusIcon = (status) => {
    const normalized = String(status || "")
      .toLowerCase()
      .replace(/\s+/g, "_");

    if (
      [
        "completed",
        "confirmed",
        "paid",
      ].includes(normalized)
    ) {
      return <FaCheckCircle />;
    }

    if (
      [
        "pending",
        "processing",
        "draft",
      ].includes(normalized)
    ) {
      return <FaClock />;
    }

    if (
      [
        "cancelled",
        "canceled",
        "failed",
        "refunded",
      ].includes(normalized)
    ) {
      return <FaTimesCircle />;
    }

    return <FaExclamationCircle />;
  };

  const getPaymentStatus = (order) => {
    return (
      order?.paymentStatus ||
      order?.payment?.status ||
      "pending"
    );
  };

  const getOrderStatus = (order) => {
    return order?.status || "pending";
  };

  const getItemsCount = (order) => {
    if (!Array.isArray(order?.items)) return 0;

    return order.items.reduce(
      (total, item) =>
        total + Number(item?.quantity || 0),
      0
    );
  };

  const stats = useMemo(() => {
    const total = orders.length;

    const pending = orders.filter((order) =>
      ["pending", "processing", "draft"].includes(
        String(order?.status || "").toLowerCase()
      )
    ).length;

    const completed = orders.filter((order) =>
      ["completed", "confirmed"].includes(
        String(order?.status || "").toLowerCase()
      )
    ).length;

    const cancelled = orders.filter((order) =>
      ["cancelled", "canceled", "refunded"].includes(
        String(order?.status || "").toLowerCase()
      )
    ).length;

    return {
      total,
      pending,
      completed,
      cancelled,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const orderStatus = String(
        order?.status || ""
      ).toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" &&
          ["pending", "processing", "draft"].includes(
            orderStatus
          )) ||
        (statusFilter === "completed" &&
          ["completed", "confirmed"].includes(
            orderStatus
          )) ||
        (statusFilter === "cancelled" &&
          ["cancelled", "canceled", "refunded"].includes(
            orderStatus
          ));

      const orderNumber = getOrderNumber(order)
        .toLowerCase();

      const matchesSearch =
        !query ||
        orderNumber.includes(query) ||
        String(order?.status || "")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const toggleOrder = (orderId) => {
    setExpandedOrder((current) =>
      current === orderId ? null : orderId
    );
  };

  const handleBrowseProducts = () => {
    navigate("/customer/products");
  };

  const handleViewCart = () => {
    navigate("/customer/cart");
  };

  return (
    <div className="customer-orders-page">
      <div className="orders-background-glow orders-glow-one" />
      <div className="orders-background-glow orders-glow-two" />

      <main className="customer-orders-content">
        {/* Header */}
        <motion.section
          className="orders-page-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <span className="orders-eyebrow">
              <FaReceipt />
              ORDER HISTORY
            </span>

            <h1>My Orders</h1>

            <p>
              Track your ice cream orders, view payment
              details, and revisit your order history.
            </p>
          </div>

          <motion.button
            type="button"
            className="orders-shop-button"
            onClick={handleBrowseProducts}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaIceCream />
            Order Ice Cream
            <FaArrowRight />
          </motion.button>
        </motion.section>

        {/* Statistics */}
        <motion.section
          className="orders-stat-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.08,
          }}
        >
          <div className="order-stat-card total">
            <div className="order-stat-icon">
              <FaShoppingBag />
            </div>

            <div>
              <span>Total Orders</span>
              <strong>{stats.total}</strong>
            </div>
          </div>

          <div className="order-stat-card pending">
            <div className="order-stat-icon">
              <FaClock />
            </div>

            <div>
              <span>Pending</span>
              <strong>{stats.pending}</strong>
            </div>
          </div>

          <div className="order-stat-card completed">
            <div className="order-stat-icon">
              <FaCheckCircle />
            </div>

            <div>
              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </div>
          </div>

          <div className="order-stat-card cancelled">
            <div className="order-stat-icon">
              <FaTimesCircle />
            </div>

            <div>
              <span>Cancelled</span>
              <strong>{stats.cancelled}</strong>
            </div>
          </div>
        </motion.section>

        {/* Filters */}
        <motion.section
          className="orders-toolbar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.15,
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

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <FaTimesCircle />
              </button>
            )}
          </div>

          <div className="orders-filter">
            <FaFilter />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="completed">
                Completed
              </option>
              <option value="cancelled">
                Cancelled
              </option>
            </select>

            <FaChevronDown />
          </div>
        </motion.section>

        {/* Orders */}
        <motion.section
          className="orders-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.2,
          }}
        >
          <div className="orders-section-heading">
            <div>
              <span className="section-label">
                YOUR HISTORY
              </span>

              <h2>
                {statusFilter === "all"
                  ? "Recent Orders"
                  : `${statusFilter
                      .charAt(0)
                      .toUpperCase()}${statusFilter.slice(
                      1
                    )} Orders`}
              </h2>
            </div>

            <span className="orders-count">
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1
                ? "order"
                : "orders"}
            </span>
          </div>

          {loading ? (
            <div className="orders-loading">
              <div className="loading-spinner">
                <FaRedo />
              </div>

              <h3>Loading your orders...</h3>

              <p>
                Please wait while we retrieve your
                order history.
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              className="orders-empty"
              initial={{
                opacity: 0,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
            >
              <div className="empty-icon">
                <FaBoxOpen />
              </div>

              <h3>
                {orders.length === 0
                  ? "No orders yet"
                  : "No matching orders"}
              </h3>

              <p>
                {orders.length === 0
                  ? "Your delicious ice cream orders will appear here once you place your first order."
                  : "Try changing your search or order status filter."}
              </p>

              {orders.length === 0 ? (
                <button
                  type="button"
                  onClick={handleBrowseProducts}
                  className="empty-action"
                >
                  <FaIceCream />
                  Start Shopping
                  <FaArrowRight />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="empty-action secondary"
                >
                  Clear Filters
                </button>
              )}
            </motion.div>
          ) : (
            <div className="orders-list">
              <AnimatePresence>
                {filteredOrders.map(
                  (order, index) => {
                    const orderId = order?._id;
                    const orderStatus =
                      getOrderStatus(order);
                    const paymentStatus =
                      getPaymentStatus(order);
                    const statusClass =
                      getStatusClass(orderStatus);
                    const paymentClass =
                      getStatusClass(paymentStatus);
                    const isExpanded =
                      expandedOrder === orderId;

                    return (
                      <motion.article
                        key={orderId || index}
                        className={`customer-order-card ${
                          isExpanded
                            ? "expanded"
                            : ""
                        }`}
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
                          duration: 0.35,
                          delay: index * 0.04,
                        }}
                      >
                        <div className="order-card-main">
                          <div className="order-card-icon">
                            <FaIceCream />
                          </div>

                          <div className="order-main-info">
                            <div className="order-title-row">
                              <h3>
                                {getOrderNumber(
                                  order
                                )}
                              </h3>

                              <span
                                className={`order-status ${statusClass}`}
                              >
                                {getStatusIcon(
                                  orderStatus
                                )}
                                {String(
                                  orderStatus
                                )
                                  .replace(
                                    /_/g,
                                    " "
                                  )
                                  .replace(
                                    /\b\w/g,
                                    (letter) =>
                                      letter.toUpperCase()
                                  )}
                              </span>
                            </div>

                            <div className="order-meta">
                              <span>
                                <FaCalendarAlt />
                                {formatDate(
                                  order?.createdAt
                                )}
                              </span>

                              <span>
                                {formatTime(
                                  order?.createdAt
                                )}
                              </span>

                              <span>
                                <FaShoppingBag />
                                {getItemsCount(
                                  order
                                )}{" "}
                                {getItemsCount(
                                  order
                                ) === 1
                                  ? "item"
                                  : "items"}
                              </span>
                            </div>
                          </div>

                          <div className="order-total">
                            <span>Total</span>
                            <strong>
                              {formatCurrency(
                                order?.total
                              )}
                            </strong>
                          </div>

                          <button
                            type="button"
                            className="order-expand-button"
                            onClick={() =>
                              toggleOrder(orderId)
                            }
                            aria-label={
                              isExpanded
                                ? "Hide order details"
                                : "View order details"
                            }
                          >
                            {isExpanded ? (
                              <FaChevronUp />
                            ) : (
                              <FaChevronDown />
                            )}
                          </button>
                        </div>

                        <AnimatePresence>
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
                              <div className="order-details-inner">
                                <div className="order-detail-top">
                                  <div>
                                    <span>
                                      Order placed
                                    </span>
                                    <strong>
                                      {formatDate(
                                        order?.createdAt
                                      )}
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Payment
                                    </span>

                                    <strong
                                      className={`payment-status ${paymentClass}`}
                                    >
                                      {getStatusIcon(
                                        paymentStatus
                                      )}
                                      {String(
                                        paymentStatus
                                      )
                                        .replace(
                                          /_/g,
                                          " "
                                        )
                                        .replace(
                                          /\b\w/g,
                                          (letter) =>
                                            letter.toUpperCase()
                                        )}
                                    </strong>
                                  </div>
                                </div>

                                <div className="order-items">
                                  <div className="order-items-heading">
                                    <h4>
                                      Order Items
                                    </h4>

                                    <span>
                                      {getItemsCount(
                                        order
                                      )}{" "}
                                      items
                                    </span>
                                  </div>

                                  {Array.isArray(
                                    order?.items
                                  ) &&
                                  order.items
                                    .length > 0 ? (
                                    order.items.map(
                                      (
                                        item,
                                        itemIndex
                                      ) => (
                                        <div
                                          className="order-item"
                                          key={
                                            item?._id ||
                                            item?.product ||
                                            itemIndex
                                          }
                                        >
                                          <div className="order-item-image">
                                            {item?.image ? (
                                              <img
                                                src={
                                                  item.image
                                                }
                                                alt={
                                                  item?.name ||
                                                  "Ice cream"
                                                }
                                              />
                                            ) : (
                                              <FaIceCream />
                                            )}
                                          </div>

                                          <div className="order-item-info">
                                            <strong>
                                              {item?.name ||
                                                "Ice Cream"}
                                            </strong>

                                            <span>
                                              Qty:{" "}
                                              {Number(
                                                item?.quantity ||
                                                  0
                                              )}
                                            </span>
                                          </div>

                                          <div className="order-item-price">
                                            {formatCurrency(
                                              item?.total ??
                                                item?.subtotal ??
                                                Number(
                                                  item?.unitPrice ||
                                                    0
                                                ) *
                                                  Number(
                                                    item?.quantity ||
                                                      0
                                                  )
                                            )}
                                          </div>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <div className="no-items">
                                      Order item
                                      information is
                                      unavailable.
                                    </div>
                                  )}
                                </div>

                                <div className="order-summary">
                                  <div>
                                    <span>
                                      Subtotal
                                    </span>

                                    <strong>
                                      {formatCurrency(
                                        order?.subtotal
                                      )}
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Discount
                                    </span>

                                    <strong>
                                      {formatCurrency(
                                        order?.discount
                                      )}
                                    </strong>
                                  </div>

                                  <div>
                                    <span>
                                      Tax
                                    </span>

                                    <strong>
                                      {formatCurrency(
                                        order?.tax
                                      )}
                                    </strong>
                                  </div>

                                  <div className="summary-total">
                                    <span>
                                      Grand Total
                                    </span>

                                    <strong>
                                      <FaRupeeSign />
                                      {Number(
                                        order?.total ||
                                          0
                                      ).toLocaleString(
                                        "en-IN",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.article>
                    );
                  }
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.section>

        {/* Bottom CTA */}
        {!loading && orders.length > 0 && (
          <motion.section
            className="orders-bottom-cta"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,
            }}
          >
            <div className="bottom-cta-icon">
              <FaIceCream />
            </div>

            <div>
              <h3>Craving something delicious?</h3>
              <p>
                Explore our menu and add your next
                favourite flavour to the cart.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBrowseProducts}
            >
              Browse Products
              <FaArrowRight />
            </button>
          </motion.section>
        )}
      </main>
    </div>
  );
};

export default MyOrders;