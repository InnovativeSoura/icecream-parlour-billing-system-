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
  FaSignOutAlt,
  FaShoppingBag,
  FaUserCircle,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import "./CustomerDashboard.css";

const CustomerDashboard = () => {
  const { user, logout } = useAuth();

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
      description: "Explore our delicious ice creams and desserts.",
      icon: FaIceCream,
      action: () => {
        window.location.href = "/customer/products";
      },
    },
    {
      title: "View My Orders",
      description: "Track your current and previous orders.",
      icon: FaShoppingBag,
      action: () => {
        window.location.href = "/customer/orders";
      },
    },
    {
      title: "View Cart",
      description: "Review your selected items and checkout.",
      icon: FaCartPlus,
      action: () => {
        window.location.href = "/customer/cart";
      },
    },
  ];

  return (
    <div className="customer-dashboard">
      {/* Sidebar */}
      <aside className="customer-sidebar">
        <div className="customer-brand">
          <div className="customer-brand-icon">
            <FaIceCream />
          </div>

          <div>
            <h2>IceCream</h2>
            <span>Parlour</span>
          </div>
        </div>

        <nav className="customer-navigation">
          <a
            href="/customer/dashboard"
            className="customer-nav-item active"
          >
            <FaBoxOpen />
            <span>Dashboard</span>
          </a>

          <a href="/customer/products" className="customer-nav-item">
            <FaIceCream />
            <span>Browse Products</span>
          </a>

          <a href="/customer/orders" className="customer-nav-item">
            <FaShoppingBag />
            <span>My Orders</span>
          </a>

          <a href="/customer/cart" className="customer-nav-item">
            <FaCartPlus />
            <span>My Cart</span>
          </a>

          <a href="/customer/invoices" className="customer-nav-item">
            <FaReceipt />
            <span>Invoices</span>
          </a>

          <a href="/customer/profile" className="customer-nav-item">
            <FaUserCircle />
            <span>My Profile</span>
          </a>
        </nav>

        <div className="customer-sidebar-bottom">
          <button
            type="button"
            className="customer-logout"
            onClick={logout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="customer-main">
        {/* Topbar */}
        <header className="customer-topbar">
          <div className="customer-mobile-brand">
            <div className="customer-brand-icon">
              <FaIceCream />
            </div>

            <span>IceCream Parlour</span>
          </div>

          <div className="customer-topbar-profile">
            <div className="customer-avatar">
              {customerName.charAt(0).toUpperCase()}
            </div>

            <div className="customer-profile-info">
              <strong>{customerName}</strong>
              <span>Customer</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <section className="customer-content">
          {/* Welcome Banner */}
          <motion.section
            className="customer-welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="customer-welcome-content">
              <span className="customer-welcome-label">
                CUSTOMER PORTAL
              </span>

              <h1>
                Welcome back, <span>{firstName}</span>!
              </h1>

              <p>
                Treat yourself today. Discover your favourite ice
                creams, place an order, and enjoy every scoop.
              </p>

              <button
                type="button"
                className="customer-primary-btn"
                onClick={() => {
                  window.location.href = "/customer/products";
                }}
              >
                Explore Ice Creams
                <FaArrowRight />
              </button>
            </div>

            <div className="customer-welcome-visual">
              <div className="customer-icecream-circle">
                <FaIceCream />
              </div>

              <div className="customer-floating-scoop scoop-one">
                🍨
              </div>

              <div className="customer-floating-scoop scoop-two">
                🍦
              </div>

              <div className="customer-floating-scoop scoop-three">
                🍧
              </div>
            </div>
          </motion.section>

          {/* Statistics */}
          <section className="customer-section">
            <div className="customer-section-heading">
              <div>
                <span>OVERVIEW</span>
                <h2>Your Activity</h2>
              </div>
            </div>

            <div className="customer-stats-grid">
              {stats.map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <motion.div
                    key={stat.label}
                    className={`customer-stat-card ${stat.className}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.08,
                    }}
                  >
                    <div className="customer-stat-icon">
                      <Icon />
                    </div>

                    <div className="customer-stat-details">
                      <span>{stat.label}</span>
                      <strong>{stat.value}</strong>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="customer-section">
            <div className="customer-section-heading">
              <div>
                <span>QUICK ACCESS</span>
                <h2>What would you like to do?</h2>
              </div>
            </div>

            <div className="customer-actions-grid">
              {quickActions.map((action, index) => {
                const Icon = action.icon;

                return (
                  <motion.button
                    type="button"
                    key={action.title}
                    className="customer-action-card"
                    onClick={action.action}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.1,
                    }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="customer-action-icon">
                      <Icon />
                    </div>

                    <div className="customer-action-content">
                      <h3>{action.title}</h3>
                      <p>{action.description}</p>
                    </div>

                    <div className="customer-action-arrow">
                      <FaArrowRight />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Recent Orders */}
          <section className="customer-section">
            <div className="customer-section-heading customer-orders-heading">
              <div>
                <span>ORDER HISTORY</span>
                <h2>Recent Orders</h2>
              </div>

              <button
                type="button"
                className="customer-view-all"
                onClick={() => {
                  window.location.href = "/customer/orders";
                }}
              >
                View All
                <FaArrowRight />
              </button>
            </div>

            <div className="customer-empty-orders">
              <div className="customer-empty-icon">
                <FaShoppingBag />
              </div>

              <h3>No orders yet</h3>

              <p>
                Your recent orders will appear here once you place
                your first order.
              </p>

              <button
                type="button"
                className="customer-secondary-btn"
                onClick={() => {
                  window.location.href = "/customer/products";
                }}
              >
                Start Shopping
                <FaArrowRight />
              </button>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default CustomerDashboard;