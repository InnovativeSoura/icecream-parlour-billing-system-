import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaIceCream, FaLock, FaEnvelope } from "react-icons/fa";
import { toast } from "react-toastify";

import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const redirectUser = (user) => {
    const requestedPath =
      location.state?.from?.pathname;

    if (requestedPath && requestedPath !== "/login") {
      navigate(requestedPath, { replace: true });
      return;
    }

    if (user.role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    if (user.role === "staff") {
      navigate("/staff", { replace: true });
      return;
    }

    navigate("/customer", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error("Please enter your email and password.");
      return;
    }

    try {
      setSubmitting(true);

      const loggedInUser = await login(
        form.email.trim(),
        form.password
      );

      toast.success(
        `Welcome back, ${loggedInUser.name}!`
      );

      redirectUser(loggedInUser);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to login."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <FaIceCream />
          </div>

          <div>
            <h1>IceCream Parlour</h1>
            <p>Billing & Ordering System</p>
          </div>
        </div>

        <div className="auth-heading">
          <h2>Welcome back</h2>
          <p>Sign in to continue to your account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>

            <div className="input-wrapper">
              <FaEnvelope />

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="input-wrapper">
              <FaLock />

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">Create one</Link>
        </p>
      </section>
    </main>
  );
};

export default Login;