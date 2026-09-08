import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(user);

  // Restore existing session
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("icecream_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        if (response.data?.success) {
          setUser(response.data.user);

          localStorage.setItem(
            "icecream_user",
            JSON.stringify(response.data.user)
          );
        }
      } catch (error) {
        console.error("Session restoration failed:", error);

        localStorage.removeItem("icecream_token");
        localStorage.removeItem("icecream_user");

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Login
  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Login failed"
      );
    }

    const { token, user: loggedInUser } = response.data;

    localStorage.setItem("icecream_token", token);

    localStorage.setItem(
      "icecream_user",
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);

    return loggedInUser;
  };

  // Register
  const register = async ({
    name,
    email,
    phone,
    password,
  }) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      phone,
      password,
    });

    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Registration failed"
      );
    }

    const { token, user: registeredUser } = response.data;

    localStorage.setItem("icecream_token", token);

    localStorage.setItem(
      "icecream_user",
      JSON.stringify(registeredUser)
    );

    setUser(registeredUser);

    return registeredUser;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("icecream_token");
    localStorage.removeItem("icecream_user");

    setUser(null);

    window.location.href = "/login";
  };

  const value = {
    user,
    loading,
    isAuthenticated,

    login,
    register,
    logout,

    isAdmin: user?.role === "admin",
    isStaff: user?.role === "staff",
    isCustomer: user?.role === "customer",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

export default AuthContext;