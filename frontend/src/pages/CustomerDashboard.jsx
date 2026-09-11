// frontend/src/pages/CustomerDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  FaArrowRight,
  FaBoxOpen,
  FaCartPlus,
  FaCheckCircle,
  FaClock,
  FaIceCream,
  FaReceipt,
  FaShoppingBag,
  FaSpinner,
  FaWallet,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";

import "./CustomerDashboard.css";

const CART_KEY = "icecream_cart";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(0);

  /* =====================================================
     CUSTOMER NAME
  ===================================================== */

  const customerName =
    user?.name?.trim() ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Customer";

  /* =====================================================
     CART COUNT
  ===================================================== */

  const getCartCount = () => {
    try {
      const storedCart = localStorage.getItem(CART_KEY);

      if (!storedCart) {
        return 0;
      }

      const parsedCart = JSON.parse(storedCart);

      if (!Array.isArray(parsedCart)) {
        return 0;
      }

      return parsedCart.reduce(
        (total, item) =>
          total + Number(item?.quantity || 1),
        0
      );
    } catch (error) {
      console.error("Failed to read cart:", error);
      return 0;
    }
  };

  useEffect(() => {
    const updateCartCount = () => {
      setCartCount(getCartCount());
    };

    updateCartCount();

    window.addEventListener(
      "cartUpdated",
      updateCartCount
    );

    window.addEventListener(
      "storage",
      updateCartCount
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        updateCartCount
      );

      window.removeEventListener(
        "storage",
        updateCartCount
      );
    };
  }, []);

  /* =====================================================
     GREETING
  ===================================================== */

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 18) {
      return "Good afternoon";
    }

    return "Good evening";
  }, []);

  /* =====================================================
     QUICK ACTIONS
  ===================================================== */

  const quickActions = [
    {
      title: "Order Ice Cream",
      description:
        "Explore delicious ice creams and desserts.",
      icon: <FaIceCream />,
      path: "/customer/products",
      className: "purple",
    },
    {
      title: "View My Orders",
      description:
        "Track your current and previous orders.",
      icon: <FaShoppingBag />,
      path: "/customer/orders",
      className: "blue",
    },
    {
      title: "View Cart",
      description:
        "Review your selected items and checkout.",
      icon: <FaCartPlus />,
      path: "/customer/cart",
      className: "pink",
    },
  ];

  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (
    <div className="customer-dashboard-page">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="customer-dashboard-glow glow-one" />
      <div className="customer-dashboard-glow glow-two" />
      <div className="customer-dashboard-glow glow-three" />

      <div className="customer-dashboard-container">

        {/* =================================================
            HERO
        ================================================= */}

        <motion.section
          className="customer-dashboard-hero"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.55,
            ease: "easeOut",
          }}
        >

          <div className="hero-content">

            <span className="hero-eyebrow">
              CUSTOMER PORTAL
            </span>

            <h1>
              {greeting},{" "}
              <strong>{customerName}!</strong>
            </h1>

            <p>
              Treat yourself today. Discover your favourite
              ice creams, place an order, and enjoy every scoop.
            </p>

            <motion.button
              type="button"
              className="hero-primary-button"
              onClick={() =>
                navigate("/customer/products")
              }
              whileHover={{
                y: -3,
                scale: 1.015,
              }}
              whileTap={{
                scale: 0.97,
              }}
            >
              <FaIceCream />

              <span>
                Explore Ice Cream
              </span>

              <FaArrowRight />
            </motion.button>

          </div>

          {/* Hero decoration */}

          <div className="hero-visual">

            <div className="hero-circle hero-circle-one" />

            <div className="hero-circle hero-circle-two" />

            <div className="hero-floating-icon hero-icon-one">
              <FaIceCream />
            </div>

            <div className="hero-floating-icon hero-icon-two">
              <FaShoppingBag />
            </div>

            <div className="hero-floating-icon hero-icon-three">
              <FaReceipt />
            </div>

            <div className="hero-main-icon">
              <FaIceCream />
            </div>

          </div>

        </motion.section>

        {/* =================================================
            ACTIVITY HEADER
        ================================================= */}

        <motion.div
          className="dashboard-section-heading"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <span>OVERVIEW</span>
            <h2>Your Activity</h2>
          </div>
        </motion.div>

        {/* =================================================
            STATS
        ================================================= */}

        <section className="customer-stats-grid">

          <motion.article
            className="customer-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ y: -4 }}
          >
            <div className="stat-icon purple">
              <FaShoppingBag />
            </div>

            <div className="stat-info">
              <span>Total Orders</span>
              <strong>0</strong>
            </div>

            <div className="stat-decoration" />
          </motion.article>


          <motion.article
            className="customer-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
          >
            <div className="stat-icon orange">
              <FaClock />
            </div>

            <div className="stat-info">
              <span>Pending Orders</span>
              <strong>0</strong>
            </div>

            <div className="stat-decoration" />
          </motion.article>


          <motion.article
            className="customer-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            whileHover={{ y: -4 }}
          >
            <div className="stat-icon green">
              <FaCheckCircle />
            </div>

            <div className="stat-info">
              <span>Completed Orders</span>
              <strong>0</strong>
            </div>

            <div className="stat-decoration" />
          </motion.article>


          <motion.article
            className="customer-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4 }}
            onClick={() =>
              navigate("/customer/cart")
            }
          >
            <div className="stat-icon pink">
              <FaWallet />
            </div>

            <div className="stat-info">
              <span>Cart Items</span>
              <strong>{cartCount}</strong>
            </div>

            <div className="stat-decoration" />
          </motion.article>

        </section>

        {/* =================================================
            QUICK ACCESS
        ================================================= */}

        <motion.div
          className="dashboard-section-heading quick-heading"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div>
            <span>QUICK ACCESS</span>
            <h2>What would you like to do?</h2>
          </div>
        </motion.div>


        <section className="customer-quick-grid">

          {quickActions.map((action, index) => (
            <motion.button
              type="button"
              key={action.title}
              className="customer-quick-card"
              onClick={() =>
                navigate(action.path)
              }
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.4 + index * 0.08,
              }}
              whileHover={{
                y: -4,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >

              <div
                className={`quick-icon ${action.className}`}
              >
                {action.icon}
              </div>

              <div className="quick-content">
                <strong>
                  {action.title}
                </strong>

                <span>
                  {action.description}
                </span>
              </div>

              <div className="quick-arrow">
                <FaArrowRight />
              </div>

            </motion.button>
          ))}

        </section>

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <motion.div
          className="dashboard-section-heading recent-heading"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >

          <div>
            <span>ORDER HISTORY</span>
            <h2>Recent Orders</h2>
          </div>

          <button
            type="button"
            className="view-all-button"
            onClick={() =>
              navigate("/customer/orders")
            }
          >
            View All
            <FaArrowRight />
          </button>

        </motion.div>


        <motion.section
          className="recent-orders-card"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.7,
          }}
        >

          <div className="recent-empty-icon">
            <FaBoxOpen />
          </div>

          <span className="recent-empty-label">
            ORDER HISTORY
          </span>

          <h3>
            No orders yet
          </h3>

          <p>
            Your recent orders will appear here once
            you place your first order.
          </p>

          <motion.button
            type="button"
            className="start-shopping-button"
            onClick={() =>
              navigate("/customer/products")
            }
            whileHover={{
              y: -2,
            }}
            whileTap={{
              scale: 0.97,
            }}
          >
            Start Shopping
            <FaArrowRight />
          </motion.button>

        </motion.section>

        {/* =================================================
            CART NOTICE
        ================================================= */}

        {cartCount > 0 && (
          <motion.button
            type="button"
            className="dashboard-cart-notice"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.8,
            }}
            onClick={() =>
              navigate("/customer/cart")
            }
            whileHover={{
              y: -3,
            }}
          >

            <div className="cart-notice-icon">
              <FaCartPlus />
            </div>

            <div className="cart-notice-content">
              <strong>
                You have {cartCount}{" "}
                {cartCount === 1
                  ? "item"
                  : "items"}{" "}
                in your cart
              </strong>

              <span>
                Continue your order whenever you're ready.
              </span>
            </div>

            <FaArrowRight className="cart-notice-arrow" />

          </motion.button>
        )}

      </div>
    </div>
  );
};

export default CustomerDashboard;