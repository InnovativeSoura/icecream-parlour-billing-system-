// frontend/src/components/Navbar.jsx

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getDashboardPath = () => {
    if (user?.role === "admin") {
      return "/admin/dashboard";
    }

    if (user?.role === "staff") {
      return "/staff/dashboard";
    }

    return "/customer/dashboard";
  };

  return (
    <nav className="navbar">

      <div className="logo">
        🍦 IceCream Billing
      </div>

      <div className="nav-links">

        <NavLink to={getDashboardPath()}>
          Dashboard
        </NavLink>

        {(user?.role === "admin" || user?.role === "staff") && (
          <NavLink to="/products">
            Products
          </NavLink>
        )}

        {(user?.role === "admin" || user?.role === "staff") && (
          <NavLink to="/inventory">
            Inventory
          </NavLink>
        )}

        {(user?.role === "admin" || user?.role === "staff") && (
          <NavLink to="/customers">
            Customers
          </NavLink>
        )}

        <button
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </nav>
  );
};

export default Navbar;