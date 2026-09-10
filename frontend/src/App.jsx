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
// CUSTOMER PAGES
// =====================================================

import CustomerProducts from "./pages/CustomerProducts";
import CustomerOrders from "./pages/customer/MyOrders";
import CustomerCart from "./pages/customer/MyCart";
import CustomerInvoices from "./pages/customer/Invoices";
import CustomerProfile from "./pages/customer/Profile";

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
            element={<CustomerProducts />}
          />

          {/* My Orders */}
          <Route
            path="/customer/orders"
            element={<CustomerOrders />}
          />

          {/* My Cart */}
          <Route
            path="/customer/cart"
            element={<CustomerCart />}
          />

          {/* Invoices */}
          <Route
            path="/customer/invoices"
            element={<CustomerInvoices />}
          />

          {/* My Profile */}
          <Route
            path="/customer/profile"
            element={<CustomerProfile />}
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