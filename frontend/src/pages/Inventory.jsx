import { useCallback, useEffect, useMemo, useState } from "react";

import {
  FaBoxOpen,
  FaBoxes,
  FaCheckCircle,
  FaChevronDown,
  FaCircle,
  FaClock,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaHistory,
  FaMinus,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaTruck,
  FaUndo,
  FaWrench,
} from "react-icons/fa";

import { toast } from "react-toastify";

import api from "../api/api";
import "./Inventory.css";

const MOVEMENT_TYPES = [
  {
    value: "restock",
    label: "Restock",
    icon: FaTruck,
    description: "Add newly received stock",
    direction: "increase",
  },
  {
    value: "purchase",
    label: "Purchase",
    icon: FaBoxes,
    description: "Add purchased stock",
    direction: "increase",
  },
  {
    value: "return",
    label: "Return",
    icon: FaUndo,
    description: "Add returned stock",
    direction: "increase",
  },
  {
    value: "damage",
    label: "Damage",
    icon: FaMinus,
    description: "Remove damaged stock",
    direction: "decrease",
  },
  {
    value: "adjustment",
    label: "Adjustment",
    icon: FaWrench,
    description: "Set stock to an exact quantity",
    direction: "set",
  },
];

const getUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("icecream_user") || "null"
    );
  } catch {
    return null;
  }
};

const formatNumber = (value) => {
  const number = Number(value || 0);

  return Number.isInteger(number)
    ? number.toString()
    : number.toFixed(2).replace(/\.?0+$/, "");
};

const formatDate = (date) => {
  if (!date) return "Never";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStockStatus = (item) => {
  const current = Number(item.currentStock || 0);
  const threshold = Number(item.lowStockThreshold || 0);

  if (current <= 0) {
    return {
      key: "out",
      label: "Out of Stock",
      className: "stock-out",
    };
  }

  if (current <= threshold) {
    return {
      key: "low",
      label: "Low Stock",
      className: "stock-low",
    };
  }

  return {
    key: "healthy",
    label: "Healthy",
    className: "stock-healthy",
  };
};

const getMovementType = (type) => {
  return (
    MOVEMENT_TYPES.find(
      (movement) => movement.value === type
    ) || {
      value: type,
      label: type || "Unknown",
      icon: FaHistory,
      direction: "neutral",
    }
  );
};

const Inventory = () => {
  const user = useMemo(() => getUser(), []);
  const isAdmin = user?.role === "admin";

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [showAdjustModal, setShowAdjustModal] =
    useState(false);

  const [showMovementsModal, setShowMovementsModal] =
    useState(false);

  const [movements, setMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [adjustForm, setAdjustForm] = useState({
    type: "restock",
    quantity: "",
    reason: "",
  });

  const fetchInventory = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        const params = {};

        if (search.trim()) {
          params.search = search.trim();
        }

        if (statusFilter === "low") {
          params.lowStock = "true";
        }

        const response = await api.get("/inventory", {
          params,
        });

        setInventory(
          response.data?.inventory || []
        );
      } catch (error) {
        console.error(
          "Fetch inventory error:",
          error
        );

        toast.error(
          error.response?.data?.message ||
            "Unable to load inventory"
        );
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchInventory]);

  const statistics = useMemo(() => {
    const totalProducts = inventory.length;

    const outOfStock = inventory.filter(
      (item) =>
        Number(item.currentStock || 0) <= 0
    ).length;

    const lowStock = inventory.filter(
      (item) =>
        Number(item.currentStock || 0) > 0 &&
        Number(item.currentStock || 0) <=
          Number(item.lowStockThreshold || 0)
    ).length;

    const healthyStock = inventory.filter(
      (item) =>
        Number(item.currentStock || 0) >
        Number(item.lowStockThreshold || 0)
    ).length;

    const totalUnits = inventory.reduce(
      (sum, item) =>
        sum + Number(item.currentStock || 0),
      0
    );

    const totalAvailable = inventory.reduce(
      (sum, item) =>
        sum + Number(item.availableStock || 0),
      0
    );

    const totalReserved = inventory.reduce(
      (sum, item) =>
        sum + Number(item.reservedStock || 0),
      0
    );

    return {
      totalProducts,
      outOfStock,
      lowStock,
      healthyStock,
      totalUnits,
      totalAvailable,
      totalReserved,
    };
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const status = getStockStatus(item);

      if (
        statusFilter !== "all" &&
        status.key !== statusFilter
      ) {
        return false;
      }

      return true;
    });
  }, [inventory, statusFilter]);

  const openAdjustModal = (item) => {
    if (!isAdmin) return;

    setSelectedProduct(item);

    setAdjustForm({
      type: "restock",
      quantity: "",
      reason: "",
    });

    setShowAdjustModal(true);
  };

  const closeAdjustModal = () => {
    if (saving) return;

    setShowAdjustModal(false);
    setSelectedProduct(null);

    setAdjustForm({
      type: "restock",
      quantity: "",
      reason: "",
    });
  };

  const handleAdjustChange = (event) => {
    const { name, value } = event.target;

    setAdjustForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAdjustStock = async (event) => {
    event.preventDefault();

    if (!selectedProduct?.product?._id) {
      toast.error("Product information is missing");
      return;
    }

    const quantity = Number(
      adjustForm.quantity
    );

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error(
        "Quantity must be greater than zero"
      );
      return;
    }

    if (
      adjustForm.type === "damage" &&
      quantity >
        Number(
          selectedProduct.currentStock || 0
        )
    ) {
      toast.error(
        "Damage quantity cannot exceed current stock"
      );
      return;
    }

    if (
      adjustForm.type === "adjustment" &&
      quantity < 0
    ) {
      toast.error(
        "Stock quantity cannot be negative"
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.post(
        `/inventory/${selectedProduct.product._id}/adjust`,
        {
          type: adjustForm.type,
          quantity,
          reason: adjustForm.reason.trim(),
        }
      );

      toast.success(
        response.data?.message ||
          "Stock updated successfully"
      );

      closeAdjustModal();

      await fetchInventory(false);
    } catch (error) {
      console.error(
        "Adjust stock error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to update stock"
      );
    } finally {
      setSaving(false);
    }
  };

  const openMovementsModal = async (item) => {
    if (!item?.product?._id) {
      toast.error("Product information is missing");
      return;
    }

    setSelectedProduct(item);
    setShowMovementsModal(true);
    setMovements([]);
    setMovementsLoading(true);

    try {
      const response = await api.get(
        `/inventory/${item.product._id}/movements`
      );

      setMovements(
        response.data?.movements || []
      );
    } catch (error) {
      console.error(
        "Fetch movements error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to load stock history"
      );
    } finally {
      setMovementsLoading(false);
    }
  };

  const closeMovementsModal = () => {
    if (movementsLoading) return;

    setShowMovementsModal(false);
    setMovements([]);
    setSelectedProduct(null);
  };

  const clearSearch = () => {
    setSearch("");
  };

  return (
    <div className="inventory-page">
      <div className="inventory-background">
        <div className="inventory-grid" />
        <div className="inventory-orb inventory-orb-one" />
        <div className="inventory-orb inventory-orb-two" />
        <div className="inventory-glow" />
      </div>

      <div className="inventory-container">
        {/* Header */}
        <header className="inventory-header">
          <div className="inventory-heading">
            <div className="inventory-heading-icon">
              <FaBoxes />
            </div>

            <div>
              <div className="inventory-breadcrumb">
                <span>Workspace</span>
                <span>/</span>
                <strong>Inventory</strong>
              </div>

              <h1>Inventory Control</h1>

              <p>
                Monitor stock levels, manage adjustments,
                and track every inventory movement.
              </p>
            </div>
          </div>

          <div className="inventory-header-badge">
            <span className="inventory-live-dot" />
            Live Inventory
          </div>
        </header>

        {/* Statistics */}
        <section className="inventory-stats">
          <div className="inventory-stat-card">
            <div className="inventory-stat-icon">
              <FaBoxes />
            </div>

            <div className="inventory-stat-content">
              <span>Total Products</span>

              <strong>
                {statistics.totalProducts}
              </strong>

              <small>
                Tracked inventory items
              </small>
            </div>
          </div>

          <div className="inventory-stat-card inventory-stat-warning">
            <div className="inventory-stat-icon">
              <FaExclamationTriangle />
            </div>

            <div className="inventory-stat-content">
              <span>Low Stock</span>

              <strong>
                {statistics.lowStock}
              </strong>

              <small>Need attention</small>
            </div>
          </div>

          <div className="inventory-stat-card inventory-stat-danger">
            <div className="inventory-stat-icon">
              <FaBoxOpen />
            </div>

            <div className="inventory-stat-content">
              <span>Out of Stock</span>

              <strong>
                {statistics.outOfStock}
              </strong>

              <small>
                Currently unavailable
              </small>
            </div>
          </div>

          <div className="inventory-stat-card inventory-stat-success">
            <div className="inventory-stat-icon">
              <FaCheckCircle />
            </div>

            <div className="inventory-stat-content">
              <span>Healthy Stock</span>

              <strong>
                {statistics.healthyStock}
              </strong>

              <small>Above threshold</small>
            </div>
          </div>
        </section>

        {/* Summary strip */}
        <section className="inventory-summary-strip">
          <div className="inventory-summary-item">
            <span>Total Units</span>

            <strong>
              {formatNumber(
                statistics.totalUnits
              )}
            </strong>
          </div>

          <div className="inventory-summary-divider" />

          <div className="inventory-summary-item">
            <span>Available Units</span>

            <strong>
              {formatNumber(
                statistics.totalAvailable
              )}
            </strong>
          </div>

          <div className="inventory-summary-divider" />

          <div className="inventory-summary-item">
            <span>Reserved Units</span>

            <strong>
              {formatNumber(
                statistics.totalReserved
              )}
            </strong>
          </div>

          <div className="inventory-summary-divider" />

          <div className="inventory-summary-item">
            <span>Health Rate</span>

            <strong>
              {statistics.totalProducts
                ? `${Math.round(
                    (statistics.healthyStock /
                      statistics.totalProducts) *
                      100
                  )}%`
                : "0%"}
            </strong>
          </div>
        </section>

        {/* Toolbar */}
        <section className="inventory-toolbar">
          <div className="inventory-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="inventory-search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="inventory-filter">
            <FaFilter />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="all">
                All Stock
              </option>

              <option value="healthy">
                Healthy
              </option>

              <option value="low">
                Low Stock
              </option>

              <option value="out">
                Out of Stock
              </option>
            </select>

            <FaChevronDown className="inventory-select-arrow" />
          </div>

          <div className="inventory-result-count">
            <strong>
              {filteredInventory.length}
            </strong>

            <span>
              {filteredInventory.length === 1
                ? "product"
                : "products"}
            </span>
          </div>
        </section>

        {/* Inventory table */}
        <section className="inventory-table-card">
          <div className="inventory-table-header">
            <div>
              <h2>Stock Overview</h2>

              <p>
                Current inventory position across all
                products
              </p>
            </div>

            <div className="inventory-access-badge">
              {isAdmin
                ? "Administrator Access"
                : "Staff View"}
            </div>
          </div>

          {loading ? (
            <div className="inventory-state">
              <FaSpinner className="inventory-spinner" />

              <h3>Loading inventory</h3>

              <p>
                Fetching the latest stock information...
              </p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="inventory-state">
              <div className="inventory-empty-icon">
                <FaBoxes />
              </div>

              <h3>No inventory found</h3>

              <p>
                {search
                  ? "Try changing your search or filters."
                  : "Products will appear here once they are available."}
              </p>
            </div>
          ) : (
            <div className="inventory-table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Available</th>
                    <th>Threshold</th>
                    <th>Status</th>
                    <th>Last Restocked</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInventory.map((item) => {
                    const product =
                      item.product || {};

                    const status =
                      getStockStatus(item);

                    return (
                      <tr
                        key={
                          product._id ||
                          item._id
                        }
                      >
                        <td>
                          <div className="inventory-product">
                            <div className="inventory-product-image">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={
                                    product.name ||
                                    "Product"
                                  }
                                />
                              ) : (
                                <FaBoxOpen />
                              )}
                            </div>

                            <div className="inventory-product-info">
                              <strong>
                                {product.name ||
                                  "Unnamed Product"}
                              </strong>

                              <span>
                                SKU:{" "}
                                {product.sku ||
                                  "—"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="inventory-category">
                            {product.category
                              ?.name ||
                              "Uncategorized"}
                          </span>
                        </td>

                        <td>
                          <div className="inventory-stock-value">
                            <strong>
                              {formatNumber(
                                item.currentStock
                              )}
                            </strong>

                            <span>
                              {item.unit ||
                                product.unit ||
                                "piece"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="inventory-available">
                            <strong>
                              {formatNumber(
                                item.availableStock
                              )}
                            </strong>

                            {Number(
                              item.reservedStock ||
                                0
                            ) > 0 && (
                              <span>
                                {formatNumber(
                                  item.reservedStock
                                )}{" "}
                                reserved
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="inventory-threshold">
                            {formatNumber(
                              item.lowStockThreshold
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`inventory-status ${status.className}`}
                          >
                            <FaCircle />
                            {status.label}
                          </span>
                        </td>

                        <td>
                          <div className="inventory-date">
                            <span>
                              {formatDate(
                                item.lastRestockedAt
                              )}
                            </span>

                            <small>
                              {item.lastStockUpdateAt
                                ? `Updated ${formatDate(
                                    item.lastStockUpdateAt
                                  )}`
                                : "No updates yet"}
                            </small>
                          </div>
                        </td>

                        <td>
                          <div className="inventory-actions">
                            <button
                              type="button"
                              className="inventory-action-btn inventory-history-btn"
                              onClick={() =>
                                openMovementsModal(
                                  item
                                )
                              }
                              title="View stock history"
                            >
                              <FaHistory />
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                className="inventory-action-btn inventory-adjust-btn"
                                onClick={() =>
                                  openAdjustModal(
                                    item
                                  )
                                }
                                title="Adjust stock"
                              >
                                <FaWrench />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Mobile cards */}
        {!loading &&
          filteredInventory.length > 0 && (
            <section className="inventory-mobile-list">
              {filteredInventory.map((item) => {
                const product =
                  item.product || {};

                const status =
                  getStockStatus(item);

                return (
                  <article
                    className="inventory-mobile-card"
                    key={`mobile-${
                      product._id ||
                      item._id
                    }`}
                  >
                    <div className="inventory-mobile-top">
                      <div className="inventory-product">
                        <div className="inventory-product-image">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={
                                product.name ||
                                "Product"
                              }
                            />
                          ) : (
                            <FaBoxOpen />
                          )}
                        </div>

                        <div className="inventory-product-info">
                          <strong>
                            {product.name ||
                              "Unnamed Product"}
                          </strong>

                          <span>
                            SKU:{" "}
                            {product.sku ||
                              "—"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inventory-status ${status.className}`}
                      >
                        <FaCircle />
                        {status.label}
                      </span>
                    </div>

                    <div className="inventory-mobile-metrics">
                      <div>
                        <span>Current</span>

                        <strong>
                          {formatNumber(
                            item.currentStock
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Available</span>

                        <strong>
                          {formatNumber(
                            item.availableStock
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Threshold</span>

                        <strong>
                          {formatNumber(
                            item.lowStockThreshold
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="inventory-mobile-actions">
                      <button
                        type="button"
                        onClick={() =>
                          openMovementsModal(
                            item
                          )
                        }
                      >
                        <FaHistory />
                        History
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() =>
                            openAdjustModal(
                              item
                            )
                          }
                        >
                          <FaWrench />
                          Adjust Stock
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
      </div>

      {/* =========================
          ADJUST STOCK MODAL
      ========================== */}

      {showAdjustModal &&
        selectedProduct && (
          <div
            className="inventory-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeAdjustModal();
              }
            }}
          >
            <div className="inventory-modal">
              <div className="inventory-modal-header">
                <div>
                  <span className="inventory-modal-eyebrow">
                    Inventory Management
                  </span>

                  <h2>Adjust Stock</h2>

                  <p>
                    {
                      selectedProduct.product
                        ?.name
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="inventory-modal-close"
                  onClick={closeAdjustModal}
                  disabled={saving}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="inventory-current-stock">
                <div>
                  <span>Current Stock</span>

                  <strong>
                    {formatNumber(
                      selectedProduct.currentStock
                    )}
                  </strong>
                </div>

                <div>
                  <span>Available</span>

                  <strong>
                    {formatNumber(
                      selectedProduct.availableStock
                    )}
                  </strong>
                </div>

                <div>
                  <span>Unit</span>

                  <strong>
                    {selectedProduct.unit ||
                      "piece"}
                  </strong>
                </div>
              </div>

              <form
                className="inventory-adjust-form"
                onSubmit={handleAdjustStock}
              >
                <div className="inventory-form-group">
                  <label htmlFor="movement-type">
                    Movement Type
                  </label>

                  <div className="inventory-movement-grid">
                    {MOVEMENT_TYPES.map(
                      (movement) => {
                        const Icon =
                          movement.icon;

                        return (
                          <button
                            type="button"
                            key={movement.value}
                            className={`inventory-movement-option ${
                              adjustForm.type ===
                              movement.value
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              setAdjustForm(
                                (previous) => ({
                                  ...previous,
                                  type:
                                    movement.value,
                                })
                              )
                            }
                          >
                            <Icon />

                            <span>
                              {movement.label}
                            </span>

                            <small>
                              {
                                movement.description
                              }
                            </small>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="inventory-form-group">
                  <label htmlFor="stock-quantity">
                    {adjustForm.type ===
                    "adjustment"
                      ? "New Stock Quantity"
                      : "Quantity"}
                  </label>

                  <div className="inventory-number-input">
                    <FaBoxes />

                    <input
                      id="stock-quantity"
                      name="quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder={
                        adjustForm.type ===
                        "adjustment"
                          ? "Enter final stock"
                          : "Enter quantity"
                      }
                      value={
                        adjustForm.quantity
                      }
                      onChange={
                        handleAdjustChange
                      }
                      required
                    />
                  </div>

                  {adjustForm.type ===
                    "adjustment" && (
                    <small className="inventory-field-help">
                      This will set the stock to
                      the exact quantity entered.
                    </small>
                  )}
                </div>

                <div className="inventory-form-group">
                  <label htmlFor="stock-reason">
                    Reason
                    <span>Optional</span>
                  </label>

                  <textarea
                    id="stock-reason"
                    name="reason"
                    rows="4"
                    maxLength="500"
                    placeholder="Add a reason for this stock movement..."
                    value={
                      adjustForm.reason
                    }
                    onChange={
                      handleAdjustChange
                    }
                  />

                  <div className="inventory-character-count">
                    {adjustForm.reason.length}
                    /500
                  </div>
                </div>

                <div className="inventory-form-actions">
                  <button
                    type="button"
                    className="inventory-cancel-btn"
                    onClick={closeAdjustModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="inventory-submit-btn"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <FaSpinner className="inventory-spinner" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        Update Stock
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* =========================
          MOVEMENT HISTORY MODAL
      ========================== */}

      {showMovementsModal &&
        selectedProduct && (
          <div
            className="inventory-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeMovementsModal();
              }
            }}
          >
            <div className="inventory-history-modal">
              <div className="inventory-modal-header">
                <div>
                  <span className="inventory-modal-eyebrow">
                    Inventory Activity
                  </span>

                  <h2>Stock History</h2>

                  <p>
                    {
                      selectedProduct.product
                        ?.name
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="inventory-modal-close"
                  onClick={
                    closeMovementsModal
                  }
                  disabled={movementsLoading}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="inventory-history-summary">
                <div>
                  <span>Current Stock</span>

                  <strong>
                    {formatNumber(
                      selectedProduct.currentStock
                    )}
                  </strong>
                </div>

                <div>
                  <span>Available</span>

                  <strong>
                    {formatNumber(
                      selectedProduct.availableStock
                    )}
                  </strong>
                </div>

                <div>
                  <span>Movements</span>

                  <strong>
                    {movements.length}
                  </strong>
                </div>
              </div>

              {movementsLoading ? (
                <div className="inventory-history-state">
                  <FaSpinner className="inventory-spinner" />

                  <p>
                    Loading stock history...
                  </p>
                </div>
              ) : movements.length === 0 ? (
                <div className="inventory-history-state">
                  <FaHistory />

                  <h3>No movements yet</h3>

                  <p>
                    Stock activity for this product
                    will appear here.
                  </p>
                </div>
              ) : (
                <div className="inventory-history-list">
                  {movements.map(
                    (movement) => {
                      const movementInfo =
                        getMovementType(
                          movement.type
                        );

                      const Icon =
                        movementInfo.icon;

                      const isDecrease =
                        movement.type ===
                        "damage";

                      return (
                        <div
                          className="inventory-history-item"
                          key={movement._id}
                        >
                          <div
                            className={`inventory-history-icon ${
                              isDecrease
                                ? "decrease"
                                : movement.type ===
                                  "adjustment"
                                ? "adjustment"
                                : "increase"
                            }`}
                          >
                            <Icon />
                          </div>

                          <div className="inventory-history-main">
                            <div className="inventory-history-title">
                              <strong>
                                {
                                  movementInfo.label
                                }
                              </strong>

                              <span>
                                {isDecrease
                                  ? "-"
                                  : movement.type ===
                                    "adjustment"
                                  ? "→"
                                  : "+"}
                                {formatNumber(
                                  movement.quantity
                                )}
                              </span>
                            </div>

                            <div className="inventory-history-stock">
                              <span>
                                {formatNumber(
                                  movement.previousStock
                                )}
                              </span>

                              <FaChevronDown />

                              <strong>
                                {formatNumber(
                                  movement.newStock
                                )}
                              </strong>
                            </div>

                            {movement.reason && (
                              <p>
                                {
                                  movement.reason
                                }
                              </p>
                            )}

                            <div className="inventory-history-meta">
                              <span>
                                <FaClock />

                                {formatDateTime(
                                  movement.createdAt
                                )}
                              </span>

                              {movement.createdBy && (
                                <span>
                                  <FaEye />

                                  {movement
                                    .createdBy
                                    .name ||
                                    movement
                                      .createdBy
                                      .email ||
                                    "User"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default Inventory;