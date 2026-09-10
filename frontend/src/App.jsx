import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// =====================================================
// PUBLIC PAGES
// =====================================================

import Login from "./pages/Login";
import Register from "./pages/Register";

// =====================================================
// DASHBOARDS
// =====================================================

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import CustomerDashboard from "./pages/CustomerDashboard.jsx";

// =====================================================
// ADMIN / STAFF
// =====================================================

import Products from "./pages/Products.jsx";
import Inventory from "./pages/Inventory.jsx";
import Customer from "./pages/Customers.jsx";

// =====================================================
// AUTH
// =====================================================

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

// =====================================================
// CUSTOMER PLACEHOLDER
// =====================================================

const CustomerPagePlaceholder = ({ title, description }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "30px",
        background: "#f7f8fc",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "550px",
          padding: "45px",
          textAlign: "center",
          background: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 20px",
            display: "grid",
            placeItems: "center",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, #7657e8, #d16d9b)",
            color: "#ffffff",
            fontSize: "26px",
            fontWeight: "800",
          }}
        >
          🍦
        </div>

        <h1
          style={{
            margin: "0 0 12px",
            color: "#292c3d",
            fontSize: "26px",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: "0 0 25px",
            color: "#8d91a5",
            fontSize: "14px",
            lineHeight: "1.7",
          }}
        >
          {description}
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/customer/dashboard";
          }}
          style={{
            border: "none",
            padding: "12px 20px",
            borderRadius: "12px",
            background: "#7657e8",
            color: "#ffffff",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

// =====================================================
// HOME REDIRECT
// =====================================================

const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user.role === "admin") {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  if (user.role === "staff") {
    return (
      <Navigate
        to="/staff/dashboard"
        replace
      />
    );
  }

  if (user.role === "customer") {
    return (
      <Navigate
        to="/customer/dashboard"
        replace
      />
    );
  }

  return (
    <Navigate
      to="/login"
      replace
    />
  );
};

// =====================================================
// APP
// =====================================================

const App = () => {
  return (
    <>
      <Routes>

        {/* =================================================
            PUBLIC
        ================================================= */}

        <Route
          path="/"
          element={<HomeRedirect />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =================================================
            ADMIN
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            />
          }
        >
          <Route
            path="/admin"
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />
        </Route>

        {/* =================================================
            STAFF
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["staff"]}
            />
          }
        >
          <Route
            path="/staff"
            element={
              <Navigate
                to="/staff/dashboard"
                replace
              />
            }
          />

          <Route
            path="/staff/dashboard"
            element={<StaffDashboard />}
          />
        </Route>

        {/* =================================================
            CUSTOMER
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["customer"]}
            />
          }
        >
          {/* Customer root */}
          <Route
            path="/customer"
            element={
              <Navigate
                to="/customer/dashboard"
                replace
              />
            }
          />

          {/* Dashboard */}
          <Route
            path="/customer/dashboard"
            element={<CustomerDashboard />}
          />

          {/* Browse Products */}
          <Route
            path="/customer/products"
            element={
              <CustomerPagePlaceholder
                title="Browse Products"
                description="Your customer shopping experience will be available here."
              />
            }
          />

          {/* Orders */}
          <Route
            path="/customer/orders"
            element={
              <CustomerPagePlaceholder
                title="My Orders"
                description="Your orders and order tracking will be available here."
              />
            }
          />

          {/* Cart */}
          <Route
            path="/customer/cart"
            element={
              <CustomerPagePlaceholder
                title="My Cart"
                description="Your shopping cart and checkout experience will be available here."
              />
            }
          />

          {/* Invoices */}
          <Route
            path="/customer/invoices"
            element={
              <CustomerPagePlaceholder
                title="Invoices"
                description="Your invoices and payment receipts will be available here."
              />
            }
          />

          {/* Profile */}
          <Route
            path="/customer/profile"
            element={
              <CustomerPagePlaceholder
                title="My Profile"
                description="Your customer profile and account settings will be available here."
              />
            }
          />
        </Route>

        {/* =================================================
            PRODUCTS
            ADMIN + STAFF
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "staff"]}
            />
          }
        >
          <Route
            path="/products"
            element={<Products />}
          />
        </Route>

        {/* =================================================
            INVENTORY
            ADMIN + STAFF
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "staff"]}
            />
          }
        >
          <Route
            path="/inventory"
            element={<Inventory />}
          />
        </Route>

        {/* =================================================
            CUSTOMERS
            ADMIN + STAFF
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "staff"]}
            />
          }
        >
          <Route
            path="/customers"
            element={<Customer />}
          />
        </Route>

        {/* =================================================
            FALLBACK
        ================================================= */}

        <Route
          path="*"
          element={<HomeRedirect />}
        />

      </Routes>

      {/* =================================================
          TOAST
      ================================================= */}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
      />
    </>
  );
};

export default App;