// frontend/src/components/CustomerLayout.jsx

import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBoxOpen,
  FaCartPlus,
  FaIceCream,
  FaReceipt,
  FaSignOutAlt,
  FaShoppingBag,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import "./CustomerLayout.css";

const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const customerName =
    user?.name?.trim() ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Customer";

  const getInitials = (name) => {
    if (!name) return "CU";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="customer-layout">

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileSidebarOpen && (
        <button
          type="button"
          className="customer-sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeMobileSidebar}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`customer-sidebar ${
          mobileSidebarOpen ? "mobile-open" : ""
        }`}
      >

        {/* Brand */}

        <div className="customer-brand">

          <div className="customer-brand-icon">
            <FaIceCream />
          </div>

          <div className="customer-brand-text">
            <h2>IceCream</h2>
            <span>PARLOUR</span>
          </div>

          <button
            type="button"
            className="customer-mobile-close"
            onClick={closeMobileSidebar}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>

        </div>

        {/* Profile */}

        <div className="customer-sidebar-profile">

          <div className="customer-sidebar-avatar">
            {getInitials(customerName)}
          </div>

          <div className="customer-sidebar-profile-info">
            <strong>{customerName}</strong>
            <span>Customer</span>
          </div>

        </div>

        {/* Navigation */}

        <nav className="customer-navigation">

          <NavLink
            to="/customer/dashboard"
            onClick={closeMobileSidebar}
            className={({ isActive }) =>
              `customer-nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <FaBoxOpen />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/customer/products"
            onClick={closeMobileSidebar}
            className={({ isActive }) =>
              `customer-nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <FaIceCream />
            <span>Browse Products</span>
          </NavLink>

          <NavLink
            to="/customer/orders"
            onClick={closeMobileSidebar}
            className={({ isActive }) =>
              `customer-nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <FaShoppingBag />
            <span>My Orders</span>
          </NavLink>

          <NavLink
            to="/customer/cart"
            onClick={closeMobileSidebar}
            className={({ isActive }) =>
              `customer-nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <FaCartPlus />
            <span>My Cart</span>
          </NavLink>

          <NavLink
            to="/customer/invoices"
            onClick={closeMobileSidebar}
            className={({ isActive }) =>
              `customer-nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <FaReceipt />
            <span>Invoices</span>
          </NavLink>

          <NavLink
            to="/customer/profile"
            onClick={closeMobileSidebar}
            className={({ isActive }) =>
              `customer-nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <FaUserCircle />
            <span>My Profile</span>
          </NavLink>

        </nav>

        {/* Logout */}

        <div className="customer-sidebar-bottom">

          <button
            type="button"
            className="customer-logout"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="customer-main">

        {/* =================================================
            TOPBAR
        ================================================= */}

        <header className="customer-topbar">

          <div className="customer-topbar-left">

            <button
              type="button"
              className="customer-mobile-menu"
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              aria-label="Open navigation"
            >
              <FaBars />
            </button>

            <div className="customer-mobile-brand">

              <div className="customer-brand-icon">
                <FaIceCream />
              </div>

              <div>
                <strong>IceCream</strong>
                <span>Parlour</span>
              </div>

            </div>

          </div>

          {/* Profile */}

          <div className="customer-topbar-profile">

            <div className="customer-avatar">
              {getInitials(customerName)}
            </div>

            <div className="customer-profile-info">
              <strong>{customerName}</strong>
              <span>Customer</span>
            </div>

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="customer-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default CustomerLayout;