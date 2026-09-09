// frontend/src/components/Sidebar.jsx

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userName =
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Administrator";

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

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">

      {/* BRAND */}

      <div className="sidebar-brand">

        <div className="sidebar-logo">
          🍦
        </div>

        <div>
          <strong>
            IceCream
          </strong>

          <span>
            Billing System
          </span>
        </div>

      </div>

      {/* PROFILE */}

      <div className="sidebar-user">

        <div className="sidebar-user-avatar">
          {getInitials(userName)}
        </div>

        <div className="sidebar-user-info">
          <strong>
            {userName}
          </strong>

          <span>
            {user?.role || "User"}
          </span>
        </div>

      </div>

      {/* NAVIGATION */}

      <div className="sidebar-title">
        MENU
      </div>

      <nav className="sidebar-navigation">

        <NavLink
          to={
            user?.role === "admin"
              ? "/admin/dashboard"
              : user?.role === "staff"
              ? "/staff/dashboard"
              : "/customer/dashboard"
          }
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span>⌂</span>
          Dashboard
        </NavLink>

        {(user?.role === "admin" ||
          user?.role === "staff") && (
          <>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span>▣</span>
              Products
            </NavLink>

            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span>▤</span>
              Inventory
            </NavLink>

            <NavLink
              to="/customers"
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span>♙</span>
              Customers
            </NavLink>
          </>
        )}

      </nav>

      {/* LOGOUT */}

      <div className="sidebar-footer">

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <span>↪</span>
          Logout
        </button>

      </div>

    </aside>
  );
};

export default Sidebar;