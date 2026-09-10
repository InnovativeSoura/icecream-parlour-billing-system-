import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaSave,
  FaLock,
  FaShieldAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import "./Profile.css";

const Profile = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  useEffect(() => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    try {
      setLoading(true);

      /*
       * Connect this endpoint to your customer/user profile
       * update controller when the backend profile API is ready.
       */
      await api.put("/auth/profile", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });

      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const name = form.name?.trim();

    if (!name) return "C";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  return (
    <div className="customer-profile-page">
      {/* HEADER */}
      <motion.div
        className="profile-page-header"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <span className="profile-eyebrow">
            <FaUser />
            ACCOUNT SETTINGS
          </span>

          <h1>My Profile</h1>

          <p>
            Manage your personal information and account
            preferences.
          </p>
        </div>

        <div className="profile-header-avatar">
          {getInitials()}
        </div>
      </motion.div>

      {/* PROFILE LAYOUT */}
      <div className="profile-layout">
        {/* LEFT PROFILE CARD */}
        <motion.aside
          className="profile-overview-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="profile-avatar-large">
            {getInitials()}
          </div>

          <h2>{form.name || "Customer"}</h2>

          <p>{form.email || "Customer account"}</p>

          <span className="customer-role-badge">
            <FaCheckCircle />
            Customer Account
          </span>

          <div className="profile-divider" />

          <div className="profile-security">
            <div className="security-icon">
              <FaShieldAlt />
            </div>

            <div>
              <strong>Account Protected</strong>
              <span>
                Your account information is secured.
              </span>
            </div>
          </div>
        </motion.aside>

        {/* RIGHT FORM */}
        <motion.section
          className="profile-form-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
        >
          <div className="profile-card-heading">
            <div>
              <h2>Personal Information</h2>
              <p>
                Keep your contact details up to date.
              </p>
            </div>

            <div className="heading-icon">
              <FaUser />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="profile-form-grid">
              {/* NAME */}
              <div className="profile-field">
                <label htmlFor="name">
                  Full Name
                </label>

                <div className="profile-input-wrapper">
                  <FaUser />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="profile-field">
                <label htmlFor="email">
                  Email Address
                </label>

                <div className="profile-input-wrapper disabled">
                  <FaEnvelope />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    disabled
                    placeholder="Your email address"
                  />
                </div>

                <small>
                  Email address cannot be changed here.
                </small>
              </div>

              {/* PHONE */}
              <div className="profile-field">
                <label htmlFor="phone">
                  Phone Number
                </label>

                <div className="profile-input-wrapper">
                  <FaPhone />

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* ROLE */}
              <div className="profile-field">
                <label htmlFor="role">
                  Account Role
                </label>

                <div className="profile-input-wrapper disabled">
                  <FaShieldAlt />

                  <input
                    id="role"
                    type="text"
                    value="Customer"
                    disabled
                  />
                </div>
              </div>

              {/* ADDRESS */}
              <div className="profile-field full-width">
                <label htmlFor="address">
                  Delivery Address
                </label>

                <div className="profile-input-wrapper textarea-wrapper">
                  <FaMapMarkerAlt />

                  <textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter your delivery address"
                    rows="4"
                  />
                </div>
              </div>
            </div>

            <div className="profile-form-footer">
              <div className="profile-password-note">
                <FaLock />

                <span>
                  Password and authentication are managed
                  securely.
                </span>
              </div>

              <button
                type="submit"
                className="profile-save-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="profile-button-spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.section>
      </div>
    </div>
  );
};

export default Profile;