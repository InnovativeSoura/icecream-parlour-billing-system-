import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaIceCream,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      toast.error(
        "Name, email and password are required."
      );
      return;
    }

    if (form.password.length < 6) {
      toast.error(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      toast.success(
        "Account created successfully!"
      );

      navigate("/customer", { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to create account."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-register">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <FaIceCream />
          </div>

          <div>
            <h1>IceCream Parlour</h1>
            <p>Create your customer account</p>
          </div>
        </div>

        <div className="auth-heading">
          <h2>Create account</h2>
          <p>Join us and order your favourite ice cream.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full name</label>

            <div className="input-wrapper">
              <FaUser />

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>
          </div>

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
            <label htmlFor="phone">
              Phone number <span>(optional)</span>
            </label>

            <div className="input-wrapper">
              <FaPhone />

              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Your phone number"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
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
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm password
            </label>

            <div className="input-wrapper">
              <FaLock />

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Creating account..."
              : "Create Customer Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
};

export default Register;