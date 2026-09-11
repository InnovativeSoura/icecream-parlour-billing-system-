// frontend/src/components/CustomerLayout.jsx

import { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

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
  FaChevronRight,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";

import "./CustomerLayout.css";

const CustomerLayout = () => {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  /* =====================================================
     CUSTOMER NAME
  ===================================================== */

  const customerName =
    user?.name?.trim() ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Customer";

  /* =====================================================
     INITIALS
  ===================================================== */

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

  /* =====================================================
     CURRENT PAGE TITLE
  ===================================================== */

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/customer/dashboard") {
      return "Dashboard";
    }

    if (path === "/customer/products") {
      return "Browse Products";
    }

    if (path === "/customer/orders") {
      return "My Orders";
    }

    if (path === "/customer/cart") {
      return "My Cart";
    }

    if (path === "/customer/invoices") {
      return "Invoices";
    }

    if (path === "/customer/profile") {
      return "My Profile";
    }

    return "Customer Portal";
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {
    logout();
    navigate("/login", {
      replace: true,
    });
  };

  /* =====================================================
     MOBILE SIDEBAR
  ===================================================== */

  const openMobileSidebar = () => {
    setMobileSidebarOpen(true);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  /* =====================================================
     NAVIGATION ITEM
  ===================================================== */

  const navigationItems = [
    {
      path: "/customer/dashboard",
      label: "Dashboard",
      icon: FaBoxOpen,
    },
    {
      path: "/customer/products",
      label: "Browse Products",
      icon: FaIceCream,
    },
    {
      path: "/customer/orders",
      label: "My Orders",
      icon: FaShoppingBag,
    },
    {
      path: "/customer/cart",
      label: "My Cart",
      icon: FaCartPlus,
    },
    {
      path: "/customer/invoices",
      label: "Invoices",
      icon: FaReceipt,
    },
    {
      path: "/customer/profile",
      label: "My Profile",
      icon: FaUserCircle,
    },
  ];

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
          mobileSidebarOpen
            ? "mobile-open"
            : ""
        }`}
      >

        {/* =================================================
            SIDEBAR BRAND
        ================================================= */}

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

        {/* =================================================
            CUSTOMER PROFILE CARD
        ================================================= */}

        <div className="customer-sidebar-profile">

          <div className="customer-sidebar-avatar">
            {getInitials(customerName)}
          </div>

          <div className="customer-sidebar-profile-info">

            <strong>
              {customerName}
            </strong>

            <span>
              Customer Account
            </span>

          </div>

          <div className="customer-profile-status">
            <span />
          </div>

        </div>

        {/* =================================================
            MENU TITLE
        ================================================= */}

        <div className="customer-navigation-heading">
          <span>MAIN MENU</span>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="customer-navigation">

          {navigationItems.map(
            ({
              path,
              label,
              icon: Icon,
            }) => (
              <NavLink
                key={path}
                to={path}
                onClick={closeMobileSidebar}
                className={({ isActive }) =>
                  `customer-nav-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >

                <span className="customer-nav-icon">
                  <Icon />
                </span>

                <span className="customer-nav-label">
                  {label}
                </span>

                <span className="customer-nav-arrow">
                  <FaChevronRight />
                </span>

              </NavLink>
            )
          )}

        </nav>

        {/* =================================================
            SIDEBAR BOTTOM
        ================================================= */}

        <div className="customer-sidebar-bottom">

          <div className="customer-sidebar-divider" />

          <button
            type="button"
            className="customer-logout"
            onClick={handleLogout}
          >

            <span className="customer-logout-icon">
              <FaSignOutAlt />
            </span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="customer-main">

        {/* =================================================
            TOP NAVBAR
        ================================================= */}

        <header className="customer-topbar">

          {/* LEFT */}

          <div className="customer-topbar-left">

            {/* Mobile Menu */}

            <button
              type="button"
              className="customer-mobile-menu"
              onClick={openMobileSidebar}
              aria-label="Open navigation"
            >
              <FaBars />
            </button>

            {/* Mobile Brand */}

            <div className="customer-mobile-brand">

              <div className="customer-mobile-brand-icon">
                <FaIceCream />
              </div>

              <div className="customer-mobile-brand-text">

                <strong>
                  IceCream
                </strong>

                <span>
                  PARLOUR
                </span>

              </div>

            </div>

            {/* Desktop Page Heading */}

            <div className="customer-page-heading">

              <span>
                CUSTOMER PORTAL
              </span>

              <h1>
                {getPageTitle()}
              </h1>

            </div>

          </div>

          {/* =================================================
              TOPBAR RIGHT
          ================================================= */}

          <div className="customer-topbar-right">

            {/* Welcome */}

            <div className="customer-topbar-welcome">

              <span>
                Welcome back,
              </span>

              <strong>
                {customerName}
              </strong>

            </div>

            {/* Divider */}

            <div className="customer-topbar-divider" />

            {/* Profile */}

            <button
              type="button"
              className="customer-topbar-profile"
              onClick={() =>
                navigate(
                  "/customer/profile"
                )
              }
            >

              <div className="customer-avatar">

                {getInitials(
                  customerName
                )}

              </div>

              <div className="customer-profile-info">

                <strong>
                  {customerName}
                </strong>

                <span>
                  Customer
                </span>

              </div>

              <FaChevronRight
                className="customer-profile-chevron"
              />

            </button>

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