// frontend/src/pages/AdminDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";

import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);

  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const results = await Promise.allSettled([
          api.get("/products"),
          api.get("/inventory"),
          api.get("/customers"),
        ]);

        if (!mounted) return;

        const productResponse = results[0];
        const inventoryResponse = results[1];
        const customerResponse = results[2];

        if (productResponse.status === "fulfilled") {
          const data = productResponse.value?.data;

          setProducts(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.products)
              ? data.products
              : Array.isArray(data?.data)
              ? data.data
              : []
          );
        }

        if (inventoryResponse.status === "fulfilled") {
          const data = inventoryResponse.value?.data;

          setInventory(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.inventory)
              ? data.inventory
              : Array.isArray(data?.data)
              ? data.data
              : []
          );
        }

        if (customerResponse.status === "fulfilled") {
          const data = customerResponse.value?.data;

          setCustomers(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.customers)
              ? data.customers
              : Array.isArray(data?.data)
              ? data.data
              : []
          );
        }
      } catch (error) {
        console.error("Dashboard data error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // USER DATA
  // =====================================================

  const userName =
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Administrator";

  const userRole = user?.role || "admin";

  const getInitials = (name) => {
    if (!name) return "AD";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const initials = getInitials(userName);

  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================

  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => {
      if (typeof product.isActive === "boolean") {
        return product.isActive;
      }

      if (typeof product.active === "boolean") {
        return product.active;
      }

      return true;
    });

    let lowStock = 0;

    inventory.forEach((item) => {
      const quantity =
        Number(item.quantity) ||
        Number(item.currentStock) ||
        Number(item.stock) ||
        0;

      const minimum =
        Number(item.reorderLevel) ||
        Number(item.minStock) ||
        Number(item.minimumStock) ||
        5;

      if (quantity <= minimum) {
        lowStock += 1;
      }
    });

    return {
      products: activeProducts.length,
      customers: customers.length,
      inventory: inventory.length,
      lowStock,
    };
  }, [products, inventory, customers]);

  // =====================================================
  // LOW STOCK ITEMS
  // =====================================================

  const lowStockItems = useMemo(() => {
    return inventory
      .map((item) => {
        const quantity =
          Number(item.quantity) ||
          Number(item.currentStock) ||
          Number(item.stock) ||
          0;

        const minimum =
          Number(item.reorderLevel) ||
          Number(item.minStock) ||
          Number(item.minimumStock) ||
          5;

        return {
          ...item,
          calculatedQuantity: quantity,
          calculatedMinimum: minimum,
        };
      })
      .filter(
        (item) => item.calculatedQuantity <= item.calculatedMinimum
      )
      .slice(0, 5);
  }, [inventory]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // =====================================================
  // DATE
  // =====================================================

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="admin-dashboard">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="admin-sidebar">

        <div className="sidebar-brand">
          <div className="brand-icon">
            🍦
          </div>

          <div>
            <h2>IceCream</h2>
            <span>Billing System</span>
          </div>
        </div>

        <div className="sidebar-section-title">
          MAIN MENU
        </div>

        <nav className="admin-navigation">

          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">⌂</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">▣</span>
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">▤</span>
            <span>Inventory</span>
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">♙</span>
            <span>Customers</span>
          </NavLink>

        </nav>

        <div className="sidebar-section-title management-title">
          MANAGEMENT
        </div>

        <div className="admin-nav-link disabled-link">
          <span className="nav-icon">◴</span>
          <span>Orders</span>
          <small>Coming soon</small>
        </div>

        <div className="admin-nav-link disabled-link">
          <span className="nav-icon">▥</span>
          <span>Reports</span>
          <small>Coming soon</small>
        </div>

        {/* SIDEBAR PROFILE */}

        <div className="sidebar-bottom">

          <div className="sidebar-profile">

            <div className="profile-avatar">
              {initials}
            </div>

            <div className="profile-info">
              <strong>{userName}</strong>
              <span>Administrator</span>
            </div>

          </div>

          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="admin-main">

        {/* TOP HEADER */}

        <header className="admin-topbar">

          <div className="topbar-left">

            <div className="mobile-brand">
              🍦
            </div>

            <div>
              <span className="topbar-label">
                ADMINISTRATOR
              </span>

              <h1>
                Dashboard
              </h1>
            </div>

          </div>

          <div className="topbar-right">

            <div className="date-display">
              <span className="date-icon">
                ◷
              </span>

              <span>
                {formattedDate}
              </span>
            </div>

            <div className="topbar-profile">

              <div className="topbar-avatar">
                {initials}
              </div>

              <div className="topbar-user">
                <strong>{userName}</strong>
                <span>{userRole}</span>
              </div>

            </div>

          </div>

        </header>

        {/* DASHBOARD BODY */}

        <section className="dashboard-content">

          {/* WELCOME */}

          <div className="welcome-section">

            <div>
              <span className="welcome-label">
                OVERVIEW
              </span>

              <h2>
                Welcome back, {userName.split(" ")[0]} 👋
              </h2>

              <p>
                Here's what's happening with your ice cream
                parlour today.
              </p>
            </div>

            <button
              className="primary-dashboard-button"
              onClick={() => navigate("/products")}
            >
              <span>＋</span>
              Manage Products
            </button>

          </div>

          {/* STAT CARDS */}

          <div className="dashboard-stat-grid">

            {/* PRODUCTS */}

            <div className="dashboard-stat-card">

              <div className="stat-card-top">

                <div className="stat-icon stat-icon-products">
                  🍨
                </div>

                <span className="stat-status">
                  ACTIVE
                </span>

              </div>

              <div className="stat-number">
                {loading ? "—" : stats.products}
              </div>

              <div className="stat-label">
                Total Products
              </div>

              <div className="stat-footer">
                <span className="stat-trend">●</span>
                Available in catalogue
              </div>

            </div>

            {/* CUSTOMERS */}

            <div className="dashboard-stat-card">

              <div className="stat-card-top">

                <div className="stat-icon stat-icon-customers">
                  ♙
                </div>

                <span className="stat-status">
                  USERS
                </span>

              </div>

              <div className="stat-number">
                {loading ? "—" : stats.customers}
              </div>

              <div className="stat-label">
                Registered Customers
              </div>

              <div className="stat-footer">
                <span className="stat-trend">●</span>
                Customer database
              </div>

            </div>

            {/* INVENTORY */}

            <div className="dashboard-stat-card">

              <div className="stat-card-top">

                <div className="stat-icon stat-icon-inventory">
                  📦
                </div>

                <span className="stat-status">
                  STOCK
                </span>

              </div>

              <div className="stat-number">
                {loading ? "—" : stats.inventory}
              </div>

              <div className="stat-label">
                Inventory Items
              </div>

              <div className="stat-footer">
                <span className="stat-trend">●</span>
                Stock records
              </div>

            </div>

            {/* LOW STOCK */}

            <div className="dashboard-stat-card">

              <div className="stat-card-top">

                <div className="stat-icon stat-icon-warning">
                  ⚠
                </div>

                <span className="stat-status warning">
                  ATTENTION
                </span>

              </div>

              <div className="stat-number">
                {loading ? "—" : stats.lowStock}
              </div>

              <div className="stat-label">
                Low Stock Items
              </div>

              <div className="stat-footer">
                <span className="stat-trend warning-dot">
                  ●
                </span>
                Requires attention
              </div>

            </div>

          </div>

          {/* MAIN DASHBOARD GRID */}

          <div className="dashboard-main-grid">

            {/* QUICK ACTIONS */}

            <section className="dashboard-panel">

              <div className="panel-header">

                <div>
                  <span className="panel-eyebrow">
                    WORKSPACE
                  </span>

                  <h3>
                    Quick Actions
                  </h3>
                </div>

                <span className="panel-header-icon">
                  ✦
                </span>

              </div>

              <div className="quick-actions">

                <button
                  className="quick-action"
                  onClick={() => navigate("/products")}
                >
                  <div className="quick-action-icon">
                    🍦
                  </div>

                  <div>
                    <strong>
                      Products
                    </strong>

                    <span>
                      Manage ice cream catalogue
                    </span>
                  </div>

                  <b>→</b>
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate("/inventory")}
                >
                  <div className="quick-action-icon">
                    📦
                  </div>

                  <div>
                    <strong>
                      Inventory
                    </strong>

                    <span>
                      Monitor stock levels
                    </span>
                  </div>

                  <b>→</b>
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate("/customers")}
                >
                  <div className="quick-action-icon">
                    👥
                  </div>

                  <div>
                    <strong>
                      Customers
                    </strong>

                    <span>
                      View customer records
                    </span>
                  </div>

                  <b>→</b>
                </button>

              </div>

            </section>

            {/* SYSTEM STATUS */}

            <section className="dashboard-panel system-panel">

              <div className="panel-header">

                <div>
                  <span className="panel-eyebrow">
                    SYSTEM
                  </span>

                  <h3>
                    System Status
                  </h3>
                </div>

                <span className="system-live">
                  ● LIVE
                </span>

              </div>

              <div className="system-status-list">

                <div className="system-status-item">

                  <div className="status-indicator">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Application
                    </strong>

                    <span>
                      System operational
                    </span>
                  </div>

                  <em>
                    Online
                  </em>

                </div>

                <div className="system-status-item">

                  <div className="status-indicator">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Authentication
                    </strong>

                    <span>
                      Secure session active
                    </span>
                  </div>

                  <em>
                    Secure
                  </em>

                </div>

                <div className="system-status-item">

                  <div className="status-indicator">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Database
                    </strong>

                    <span>
                      Data services connected
                    </span>
                  </div>

                  <em>
                    Connected
                  </em>

                </div>

              </div>

            </section>

          </div>

          {/* INVENTORY ALERTS */}

          <section className="dashboard-panel inventory-panel">

            <div className="panel-header">

              <div>
                <span className="panel-eyebrow">
                  INVENTORY
                </span>

                <h3>
                  Stock Alerts
                </h3>
              </div>

              <button
                className="panel-link"
                onClick={() => navigate("/inventory")}
              >
                View Inventory →
              </button>

            </div>

            {loading ? (

              <div className="dashboard-empty">
                <div className="empty-loader" />
                <p>
                  Loading inventory...
                </p>
              </div>

            ) : lowStockItems.length === 0 ? (

              <div className="dashboard-empty success-empty">

                <div className="empty-success-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    Inventory looks healthy
                  </strong>

                  <p>
                    No low-stock items require immediate
                    attention.
                  </p>
                </div>

              </div>

            ) : (

              <div className="stock-list">

                {lowStockItems.map((item, index) => {

                  const productName =
                    item.product?.name ||
                    item.productName ||
                    item.name ||
                    `Inventory Item ${index + 1}`;

                  return (
                    <div
                      className="stock-row"
                      key={
                        item._id ||
                        item.id ||
                        index
                      }
                    >

                      <div className="stock-product-icon">
                        🍨
                      </div>

                      <div className="stock-product-info">

                        <strong>
                          {productName}
                        </strong>

                        <span>
                          Minimum level:{" "}
                          {item.calculatedMinimum}
                        </span>

                      </div>

                      <div className="stock-quantity">
                        <strong>
                          {item.calculatedQuantity}
                        </strong>

                        <span>
                          remaining
                        </span>
                      </div>

                      <span className="low-stock-badge">
                        LOW STOCK
                      </span>

                    </div>
                  );
                })}

              </div>

            )}

          </section>

          {/* FOOTER */}

          <footer className="dashboard-footer">

            <div>
              <strong>
                🍦 IceCream Billing System
              </strong>

              <span>
                Admin Control Center
              </span>
            </div>

            <span>
              © {new Date().getFullYear()} All rights reserved.
            </span>

          </footer>

        </section>

      </main>

    </div>
  );
};

export default AdminDashboard;