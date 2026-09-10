// frontend/src/pages/CustomerDashboard.jsx

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCartPlus,
  FaCheckCircle,
  FaClock,
  FaIceCream,
  FaReceipt,
  FaShoppingBag,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";


import "./CustomerDashboard.css";

const CustomerDashboard = () => {
  const { user } = useAuth();

  const customerName = useMemo(() => {
    return user?.name?.trim() || "Customer";
  }, [user]);

  const firstName = customerName.split(" ")[0];

  const stats = [
    {
      label: "Total Orders",
      value: "0",
      icon: FaShoppingBag,
      className: "orders",
    },
    {
      label: "Pending Orders",
      value: "0",
      icon: FaClock,
      className: "pending",
    },
    {
      label: "Completed Orders",
      value: "0",
      icon: FaCheckCircle,
      className: "completed",
    },
    {
      label: "Total Spent",
      value: "₹0",
      icon: FaReceipt,
      className: "spent",
    },
  ];

  const quickActions = [
    {
      title: "Order Ice Cream",
      description:
        "Explore our delicious ice creams and desserts.",
      icon: FaIceCream,
      path: "/customer/products",
    },
    {
      title: "View My Orders",
      description:
        "Track your current and previous orders.",
      icon: FaShoppingBag,
      path: "/customer/orders",
    },
    {
      title: "View Cart",
      description:
        "Review your selected items and checkout.",
      icon: FaCartPlus,
      path: "/customer/cart",
    },
  ];

  return (
      <div className="customer-dashboard-page">

        {/* =================================================
            WELCOME HERO
        ================================================= */}

        <motion.section
          className="customer-dashboard-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="customer-dashboard-hero-content">

            <span className="customer-dashboard-eyebrow">
              CUSTOMER PORTAL
            </span>

            <h1>
              Welcome back,{" "}
              <span>{firstName}!</span>
            </h1>

            <p>
              Treat yourself today. Discover your favourite ice
              creams, place an order, and enjoy every scoop.
            </p>

            <button
              type="button"
              className="customer-dashboard-primary-btn"
              onClick={() => {
                window.location.href =
                  "/customer/products";
              }}
            >
              <span>Explore Ice Creams</span>
              <FaArrowRight />
            </button>

          </div>

          {/* Hero Visual */}

          <div className="customer-dashboard-hero-visual">

            <div className="customer-dashboard-glow glow-one" />
            <div className="customer-dashboard-glow glow-two" />

            <div className="customer-dashboard-icecream-orbit">
              <div className="customer-dashboard-icecream-icon">
                <FaIceCream />
              </div>
            </div>

            <div className="customer-dashboard-floating-icon floating-one">
              🍨
            </div>

            <div className="customer-dashboard-floating-icon floating-two">
              🍦
            </div>

            <div className="customer-dashboard-floating-icon floating-three">
              🍧
            </div>

          </div>
        </motion.section>

        {/* =================================================
            ACTIVITY
        ================================================= */}

        <section className="customer-dashboard-section">

          <div className="customer-dashboard-section-heading">
            <div>
              <span>OVERVIEW</span>
              <h2>Your Activity</h2>
            </div>
          </div>

          <div className="customer-dashboard-stats">

            {stats.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <motion.div
                  key={stat.label}
                  className={`customer-dashboard-stat-card ${stat.className}`}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08,
                  }}
                  whileHover={{
                    y: -4,
                  }}
                >
                  <div className="customer-dashboard-stat-icon">
                    <Icon />
                  </div>

                  <div className="customer-dashboard-stat-details">
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>

                  <div className="customer-dashboard-stat-decoration" />
                </motion.div>
              );
            })}

          </div>

        </section>

        {/* =================================================
            QUICK ACCESS
        ================================================= */}

        <section className="customer-dashboard-section">

          <div className="customer-dashboard-section-heading">
            <div>
              <span>QUICK ACCESS</span>
              <h2>What would you like to do?</h2>
            </div>
          </div>

          <div className="customer-dashboard-actions">

            {quickActions.map((action, index) => {
              const Icon = action.icon;

              return (
                <motion.button
                  key={action.title}
                  type="button"
                  className="customer-dashboard-action-card"
                  onClick={() => {
                    window.location.href =
                      action.path;
                  }}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.1,
                  }}
                  whileHover={{
                    y: -5,
                  }}
                  whileTap={{
                    scale: 0.985,
                  }}
                >
                  <div className="customer-dashboard-action-icon">
                    <Icon />
                  </div>

                  <div className="customer-dashboard-action-content">
                    <h3>{action.title}</h3>

                    <p>
                      {action.description}
                    </p>
                  </div>

                  <div className="customer-dashboard-action-arrow">
                    <FaArrowRight />
                  </div>
                </motion.button>
              );
            })}

          </div>

        </section>

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <section className="customer-dashboard-section">

          <div className="customer-dashboard-section-heading customer-dashboard-orders-heading">

            <div>
              <span>ORDER HISTORY</span>
              <h2>Recent Orders</h2>
            </div>

            <button
              type="button"
              className="customer-dashboard-view-all"
              onClick={() => {
                window.location.href =
                  "/customer/orders";
              }}
            >
              <span>View All</span>
              <FaArrowRight />
            </button>

          </div>

          <div className="customer-dashboard-empty-orders">

            <div className="customer-dashboard-empty-icon">
              <FaShoppingBag />
            </div>

            <span className="customer-dashboard-empty-label">
              ORDER HISTORY
            </span>

            <h3>No orders yet</h3>

            <p>
              Your recent orders will appear here once
              you place your first order.
            </p>

            <button
              type="button"
              className="customer-dashboard-secondary-btn"
              onClick={() => {
                window.location.href =
                  "/customer/products";
              }}
            >
              <span>Start Shopping</span>
              <FaArrowRight />
            </button>

          </div>

        </section>

      </div>
  );
};

export default CustomerDashboard;