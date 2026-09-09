import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// =========================
// PUBLIC PAGES
// =========================
import Login from "./pages/Login";
import Register from "./pages/Register";

// =========================
// DASHBOARDS
// =========================
import AdminDashboard from "./pages/AdminDashboard.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import CustomerDashboard from "./pages/CustomerDashboard.jsx";

// =========================
// ADMIN / STAFF MANAGEMENT
// =========================
import Products from "./pages/Products.jsx";
import Inventory from "./pages/Inventory.jsx";
import Customer from "./pages/Customers.jsx";

// =========================
// AUTH
// =========================
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";


// =====================================================
// HOME REDIRECT
// =====================================================

const HomeRedirect = () => {
  const { user, loading } = useAuth();

  // Wait until authentication state is restored
  if (loading) {
    return null;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin
  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  // Staff
  if (user.role === "staff") {
    return <Navigate to="/staff" replace />;
  }

  // Customer
  return <Navigate to="/customer" replace />;
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
            GENERIC PROTECTED ROUTES
            Any authenticated user can access these redirects
        ================================================= */}

        <Route element={<ProtectedRoute />}>

          {/* /admin → /admin/dashboard */}
          <Route
            path="/admin"
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          {/* /staff → /staff/dashboard */}
          <Route
            path="/staff"
            element={
              <Navigate
                to="/staff/dashboard"
                replace
              />
            }
          />

          {/* /customer → /customer/dashboard */}
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

          <Route
            path="/staff/dashboard"
            element={<StaffDashboard />}
          />

        </Route>


        {/* =================================================
            CUSTOMER ROUTES
        ================================================= */}

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
          GLOBAL TOAST NOTIFICATIONS
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