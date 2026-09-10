// frontend/src/App.jsx

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
// CUSTOMER LAYOUT
// =====================================================

import CustomerLayout from "./components/CustomerLayout";

// =====================================================
// CUSTOMER PAGES
// =====================================================

import CustomerProducts from "./pages/CustomerProducts";
import CustomerOrders from "./pages/customer/MyOrders";
import CustomerCart from "./pages/customer/MyCart";
import CustomerInvoices from "./pages/customer/Invoices";
import CustomerProfile from "./pages/customer/Profile";

// =====================================================
// ADMIN / STAFF PAGES
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

  // ---------------------------------------------------
  // AUTH LOADING
  // ---------------------------------------------------

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(135deg, #f8f7ff, #ffffff)",
          color: "#5f4bd8",
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: "14px",
          fontWeight: 700,
        }}
      >
        Loading...
      </div>
    );
  }

  // ---------------------------------------------------
  // NOT LOGGED IN
  // ---------------------------------------------------

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ---------------------------------------------------
  // ADMIN
  // ---------------------------------------------------

  if (user.role === "admin") {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  // ---------------------------------------------------
  // STAFF
  // ---------------------------------------------------

  if (user.role === "staff") {
    return (
      <Navigate
        to="/staff/dashboard"
        replace
      />
    );
  }

  // ---------------------------------------------------
  // CUSTOMER
  // ---------------------------------------------------

  if (user.role === "customer") {
    return (
      <Navigate
        to="/customer/dashboard"
        replace
      />
    );
  }

  // ---------------------------------------------------
  // UNKNOWN ROLE
  // ---------------------------------------------------

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
            PUBLIC ROUTES
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
            ADMIN ROUTES
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            />
          }
        >

          {/* Admin root */}

          <Route
            path="/admin"
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          {/* Admin dashboard */}

          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

        </Route>


        {/* =================================================
            STAFF ROUTES
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["staff"]}
            />
          }
        >

          {/* Staff root */}

          <Route
            path="/staff"
            element={
              <Navigate
                to="/staff/dashboard"
                replace
              />
            }
          />

          {/* Staff dashboard */}

          <Route
            path="/staff/dashboard"
            element={<StaffDashboard />}
          />

        </Route>


        {/* =================================================
            CUSTOMER ROUTES
            CustomerLayout provides:
            - Sidebar
            - Topbar
            - Mobile navigation
            - Outlet for customer pages
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["customer"]}
            />
          }
        >

          {/* =================================================
              CUSTOMER LAYOUT
          ================================================= */}

          <Route
            path="/customer"
            element={<CustomerLayout />}
          >

            {/* -------------------------------------------------
                CUSTOMER ROOT
            ------------------------------------------------- */}

            <Route
              index
              element={
                <Navigate
                  to="/customer/dashboard"
                  replace
                />
              }
            />

            {/* -------------------------------------------------
                CUSTOMER DASHBOARD
            ------------------------------------------------- */}

            <Route
              path="dashboard"
              element={<CustomerDashboard />}
            />

            {/* -------------------------------------------------
                BROWSE PRODUCTS
            ------------------------------------------------- */}

            <Route
              path="products"
              element={<CustomerProducts />}
            />

            {/* -------------------------------------------------
                MY ORDERS
            ------------------------------------------------- */}

            <Route
              path="orders"
              element={<CustomerOrders />}
            />

            {/* -------------------------------------------------
                MY CART
            ------------------------------------------------- */}

            <Route
              path="cart"
              element={<CustomerCart />}
            />

            {/* -------------------------------------------------
                INVOICES
            ------------------------------------------------- */}

            <Route
              path="invoices"
              element={<CustomerInvoices />}
            />

            {/* -------------------------------------------------
                MY PROFILE
            ------------------------------------------------- */}

            <Route
              path="profile"
              element={<CustomerProfile />}
            />

          </Route>

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
          TOAST NOTIFICATIONS
      ================================================= */}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
    </>
  );
};

export default App;