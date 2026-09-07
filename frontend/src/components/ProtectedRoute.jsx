import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Checking your session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    if (user.role === "staff") {
      return <Navigate to="/staff" replace />;
    }

    if (user.role === "customer") {
      return <Navigate to="/customer" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;