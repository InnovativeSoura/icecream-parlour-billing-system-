import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import {
  FaUsers,
  FaUserPlus,
  FaUserCheck,
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaShoppingBag,
  FaMoneyBillWave,
  FaEye,
  FaPlus,
  FaUserTie,
  FaStore,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTimesCircle,
} from "react-icons/fa";

import api from "../api/api";

import "./Customers.css";

/* =========================================================
   HELPERS
========================================================= */

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  customerType: "walk-in",
  notes: "",
  isActive: true,
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) {
    return "Never";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "Customer") => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "CU";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const getCustomerId = (customer) => {
  return customer?.id || customer?._id;
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  icon,
  label,
  value,
  detail,
  className = "",
}) => {
  return (
    <motion.div
      className={`customer-stat-card ${className}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="customer-stat-icon">
        {icon}
      </div>

      <div className="customer-stat-content">
        <span className="customer-stat-label">
          {label}
        </span>

        <strong className="customer-stat-value">
          {value}
        </strong>

        {detail && (
          <span className="customer-stat-detail">
            {detail}
          </span>
        )}
      </div>
    </motion.div>
  );
};

/* =========================================================
   CUSTOMER AVATAR
========================================================= */

const CustomerAvatar = ({
  name,
  size = "normal",
}) => {
  return (
    <div
      className={`customer-avatar customer-avatar-${size}`}
    >
      {getInitials(name)}
    </div>
  );
};

/* =========================================================
   CUSTOMER FORM MODAL
========================================================= */

const CustomerFormModal = ({
  open,
  editingCustomer,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!open) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="customer-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !saving
          ) {
            onClose();
          }
        }}
      >
        <motion.div
          className="customer-modal customer-form-modal"
          initial={{
            opacity: 0,
            scale: 0.94,
            y: 20,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.94,
            y: 20,
          }}
          transition={{ duration: 0.22 }}
        >
          <div className="customer-modal-header">
            <div>
              <div className="customer-modal-kicker">
                {editingCustomer
                  ? "CUSTOMER MANAGEMENT"
                  : "NEW CUSTOMER"}
              </div>

              <h2>
                {editingCustomer
                  ? "Edit Customer"
                  : "Add Customer"}
              </h2>

              <p>
                {editingCustomer
                  ? "Update customer information and account status."
                  : "Create a customer profile for POS billing and order tracking."}
              </p>
            </div>

            <button
              type="button"
              className="customer-modal-close"
              onClick={onClose}
              disabled={saving}
            >
              <FaTimes />
            </button>
          </div>

          <form
            className="customer-form"
            onSubmit={onSubmit}
          >
            <div className="customer-form-grid">
              <div className="customer-field customer-field-full">
                <label htmlFor="customer-name">
                  Customer Name <span>*</span>
                </label>

                <input
                  id="customer-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Enter customer name"
                  maxLength={100}
                  required
                  disabled={saving}
                />
              </div>

              <div className="customer-field">
                <label htmlFor="customer-phone">
                  Phone Number
                </label>

                <div className="customer-input-icon">
                  <FaPhone />

                  <input
                    id="customer-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={onChange}
                    placeholder="+91 98765 43210"
                    maxLength={20}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="customer-field">
                <label htmlFor="customer-email">
                  Email Address
                </label>

                <div className="customer-input-icon">
                  <FaEnvelope />

                  <input
                    id="customer-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="customer@email.com"
                    maxLength={150}
                    disabled={saving}
                  />
                </div>
              </div>

              {!editingCustomer && (
                <div className="customer-field">
                  <label htmlFor="customer-type">
                    Customer Type
                  </label>

                  <select
                    id="customer-type"
                    name="customerType"
                    value={form.customerType}
                    onChange={onChange}
                    disabled={saving}
                  >
                    <option value="walk-in">
                      Walk-in Customer
                    </option>
                  </select>

                  <small>
                    Registered customers are created through
                    the customer registration flow.
                  </small>
                </div>
              )}

              <div
                className={`customer-field ${
                  editingCustomer
                    ? "customer-field-full"
                    : ""
                }`}
              >
                <label htmlFor="customer-status">
                  Account Status
                </label>

                <select
                  id="customer-status"
                  name="isActive"
                  value={String(form.isActive)}
                  onChange={onChange}
                  disabled={saving}
                >
                  <option value="true">
                    Active
                  </option>

                  <option value="false">
                    Inactive
                  </option>
                </select>
              </div>

              <div className="customer-field customer-field-full">
                <label htmlFor="customer-address">
                  Address
                </label>

                <div className="customer-input-icon customer-textarea-icon">
                  <FaMapMarkerAlt />

                  <textarea
                    id="customer-address"
                    name="address"
                    value={form.address}
                    onChange={onChange}
                    placeholder="Enter customer address"
                    maxLength={500}
                    rows={3}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="customer-field customer-field-full">
                <label htmlFor="customer-notes">
                  Notes
                </label>

                <textarea
                  id="customer-notes"
                  name="notes"
                  value={form.notes}
                  onChange={onChange}
                  placeholder="Add internal notes about this customer..."
                  maxLength={1000}
                  rows={3}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="customer-form-footer">
              <button
                type="button"
                className="customer-btn customer-btn-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="customer-btn customer-btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <FaSyncAlt className="spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingCustomer ? (
                      <FaCheck />
                    ) : (
                      <FaUserPlus />
                    )}

                    {editingCustomer
                      ? "Save Changes"
                      : "Create Customer"}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* =========================================================
   CUSTOMER DETAILS MODAL
========================================================= */

const CustomerDetailsModal = ({
  customer,
  onClose,
  onEdit,
}) => {
  if (!customer) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="customer-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          className="customer-modal customer-details-modal"
          initial={{
            opacity: 0,
            scale: 0.94,
            y: 20,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.94,
            y: 20,
          }}
        >
          <div className="customer-modal-header">
            <div className="customer-details-heading">
              <CustomerAvatar
                name={customer.name}
                size="large"
              />

              <div>
                <div className="customer-modal-kicker">
                  CUSTOMER PROFILE
                </div>

                <h2>{customer.name}</h2>

                <div className="customer-heading-meta">
                  <span
                    className={`customer-status ${
                      customer.isActive
                        ? "customer-status-active"
                        : "customer-status-inactive"
                    }`}
                  >
                    {customer.isActive ? (
                      <FaCheck />
                    ) : (
                      <FaTimes />
                    )}

                    {customer.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>

                  <span
                    className={`customer-type-badge ${
                      customer.customerType ===
                      "registered"
                        ? "customer-type-registered"
                        : "customer-type-walkin"
                    }`}
                  >
                    {customer.customerType ===
                    "registered" ? (
                      <FaUserCheck />
                    ) : (
                      <FaStore />
                    )}

                    {customer.customerType ===
                    "registered"
                      ? "Registered"
                      : "Walk-in"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="customer-modal-close"
              onClick={onClose}
            >
              <FaTimes />
            </button>
          </div>

          <div className="customer-details-body">
            <div className="customer-detail-stats">
              <div className="customer-detail-stat">
                <div className="customer-detail-stat-icon">
                  <FaShoppingBag />
                </div>

                <div>
                  <span>Total Orders</span>
                  <strong>
                    {customer.totalOrders || 0}
                  </strong>
                </div>
              </div>

              <div className="customer-detail-stat">
                <div className="customer-detail-stat-icon">
                  <FaMoneyBillWave />
                </div>

                <div>
                  <span>Total Spent</span>
                  <strong>
                    {formatCurrency(
                      customer.totalSpent
                    )}
                  </strong>
                </div>
              </div>

              <div className="customer-detail-stat">
                <div className="customer-detail-stat-icon">
                  <FaCalendarAlt />
                </div>

                <div>
                  <span>Last Order</span>
                  <strong>
                    {formatDate(
                      customer.lastOrderAt
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="customer-details-grid">
              <div className="customer-detail-card">
                <h3>Contact Information</h3>

                <div className="customer-detail-row">
                  <FaPhone />

                  <div>
                    <span>Phone</span>
                    <strong>
                      {customer.phone ||
                        "Not provided"}
                    </strong>
                  </div>
                </div>

                <div className="customer-detail-row">
                  <FaEnvelope />

                  <div>
                    <span>Email</span>
                    <strong>
                      {customer.email ||
                        "Not provided"}
                    </strong>
                  </div>
                </div>

                <div className="customer-detail-row">
                  <FaMapMarkerAlt />

                  <div>
                    <span>Address</span>
                    <strong>
                      {customer.address ||
                        "Not provided"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="customer-detail-card">
                <h3>Account Information</h3>

                <div className="customer-detail-row">
                  <FaCalendarAlt />

                  <div>
                    <span>Customer Since</span>
                    <strong>
                      {formatDate(
                        customer.createdAt
                      )}
                    </strong>
                  </div>
                </div>

                <div className="customer-detail-row">
                  <FaUserTie />

                  <div>
                    <span>Account Type</span>
                    <strong>
                      {customer.customerType ===
                      "registered"
                        ? "Registered Customer"
                        : "Walk-in Customer"}
                    </strong>
                  </div>
                </div>

                <div className="customer-detail-row">
                  <FaSyncAlt />

                  <div>
                    <span>Last Updated</span>
                    <strong>
                      {formatDate(
                        customer.updatedAt
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {customer.notes && (
              <div className="customer-notes-card">
                <h3>Internal Notes</h3>
                <p>{customer.notes}</p>
              </div>
            )}
          </div>

          <div className="customer-form-footer">
            <button
              type="button"
              className="customer-btn customer-btn-secondary"
              onClick={onClose}
            >
              Close
            </button>

            <button
              type="button"
              className="customer-btn customer-btn-primary"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
            >
              <FaEdit />
              Edit Customer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* =========================================================
   CUSTOMERS PAGE
========================================================= */

const Customers = () => {
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    registeredCustomers: 0,
    walkInCustomers: 0,
    totalOrders: 0,
    totalSpent: 0,
  });

  const [search, setSearch] = useState("");
  const [customerType, setCustomerType] =
    useState("");
  const [isActive, setIsActive] = useState("");

  const [sortBy, setSortBy] =
    useState("createdAt");

  const [sortOrder, setSortOrder] =
    useState("desc");

  const [page, setPage] = useState(1);
  const perPage = 10;

  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    totalCustomers: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [showFilters, setShowFilters] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState(null);

  const [showDetails, setShowDetails] =
    useState(false);

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
  });

  const [actionLoading, setActionLoading] =
    useState("");

  const [currentUser, setCurrentUser] =
    useState(null);

  /* =======================================================
     CURRENT USER
  ======================================================= */

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem(
          "icecream_user"
        );

      if (storedUser) {
        setCurrentUser(
          JSON.parse(storedUser)
        );
      }
    } catch (error) {
      console.error(
        "Unable to read current user:",
        error
      );
    }
  }, []);

  const userRole =
    currentUser?.role || "staff";

  const isAdmin =
    userRole === "admin";

  /* =======================================================
     FETCH STATS
  ======================================================= */

  const fetchStats = useCallback(
    async () => {
      try {
        const response =
          await api.get(
            "/customers/stats/summary"
          );

        if (response.data?.success) {
          setStats(
            response.data.stats || {
              totalCustomers: 0,
              activeCustomers: 0,
              registeredCustomers: 0,
              walkInCustomers: 0,
              totalOrders: 0,
              totalSpent: 0,
            }
          );
        }
      } catch (error) {
        console.error(
          "Customer stats error:",
          error
        );
      }
    },
    []
  );

  /* =======================================================
     FETCH CUSTOMERS
  ======================================================= */

  const fetchCustomers = useCallback(
    async ({
      showLoader = true,
    } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const params = {
          search: search.trim(),
          customerType,
          isActive,
          page,
          limit: perPage,
          sortBy,
          sortOrder,
        };

        const response =
          await api.get(
            "/customers",
            { params }
          );

        if (response.data?.success) {
          setCustomers(
            response.data.customers || []
          );

          setPagination(
            response.data.pagination || {
              currentPage: page,
              perPage,
              totalCustomers: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false,
            }
          );
        }
      } catch (error) {
        console.error(
          "Fetch customers error:",
          error
        );

        toast.error(
          error.response?.data?.message ||
            "Unable to load customers"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      search,
      customerType,
      isActive,
      page,
      sortBy,
      sortOrder,
    ]
  );

  useEffect(() => {
    fetchCustomers({
      showLoader: true,
    });
  }, [fetchCustomers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  /* =======================================================
     FORM HANDLERS
  ======================================================= */

  const handleFormChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "isActive"
          ? value === "true"
          : value,
    }));
  };

  const openCreateModal = () => {
    setEditingCustomer(null);

    setForm({
      ...EMPTY_FORM,
    });

    setShowForm(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      customerType:
        customer.customerType ||
        "walk-in",
      notes: customer.notes || "",
      isActive:
        customer.isActive !== false,
    });

    setShowForm(true);
  };

  const closeFormModal = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingCustomer(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

  /* =======================================================
     CREATE / UPDATE
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error(
        "Customer name is required"
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        isActive: form.isActive,
      };

      if (!editingCustomer) {
        payload.customerType = "walk-in";
      }

      if (editingCustomer) {
        const id = getCustomerId(
          editingCustomer
        );

        if (!id) {
          toast.error(
            "Invalid customer ID"
          );
          return;
        }

        const response =
          await api.put(
            `/customers/${id}`,
            payload
          );

        if (response.data?.success) {
          toast.success(
            "Customer updated successfully"
          );

          closeFormModal();

          await Promise.all([
            fetchCustomers({
              showLoader: false,
            }),
            fetchStats(),
          ]);
        }
      } else {
        const response =
          await api.post(
            "/customers",
            payload
          );

        if (response.data?.success) {
          toast.success(
            "Customer created successfully"
          );

          closeFormModal();
          setPage(1);

          await Promise.all([
            fetchCustomers({
              showLoader: false,
            }),
            fetchStats(),
          ]);
        }
      }
    } catch (error) {
      console.error(
        "Save customer error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to save customer"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE / DEACTIVATE
  ======================================================= */

  const handleDeactivate = async (
    customer
  ) => {
    if (!isAdmin) {
      toast.error(
        "Only administrators can deactivate customers"
      );
      return;
    }

    const id = getCustomerId(customer);

    if (!id) {
      return;
    }

    const confirmed =
      window.confirm(
        `Deactivate ${customer.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(id);

      const response =
        await api.delete(
          `/customers/${id}`
        );

      if (response.data?.success) {
        toast.success(
          "Customer deactivated successfully"
        );

        await Promise.all([
          fetchCustomers({
            showLoader: false,
          }),
          fetchStats(),
        ]);
      }
    } catch (error) {
      console.error(
        "Deactivate customer error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to deactivate customer"
      );
    } finally {
      setActionLoading("");
    }
  };

  /* =======================================================
     ACTIVATE
  ======================================================= */

  const handleActivate = async (
    customer
  ) => {
    if (!isAdmin) {
      toast.error(
        "Only administrators can activate customers"
      );
      return;
    }

    const id = getCustomerId(customer);

    if (!id) {
      return;
    }

    try {
      setActionLoading(id);

      const response =
        await api.patch(
          `/customers/${id}/activate`
        );

      if (response.data?.success) {
        toast.success(
          "Customer activated successfully"
        );

        await Promise.all([
          fetchCustomers({
            showLoader: false,
          }),
          fetchStats(),
        ]);
      }
    } catch (error) {
      console.error(
        "Activate customer error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to activate customer"
      );
    } finally {
      setActionLoading("");
    }
  };

  /* =======================================================
     DETAILS
  ======================================================= */

  const openDetails = async (
    customer
  ) => {
    const id = getCustomerId(customer);

    if (!id) {
      return;
    }

    try {
      const response =
        await api.get(
          `/customers/${id}`
        );

      if (response.data?.success) {
        setSelectedCustomer(
          response.data.customer
        );

        setShowDetails(true);
      }
    } catch (error) {
      console.error(
        "Customer details error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to load customer details"
      );
    }
  };

  /* =======================================================
     SORT
  ======================================================= */

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((previous) =>
        previous === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }

    setPage(1);
  };

  /* =======================================================
     RESET FILTERS
  ======================================================= */

  const resetFilters = () => {
    setSearch("");
    setCustomerType("");
    setIsActive("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(customerType) ||
    Boolean(isActive);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const displayedRange = useMemo(() => {
    if (!pagination.totalCustomers) {
      return "0 customers";
    }

    const start =
      (pagination.currentPage - 1) *
        pagination.perPage +
      1;

    const end = Math.min(
      pagination.currentPage *
        pagination.perPage,
      pagination.totalCustomers
    );

    return `${start}–${end} of ${pagination.totalCustomers}`;
  }, [pagination]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="customers-page">
      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div className="customers-background">
        <div className="customers-grid" />

        <div className="customers-orb customers-orb-one" />
        <div className="customers-orb customers-orb-two" />
        <div className="customers-orb customers-orb-three" />

        <div className="customers-noise" />
      </div>

      {/* ===================================================
          PAGE CONTENT
      =================================================== */}

      <div className="customers-content">
        {/* =================================================
            HEADER
        ================================================= */}

        <motion.header
          className="customers-header"
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <div className="customers-header-copy">
            <div className="customers-eyebrow">
              <span className="customers-eyebrow-icon">
                <FaUsers />
              </span>

              CUSTOMER MANAGEMENT

              <span className="customers-eyebrow-line" />
            </div>

            <h1>
              Customer
              <span> Directory</span>
            </h1>

            <p>
              Manage customer profiles, billing
              history, contact information and
              relationships from one centralized
              workspace.
            </p>
          </div>

          <div className="customers-header-actions">
            <div className="customers-role-badge">
              {isAdmin ? (
                <FaUserTie />
              ) : (
                <FaUsers />
              )}

              <span>
                {isAdmin
                  ? "Administrator"
                  : "Staff Access"}
              </span>
            </div>

            <button
              type="button"
              className="customer-btn customer-btn-secondary customer-refresh-btn"
              onClick={() => {
                fetchCustomers({
                  showLoader: false,
                });

                fetchStats();
              }}
              disabled={refreshing}
            >
              <FaSyncAlt
                className={
                  refreshing
                    ? "spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              className="customer-btn customer-btn-primary"
              onClick={openCreateModal}
            >
              <FaPlus />
              Add Customer
            </button>
          </div>
        </motion.header>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <motion.section
          className="customers-stats-grid"
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.08,
          }}
        >
          <StatCard
            icon={<FaUsers />}
            label="Total Customers"
            value={
              stats.totalCustomers || 0
            }
            detail={`${stats.activeCustomers || 0} active profiles`}
            className="stat-total"
          />

          <StatCard
            icon={<FaUserCheck />}
            label="Registered"
            value={
              stats.registeredCustomers ||
              0
            }
            detail="Linked customer accounts"
            className="stat-registered"
          />

          <StatCard
            icon={<FaStore />}
            label="Walk-in"
            value={
              stats.walkInCustomers || 0
            }
            detail="POS customer profiles"
            className="stat-walkin"
          />

          <StatCard
            icon={<FaMoneyBillWave />}
            label="Customer Revenue"
            value={formatCurrency(
              stats.totalSpent
            )}
            detail={`${stats.totalOrders || 0} total orders`}
            className="stat-revenue"
          />
        </motion.section>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <motion.section
          className="customers-toolbar"
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.14,
          }}
        >
          <div className="customers-search">
            <FaSearch />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search customers by name, phone or email..."
            />

            {search && (
              <button
                type="button"
                className="customers-search-clear"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <FaTimesCircle />
              </button>
            )}
          </div>

          <button
            type="button"
            className={`customers-filter-toggle ${
              showFilters
                ? "active"
                : ""
            }`}
            onClick={() =>
              setShowFilters(
                (previous) =>
                  !previous
              )
            }
          >
            <FaFilter />
            Filters

            {hasActiveFilters && (
              <span className="filter-dot" />
            )}
          </button>

          <div className="customers-sort">
            <button
              type="button"
              onClick={() =>
                toggleSort("createdAt")
              }
              className={
                sortBy === "createdAt"
                  ? "active"
                  : ""
              }
            >
              {sortOrder === "desc" ? (
                <FaSortAmountDown />
              ) : (
                <FaSortAmountUp />
              )}

              Latest
            </button>
          </div>
        </motion.section>

        {/* =================================================
            FILTER PANEL
        ================================================= */}

        <AnimatePresence>
          {showFilters && (
            <motion.section
              className="customers-filter-panel"
              initial={{
                opacity: 0,
                height: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                height: "auto",
                y: 0,
              }}
              exit={{
                opacity: 0,
                height: 0,
                y: -8,
              }}
            >
              <div className="customer-filter-field">
                <label>
                  Customer Type
                </label>

                <select
                  value={customerType}
                  onChange={(event) => {
                    setCustomerType(
                      event.target.value
                    );
                    setPage(1);
                  }}
                >
                  <option value="">
                    All Types
                  </option>

                  <option value="registered">
                    Registered
                  </option>

                  <option value="walk-in">
                    Walk-in
                  </option>
                </select>
              </div>

              <div className="customer-filter-field">
                <label>
                  Account Status
                </label>

                <select
                  value={isActive}
                  onChange={(event) => {
                    setIsActive(
                      event.target.value
                    );
                    setPage(1);
                  }}
                >
                  <option value="">
                    All Statuses
                  </option>

                  <option value="true">
                    Active
                  </option>

                  <option value="false">
                    Inactive
                  </option>
                </select>
              </div>

              <div className="customer-filter-field">
                <label>
                  Sort By
                </label>

                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(
                      event.target.value
                    );
                    setPage(1);
                  }}
                >
                  <option value="createdAt">
                    Created Date
                  </option>

                  <option value="name">
                    Name
                  </option>

                  <option value="totalOrders">
                    Total Orders
                  </option>

                  <option value="totalSpent">
                    Total Spent
                  </option>

                  <option value="lastOrderAt">
                    Last Order
                  </option>

                  <option value="updatedAt">
                    Last Updated
                  </option>
                </select>
              </div>

              <div className="customer-filter-field">
                <label>
                  Direction
                </label>

                <select
                  value={sortOrder}
                  onChange={(event) => {
                    setSortOrder(
                      event.target.value
                    );
                    setPage(1);
                  }}
                >
                  <option value="desc">
                    Descending
                  </option>

                  <option value="asc">
                    Ascending
                  </option>
                </select>
              </div>

              <button
                type="button"
                className="customer-reset-filters"
                onClick={resetFilters}
              >
                <FaTimes />
                Reset
              </button>
            </motion.section>
          )}
        </AnimatePresence>

        {/* =================================================
            TABLE HEADER
        ================================================= */}

        <div className="customers-list-heading">
          <div>
            <span className="customers-list-title">
              All Customers
            </span>

            <span className="customers-list-count">
              {displayedRange}
            </span>
          </div>

          <div className="customers-list-meta">
            <span>
              {customerType === "registered"
                ? "Registered only"
                : customerType === "walk-in"
                ? "Walk-in only"
                : "All customer types"}
            </span>
          </div>
        </div>

        {/* =================================================
            CUSTOMER LIST
        ================================================= */}

        <motion.section
          className="customers-table-card"
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.2,
          }}
        >
          {loading ? (
            <div className="customers-loading">
              <div className="customers-loading-spinner">
                <FaSyncAlt />
              </div>

              <h3>
                Loading customers...
              </h3>

              <p>
                Fetching the latest customer
                records.
              </p>
            </div>
          ) : customers.length === 0 ? (
            <div className="customers-empty">
              <div className="customers-empty-icon">
                <FaUsers />
              </div>

              <h3>
                No customers found
              </h3>

              <p>
                {hasActiveFilters
                  ? "Try adjusting your search or filters."
                  : "Create your first customer profile to start building your customer directory."}
              </p>

              {hasActiveFilters ? (
                <button
                  type="button"
                  className="customer-btn customer-btn-secondary"
                  onClick={resetFilters}
                >
                  <FaTimes />
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  className="customer-btn customer-btn-primary"
                  onClick={openCreateModal}
                >
                  <FaUserPlus />
                  Add Customer
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}

              <div className="customers-table-wrapper">
                <table className="customers-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Type</th>
                      <th>Orders</th>
                      <th>Total Spent</th>
                      <th>Last Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customers.map(
                      (
                        customer,
                        index
                      ) => {
                        const id =
                          getCustomerId(
                            customer
                          );

                        const busy =
                          actionLoading ===
                          id;

                        return (
                          <motion.tr
                            key={id}
                            initial={{
                              opacity: 0,
                              y: 8,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              delay:
                                index *
                                0.025,
                            }}
                          >
                            <td>
                              <div className="customer-table-profile">
                                <CustomerAvatar
                                  name={
                                    customer.name
                                  }
                                />

                                <div>
                                  <strong>
                                    {
                                      customer.name
                                    }
                                  </strong>

                                  <span>
                                    Joined{" "}
                                    {formatDate(
                                      customer.createdAt
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="customer-contact">
                                {customer.phone && (
                                  <span>
                                    <FaPhone />
                                    {
                                      customer.phone
                                    }
                                  </span>
                                )}

                                {customer.email && (
                                  <span>
                                    <FaEnvelope />
                                    {
                                      customer.email
                                    }
                                  </span>
                                )}

                                {!customer.phone &&
                                  !customer.email && (
                                    <span className="customer-muted">
                                      No contact
                                      details
                                    </span>
                                  )}
                              </div>
                            </td>

                            <td>
                              <span
                                className={`customer-type-badge ${
                                  customer.customerType ===
                                  "registered"
                                    ? "customer-type-registered"
                                    : "customer-type-walkin"
                                }`}
                              >
                                {customer.customerType ===
                                "registered" ? (
                                  <FaUserCheck />
                                ) : (
                                  <FaStore />
                                )}

                                {customer.customerType ===
                                "registered"
                                  ? "Registered"
                                  : "Walk-in"}
                              </span>
                            </td>

                            <td>
                              <span className="customer-orders-value">
                                {customer.totalOrders ||
                                  0}
                              </span>
                            </td>

                            <td>
                              <strong className="customer-spent-value">
                                {formatCurrency(
                                  customer.totalSpent
                                )}
                              </strong>
                            </td>

                            <td>
                              <div className="customer-date">
                                <FaCalendarAlt />

                                {formatDate(
                                  customer.lastOrderAt
                                )}
                              </div>
                            </td>

                            <td>
                              <span
                                className={`customer-status ${
                                  customer.isActive
                                    ? "customer-status-active"
                                    : "customer-status-inactive"
                                }`}
                              >
                                {customer.isActive ? (
                                  <FaCheck />
                                ) : (
                                  <FaTimes />
                                )}

                                {customer.isActive
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            <td>
                              <div className="customer-actions">
                                <button
                                  type="button"
                                  className="customer-action-btn view"
                                  title="View customer"
                                  onClick={() =>
                                    openDetails(
                                      customer
                                    )
                                  }
                                >
                                  <FaEye />
                                </button>

                                <button
                                  type="button"
                                  className="customer-action-btn edit"
                                  title="Edit customer"
                                  onClick={() =>
                                    openEditModal(
                                      customer
                                    )
                                  }
                                >
                                  <FaEdit />
                                </button>

                                {isAdmin &&
                                  (customer.isActive ? (
                                    <button
                                      type="button"
                                      className="customer-action-btn delete"
                                      title="Deactivate customer"
                                      disabled={
                                        busy
                                      }
                                      onClick={() =>
                                        handleDeactivate(
                                          customer
                                        )
                                      }
                                    >
                                      {busy ? (
                                        <FaSyncAlt className="spin" />
                                      ) : (
                                        <FaTrash />
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="customer-action-btn activate"
                                      title="Activate customer"
                                      disabled={
                                        busy
                                      }
                                      onClick={() =>
                                        handleActivate(
                                          customer
                                        )
                                      }
                                    >
                                      {busy ? (
                                        <FaSyncAlt className="spin" />
                                      ) : (
                                        <FaCheck />
                                      )}
                                    </button>
                                  ))}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}

              <div className="customers-mobile-list">
                {customers.map(
                  (customer) => {
                    const id =
                      getCustomerId(
                        customer
                      );

                    const busy =
                      actionLoading === id;

                    return (
                      <div
                        key={id}
                        className="customer-mobile-card"
                      >
                        <div className="customer-mobile-top">
                          <div className="customer-table-profile">
                            <CustomerAvatar
                              name={
                                customer.name
                              }
                            />

                            <div>
                              <strong>
                                {
                                  customer.name
                                }
                              </strong>

                              <span>
                                {customer.phone ||
                                  customer.email ||
                                  "No contact information"}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`customer-status ${
                              customer.isActive
                                ? "customer-status-active"
                                : "customer-status-inactive"
                            }`}
                          >
                            {customer.isActive ? (
                              <FaCheck />
                            ) : (
                              <FaTimes />
                            )}
                          </span>
                        </div>

                        <div className="customer-mobile-tags">
                          <span
                            className={`customer-type-badge ${
                              customer.customerType ===
                              "registered"
                                ? "customer-type-registered"
                                : "customer-type-walkin"
                            }`}
                          >
                            {customer.customerType ===
                            "registered"
                              ? "Registered"
                              : "Walk-in"}
                          </span>
                        </div>

                        <div className="customer-mobile-stats">
                          <div>
                            <span>Orders</span>

                            <strong>
                              {customer.totalOrders ||
                                0}
                            </strong>
                          </div>

                          <div>
                            <span>Spent</span>

                            <strong>
                              {formatCurrency(
                                customer.totalSpent
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Last Order
                            </span>

                            <strong>
                              {formatDate(
                                customer.lastOrderAt
                              )}
                            </strong>
                          </div>
                        </div>

                        <div className="customer-mobile-actions">
                          <button
                            type="button"
                            className="customer-btn customer-btn-secondary"
                            onClick={() =>
                              openDetails(
                                customer
                              )
                            }
                          >
                            <FaEye />
                            View
                          </button>

                          <button
                            type="button"
                            className="customer-btn customer-btn-secondary"
                            onClick={() =>
                              openEditModal(
                                customer
                              )
                            }
                          >
                            <FaEdit />
                            Edit
                          </button>

                          {isAdmin &&
                            (customer.isActive ? (
                              <button
                                type="button"
                                className="customer-btn customer-btn-danger"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  handleDeactivate(
                                    customer
                                  )
                                }
                              >
                                {busy ? (
                                  <FaSyncAlt className="spin" />
                                ) : (
                                  <FaTrash />
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="customer-btn customer-btn-success"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  handleActivate(
                                    customer
                                  )
                                }
                              >
                                {busy ? (
                                  <FaSyncAlt className="spin" />
                                ) : (
                                  <FaCheck />
                                )}
                              </button>
                            ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Pagination */}

              {pagination.totalPages >
                0 && (
                <div className="customers-pagination">
                  <div className="pagination-summary">
                    Showing{" "}
                    <strong>
                      {displayedRange}
                    </strong>
                  </div>

                  <div className="pagination-controls">
                    <button
                      type="button"
                      disabled={
                        !pagination.hasPreviousPage
                      }
                      onClick={() =>
                        setPage(
                          (previous) =>
                            Math.max(
                              previous - 1,
                              1
                            )
                        )
                      }
                    >
                      <FaChevronLeft />
                    </button>

                    <span className="pagination-current">
                      {pagination.currentPage}
                    </span>

                    <span className="pagination-of">
                      of
                    </span>

                    <span className="pagination-total">
                      {pagination.totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={
                        !pagination.hasNextPage
                      }
                      onClick={() =>
                        setPage(
                          (previous) =>
                            previous + 1
                        )
                      }
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.section>
      </div>

      {/* ===================================================
          FORM MODAL
      =================================================== */}

      <CustomerFormModal
        open={showForm}
        editingCustomer={editingCustomer}
        form={form}
        saving={saving}
        onChange={handleFormChange}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
      />

      {/* ===================================================
          DETAILS MODAL
      =================================================== */}

      <CustomerDetailsModal
        customer={
          showDetails
            ? selectedCustomer
            : null
        }
        onClose={() => {
          setShowDetails(false);
          setSelectedCustomer(null);
        }}
        onEdit={openEditModal}
      />
    </div>
  );
};

export default Customers;