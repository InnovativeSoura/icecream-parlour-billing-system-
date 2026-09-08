import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/AdminDashboard.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import CustomerDashboard from "./pages/CustomerDashboard.jsx";
import Products from "./pages/Products.jsx";

import ProtectedRoute from "./components/ProtectedRoute";

import { useAuth } from "./context/AuthContext";

const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === "staff") {
    return <Navigate to="/staff" replace />;
  }

  return <Navigate to="/customer" replace />;
};

const App = () => {
  return (
    <>
      <Routes>
        {/* =========================
            PUBLIC ROUTES
        ========================== */}

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

        {/* =========================
            GENERIC PROTECTED ROUTES
        ========================== */}

        <Route element={<ProtectedRoute />}>
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
            path="/staff"
            element={
              <Navigate
                to="/staff/dashboard"
                replace
              />
            }
          />

          <Route
            path="/customer"
            element={
              <Navigate
                to="/customer/dashboard"
                replace
              />
            }
          />
        </Route>

        {/* =========================
            ADMIN ROUTES
        ========================== */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            />
          }
        >
          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />
        </Route>

        {/* =========================
            STAFF ROUTES
        ========================== */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["staff"]}
            />
          }
        >
          <Route
            path="/staff/dashboard"
            element={<StaffDashboard />}
          />
        </Route>

        {/* =========================
            CUSTOMER ROUTES
        ========================== */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["customer"]}
            />
          }
        >
          <Route
            path="/customer/dashboard"
            element={<CustomerDashboard />}
          />
        </Route>

        {/* =========================
            PRODUCTS
            ADMIN + STAFF
        ========================== */}

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

        {/* =========================
            FALLBACK
        ========================== */}

        <Route
          path="*"
          element={<HomeRedirect />}
        />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
      />
    </>
  );
};

export default App;