import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaChevronDown,
  FaCircle,
  FaEdit,
  FaFilter,
  FaImage,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaToggleOff,
  FaToggleOn,
  FaTags,
  FaLayerGroup,
  FaMoneyBillWave,
} from "react-icons/fa";
import { toast } from "react-toastify";

import api from "../api/api";
import "./Products.css";

const EMPTY_FORM = {
  name: "",
  sku: "",
  category: "",
  description: "",
  image: "",
  price: "",
  costPrice: "",
  taxRate: 5,
  unit: "piece",
  lowStockThreshold: 10,
  isAvailable: true,
  isActive: true,
};

const UNITS = [
  { value: "piece", label: "Piece" },
  { value: "scoop", label: "Scoop" },
  { value: "cup", label: "Cup" },
  { value: "cone", label: "Cone" },
  { value: "pack", label: "Pack" },
  { value: "ml", label: "Millilitre" },
  { value: "gram", label: "Gram" },
  { value: "kg", label: "Kilogram" },
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("icecream_user")) || {};
    } catch {
      return {};
    }
  }, []);

  const isAdmin = user?.role === "admin";

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (categoryFilter) {
        params.category = categoryFilter;
      }

      if (statusFilter !== "all") {
        params.isActive = statusFilter === "active";
      }

      if (availabilityFilter !== "all") {
        params.isAvailable = availabilityFilter === "available";
      }

      const response = await api.get("/products", { params });

      setProducts(response.data?.products || []);
    } catch (error) {
      console.error("Fetch products error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load products"
      );

      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    categoryFilter,
    statusFilter,
    availabilityFilter,
  ]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);

      const response = await api.get("/categories");

      setCategories(response.data?.categories || []);
    } catch (error) {
      console.error("Fetch categories error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load categories"
      );

      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const statistics = useMemo(() => {
    const total = products.length;

    const active = products.filter(
      (product) => product.isActive
    ).length;

    const available = products.filter(
      (product) => product.isAvailable
    ).length;

    const unavailable = products.filter(
      (product) => !product.isAvailable
    ).length;

    return {
      total,
      active,
      available,
      unavailable,
    };
  }, [products]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingProduct(null);
  };

  const openAddModal = () => {
    if (!isAdmin) {
      toast.info(
        "Only administrators can add products."
      );
      return;
    }

    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product) => {
    if (!isAdmin) {
      toast.info(
        "Only administrators can edit products."
      );
      return;
    }

    setEditingProduct(product);

    setForm({
      name: product.name || "",
      sku: product.sku || "",
      category:
        product.category?._id ||
        product.category ||
        "",
      description: product.description || "",
      image: product.image || "",
      price:
        product.price !== undefined
          ? product.price
          : "",
      costPrice:
        product.costPrice !== undefined
          ? product.costPrice
          : 0,
      taxRate:
        product.taxRate !== undefined
          ? product.taxRate
          : 5,
      unit: product.unit || "piece",
      lowStockThreshold:
        product.lowStockThreshold !== undefined
          ? product.lowStockThreshold
          : 10,
      isAvailable:
        product.isAvailable !== false,
      isActive:
        product.isActive !== false,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      toast.error(
        "You do not have permission to modify products."
      );
      return;
    }

    if (!form.name.trim()) {
      toast.error("Product name is required.");
      return;
    }

    if (!form.sku.trim()) {
      toast.error("SKU is required.");
      return;
    }

    if (!form.category) {
      toast.error("Please select a category.");
      return;
    }

    if (
      form.price === "" ||
      Number(form.price) < 0
    ) {
      toast.error("Please enter a valid selling price.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        category: form.category,
        description: form.description.trim(),
        image: form.image.trim(),
        price: Number(form.price),
        costPrice: Number(form.costPrice || 0),
        taxRate: Number(form.taxRate || 0),
        unit: form.unit,
        lowStockThreshold: Number(
          form.lowStockThreshold || 0
        ),
        isAvailable: Boolean(form.isAvailable),
        isActive: Boolean(form.isActive),
      };

      if (editingProduct) {
        await api.put(
          `/products/${editingProduct._id}`,
          payload
        );

        toast.success(
          "Product updated successfully."
        );
      } else {
        await api.post("/products", payload);

        toast.success(
          "Product created successfully."
        );
      }

      setShowModal(false);
      resetForm();

      await fetchProducts();
    } catch (error) {
      console.error("Save product error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to save product"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!isAdmin) {
      toast.info(
        "Only administrators can delete products."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(product._id);

      await api.delete(
        `/products/${product._id}`
      );

      toast.success(
        "Product deleted successfully."
      );

      await fetchProducts();
    } catch (error) {
      console.error("Delete product error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to delete product"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("all");
    setAvailabilityFilter("all");
  };

  const hasFilters =
    Boolean(search) ||
    Boolean(categoryFilter) ||
    statusFilter !== "all" ||
    availabilityFilter !== "all";

  const getCategoryName = (product) => {
    if (product.category?.name) {
      return product.category.name;
    }

    const category = categories.find(
      (item) =>
        item._id === product.category
    );

    return category?.name || "Uncategorized";
  };

  const getInitials = (name = "") => {
    const words = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!words.length) return "IC";

    if (words.length === 1) {
      return words[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  return (
    <div className="products-page">
      <div className="products-background">
        <div className="products-grid" />
        <div className="products-orb products-orb-one" />
        <div className="products-orb products-orb-two" />
      </div>

      <div className="products-container">
        <header className="products-header">
          <div className="products-heading">
            <div className="products-heading-icon">
              <FaBoxOpen />
            </div>

            <div>
              <div className="products-breadcrumb">
                <span>Management</span>
                <span>/</span>
                <strong>Products</strong>
              </div>

              <h1>Products</h1>

              <p>
                Manage your ice cream catalogue,
                pricing and availability.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              className="products-primary-btn"
              onClick={openAddModal}
            >
              <FaPlus />
              <span>Add Product</span>
            </button>
          )}
        </header>

        <section className="products-stat-grid">
          <div className="product-stat-card">
            <div className="product-stat-icon">
              <FaBoxOpen />
            </div>

            <div>
              <span>Total Products</span>
              <strong>{statistics.total}</strong>
            </div>
          </div>

          <div className="product-stat-card">
            <div className="product-stat-icon success">
              <FaCheckCircle />
            </div>

            <div>
              <span>Active Products</span>
              <strong>{statistics.active}</strong>
            </div>
          </div>

          <div className="product-stat-card">
            <div className="product-stat-icon available">
              <FaToggleOn />
            </div>

            <div>
              <span>Available</span>
              <strong>{statistics.available}</strong>
            </div>
          </div>

          <div className="product-stat-card">
            <div className="product-stat-icon warning">
              <FaToggleOff />
            </div>

            <div>
              <span>Unavailable</span>
              <strong>
                {statistics.unavailable}
              </strong>
            </div>
          </div>
        </section>

        <section className="products-panel">
          <div className="products-toolbar">
            <div className="products-search">
              <FaSearch />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by product name or SKU..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="search-clear"
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <button
              type="button"
              className={`filter-toggle ${
                showFilters ? "active" : ""
              }`}
              onClick={() =>
                setShowFilters(
                  (previous) => !previous
                )
              }
            >
              <FaFilter />
              <span>Filters</span>

              {hasFilters && (
                <b>
                  {
                    [
                      categoryFilter,
                      statusFilter !== "all"
                        ? statusFilter
                        : "",
                      availabilityFilter !== "all"
                        ? availabilityFilter
                        : "",
                    ].filter(Boolean).length
                  }
                </b>
              )}

              <FaChevronDown />
            </button>
          </div>

          {showFilters && (
            <div className="products-filters">
              <div className="filter-field">
                <label>Category</label>

                <div className="select-wrapper">
                  <FaLayerGroup />

                  <select
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      All Categories
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category._id}
                        value={category._id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <FaChevronDown />
                </div>
              </div>

              <div className="filter-field">
                <label>Status</label>

                <div className="select-wrapper">
                  <FaCircle />

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                  >
                    <option value="all">
                      All Status
                    </option>
                    <option value="active">
                      Active
                    </option>
                    <option value="inactive">
                      Inactive
                    </option>
                  </select>

                  <FaChevronDown />
                </div>
              </div>

              <div className="filter-field">
                <label>Availability</label>

                <div className="select-wrapper">
                  <FaCheckCircle />

                  <select
                    value={availabilityFilter}
                    onChange={(event) =>
                      setAvailabilityFilter(
                        event.target.value
                      )
                    }
                  >
                    <option value="all">
                      All Products
                    </option>
                    <option value="available">
                      Available
                    </option>
                    <option value="unavailable">
                      Unavailable
                    </option>
                  </select>

                  <FaChevronDown />
                </div>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  className="clear-filters-btn"
                  onClick={clearFilters}
                >
                  <FaTimes />
                  Clear Filters
                </button>
              )}
            </div>
          )}

          <div className="products-table-header">
            <div>
              <h2>Product Catalogue</h2>
              <span>
                {loading
                  ? "Loading..."
                  : `${products.length} product${
                      products.length === 1
                        ? ""
                        : "s"
                    }`}
              </span>
            </div>

            {categoriesLoading && (
              <div className="category-loading">
                <FaSpinner />
                Loading categories
              </div>
            )}
          </div>

          {loading ? (
            <div className="products-loading">
              <FaSpinner className="products-spinner" />

              <h3>Loading products</h3>

              <p>
                Fetching your product catalogue...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="products-empty">
              <div className="empty-icon">
                <FaBoxOpen />
              </div>

              <h3>
                {hasFilters
                  ? "No products found"
                  : "No products yet"}
              </h3>

              <p>
                {hasFilters
                  ? "Try changing your search or filters."
                  : "Start building your ice cream catalogue by adding your first product."}
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  className="empty-action"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              ) : (
                isAdmin && (
                  <button
                    type="button"
                    className="empty-action"
                    onClick={openAddModal}
                  >
                    <FaPlus />
                    Add First Product
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="products-table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Tax</th>
                    <th>Unit</th>
                    <th>Availability</th>
                    {isAdmin && (
                      <th className="actions-heading">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="product-name-cell">
                          <div className="product-image">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";

                                  event.currentTarget.parentElement.classList.add(
                                    "fallback"
                                  );
                                }}
                              />
                            ) : (
                              <span>
                                {getInitials(
                                  product.name
                                )}
                              </span>
                            )}
                          </div>

                          <div>
                            <strong>
                              {product.name}
                            </strong>

                            {product.description && (
                              <small>
                                {product.description}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="sku-badge">
                          {product.sku}
                        </span>
                      </td>

                      <td>
                        <div className="category-cell">
                          <FaTags />
                          {getCategoryName(product)}
                        </div>
                      </td>

                      <td>
                        <strong className="price-cell">
                          {formatCurrency(
                            product.price
                          )}
                        </strong>
                      </td>

                      <td>
                        <span className="tax-cell">
                          {product.taxRate ?? 0}%
                        </span>
                      </td>

                      <td>
                        <span className="unit-badge">
                          {product.unit || "piece"}
                        </span>
                      </td>

                      <td>
                        <div className="status-stack">
                          <span
                            className={`status-badge ${
                              product.isActive
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            <FaCircle />
                            {product.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>

                          <span
                            className={`availability-badge ${
                              product.isAvailable
                                ? "available"
                                : "unavailable"
                            }`}
                          >
                            {product.isAvailable
                              ? "Available"
                              : "Unavailable"}
                          </span>
                        </div>
                      </td>

                      {isAdmin && (
                        <td>
                          <div className="product-actions">
                            <button
                              type="button"
                              className="action-btn edit"
                              title="Edit product"
                              onClick={() =>
                                openEditModal(
                                  product
                                )
                              }
                            >
                              <FaEdit />
                            </button>

                            <button
                              type="button"
                              className="action-btn delete"
                              title="Delete product"
                              disabled={
                                deletingId ===
                                product._id
                              }
                              onClick={() =>
                                handleDelete(
                                  product
                                )
                              }
                            >
                              {deletingId ===
                              product._id ? (
                                <FaSpinner className="button-spinner" />
                              ) : (
                                <FaTrash />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div
          className="product-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <div className="product-modal-header">
              <div>
                <span className="modal-eyebrow">
                  {editingProduct
                    ? "PRODUCT MANAGEMENT"
                    : "NEW PRODUCT"}
                </span>

                <h2 id="product-modal-title">
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p>
                  {editingProduct
                    ? "Update your product information."
                    : "Add a new item to your catalogue."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <form
              className="product-form"
              onSubmit={handleSubmit}
            >
              <div className="form-section">
                <div className="form-section-title">
                  <FaBoxOpen />
                  <span>Basic Information</span>
                </div>

                <div className="form-grid">
                  <div className="form-field full">
                    <label>
                      Product Name
                      <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Belgian Chocolate Scoop"
                      maxLength={150}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      SKU
                      <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="sku"
                      value={form.sku}
                      onChange={handleChange}
                      placeholder="e.g. CHOC-001"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Category
                      <span>*</span>
                    </label>

                    <div className="form-select">
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="">
                          Select category
                        </option>

                        {categories.map(
                          (category) => (
                            <option
                              key={category._id}
                              value={category._id}
                            >
                              {category.name}
                            </option>
                          )
                        )}
                      </select>

                      <FaChevronDown />
                    </div>
                  </div>

                  <div className="form-field full">
                    <label>Description</label>

                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe the product..."
                      maxLength={1000}
                      rows={3}
                    />

                    <small>
                      {form.description.length}/1000
                    </small>
                  </div>

                  <div className="form-field full">
                    <label>
                      Image URL
                    </label>

                    <div className="input-with-icon">
                      <FaImage />

                      <input
                        type="url"
                        name="image"
                        value={form.image}
                        onChange={handleChange}
                        placeholder="https://example.com/product.jpg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">
                  <FaMoneyBillWave />
                  <span>Pricing & Inventory Settings</span>
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label>
                      Selling Price
                      <span>*</span>
                    </label>

                    <div className="input-with-icon currency">
                      <FaMoneyBillWave />

                      <input
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Cost Price</label>

                    <div className="input-with-icon currency">
                      <FaMoneyBillWave />

                      <input
                        type="number"
                        name="costPrice"
                        value={form.costPrice}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Tax Rate</label>

                    <div className="input-with-suffix">
                      <input
                        type="number"
                        name="taxRate"
                        value={form.taxRate}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span>%</span>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Unit</label>

                    <div className="form-select">
                      <select
                        name="unit"
                        value={form.unit}
                        onChange={handleChange}
                      >
                        {UNITS.map((unit) => (
                          <option
                            key={unit.value}
                            value={unit.value}
                          >
                            {unit.label}
                          </option>
                        ))}
                      </select>

                      <FaChevronDown />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>
                      Low Stock Threshold
                    </label>

                    <input
                      type="number"
                      name="lowStockThreshold"
                      value={
                        form.lowStockThreshold
                      }
                      onChange={handleChange}
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">
                  <FaCheckCircle />
                  <span>Product Status</span>
                </div>

                <div className="status-options">
                  <label
                    className={`status-option ${
                      form.isActive
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                    />

                    <div>
                      <strong>Active Product</strong>
                      <span>
                        Product is enabled in the
                        catalogue.
                      </span>
                    </div>

                    <span className="custom-checkbox">
                      {form.isActive && (
                        <FaCheckCircle />
                      )}
                    </span>
                  </label>

                  <label
                    className={`status-option ${
                      form.isAvailable
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={form.isAvailable}
                      onChange={handleChange}
                    />

                    <div>
                      <strong>
                        Available for Sale
                      </strong>
                      <span>
                        Customers can currently
                        purchase this product.
                      </span>
                    </div>

                    <span className="custom-checkbox">
                      {form.isAvailable && (
                        <FaCheckCircle />
                      )}
                    </span>
                  </label>
                </div>
              </div>

              <div className="product-modal-footer">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <FaSpinner className="button-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingProduct ? (
                        <FaEdit />
                      ) : (
                        <FaPlus />
                      )}

                      {editingProduct
                        ? "Update Product"
                        : "Create Product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;