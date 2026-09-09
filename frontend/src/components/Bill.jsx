// src/pages/Billing.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaCashRegister,
  FaCheckCircle,
  FaChevronDown,
  FaSearch,
  FaShoppingCart,
  FaUser,
  FaUserPlus,
  FaWallet,
} from "react-icons/fa";
import { toast } from "react-toastify";

import api from "../api/api";
import ProductCard from "../components/ProductCard";
import Cart from "../components/Cart";
import Bill from "../components/Bill";

import "./Billing.css";

const PAYMENT_METHODS = [
  {
    value: "cash",
    label: "Cash",
    icon: <FaCashRegister />,
  },
  {
    value: "upi",
    label: "UPI",
    icon: <FaWallet />,
  },
  {
    value: "card",
    label: "Card",
    icon: <FaWallet />,
  },
];

const EMPTY_CART = [];

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const getCustomerId = (customer) => {
  if (!customer) return null;

  return (
    customer._id ||
    customer.id ||
    customer.user?._id ||
    customer.user?.id ||
    null
  );
};

const getProductId = (product) => {
  if (!product) return null;

  return product._id || product.id || null;
};

const getProductName = (product) => {
  if (!product) return "Product";

  return (
    product.name ||
    product.productName ||
    product.title ||
    "Product"
  );
};

const getProductPrice = (product) => {
  if (!product) return 0;

  return Number(
    product.price ??
      product.sellingPrice ??
      product.unitPrice ??
      0
  );
};

const getTaxRate = (product) => {
  if (!product) return 0;

  return Number(
    product.taxRate ??
      product.gstRate ??
      product.tax ??
      0
  );
};

function Billing() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [cartItems, setCartItems] = useState(EMPTY_CART);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [processing, setProcessing] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const [lastBillNumber, setLastBillNumber] = useState("");
  const [lastBillTotal, setLastBillTotal] = useState(0);

  const [lastCompletedOrder, setLastCompletedOrder] = useState(null);

  /* =========================================================
     FETCH PRODUCTS
  ========================================================= */

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);

      const response = await api.get("/products", {
        params: {
          search: search.trim() || undefined,
          category:
            selectedCategory !== "all"
              ? selectedCategory
              : undefined,
          isActive: true,
          isAvailable: true,
        },
      });

      const data =
        response?.data?.data ||
        response?.data?.products ||
        response?.data ||
        [];

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch products:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to load products."
      );

      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  /* =========================================================
     FETCH CATEGORIES
  ========================================================= */

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories/active");

      const data =
        response?.data?.data ||
        response?.data?.categories ||
        response?.data ||
        [];

      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /* =========================================================
     FETCH CUSTOMERS
  ========================================================= */

  const fetchCustomers = useCallback(async (value = "") => {
    try {
      setLoadingCustomers(true);

      const response = await api.get("/customers", {
        params: {
          search: value.trim() || undefined,
          isActive: true,
          limit: 20,
          page: 1,
        },
      });

      const data =
        response?.data?.data ||
        response?.data?.customers ||
        response?.data ||
        [];

      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    if (!showCustomerDropdown) return;

    const timer = setTimeout(() => {
      fetchCustomers(customerSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    customerSearch,
    showCustomerDropdown,
    fetchCustomers,
  ]);

  /* =========================================================
     CART HELPERS
  ========================================================= */

  const addToCart = (product) => {
    const productId = getProductId(product);

    if (!productId) {
      toast.error("Invalid product.");
      return;
    }

    setCartItems((current) => {
      const existing = current.find(
        (item) => getProductId(item.product) === productId
      );

      if (existing) {
        return current.map((item) =>
          getProductId(item.product) === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          product,
          quantity: 1,
          price: getProductPrice(product),
          taxRate: getTaxRate(product),
        },
      ];
    });
  };

  const increaseQuantity = (productId) => {
    setCartItems((current) =>
      current.map((item) =>
        getProductId(item.product) === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (productId) => {
    setCartItems((current) =>
      current
        .map((item) =>
          getProductId(item.product) === productId
            ? {
                ...item,
                quantity: Math.max(0, item.quantity - 1),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((current) =>
      current.filter(
        (item) => getProductId(item.product) !== productId
      )
    );
  };

  /* =========================================================
     TOTALS
  ========================================================= */

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      return (
        sum +
        Number(item.price || getProductPrice(item.product)) *
          Number(item.quantity || 0)
      );
    }, 0);

    const tax = cartItems.reduce((sum, item) => {
      const price =
        Number(item.price || getProductPrice(item.product)) *
        Number(item.quantity || 0);

      const taxRate = Number(
        item.taxRate ?? getTaxRate(item.product)
      );

      return sum + (price * taxRate) / 100;
    }, 0);

    const safeDiscount = Math.min(
      Math.max(Number(discount) || 0, 0),
      subtotal + tax
    );

    const total = Math.max(
      subtotal + tax - safeDiscount,
      0
    );

    return {
      subtotal,
      tax,
      discount: safeDiscount,
      total,
    };
  }, [cartItems, discount]);

  /* =========================================================
     CUSTOMER
  ========================================================= */

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
  };

  /* =========================================================
     BUILD ORDER PAYLOAD
  ========================================================= */

  const buildOrderPayload = () => {
    const customerId = getCustomerId(selectedCustomer);

    const items = cartItems.map((item) => {
      const product = item.product;

      const productId = getProductId(product);

      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(
        item.price || getProductPrice(product)
      );

      const taxRate = Number(
        item.taxRate ?? getTaxRate(product)
      );

      return {
        product: productId,
        quantity,
        unitPrice,
        taxRate,
      };
    });

    return {
      customer: customerId || undefined,

      items,

      discountAmount: Number(totals.discount.toFixed(2)),

      paymentMethod,

      orderType: "pos",

      status: "pending",
    };
  };

  /* =========================================================
     EXTRACT ORDER FROM RESPONSE
  ========================================================= */

  const extractOrder = (response) => {
    return (
      response?.data?.data ||
      response?.data?.order ||
      response?.data
    );
  };

  const extractOrderId = (order) => {
    return order?._id || order?.id || null;
  };

  const extractOrderNumber = (order) => {
    return (
      order?.orderNumber ||
      order?.billNumber ||
      order?.invoiceNumber ||
      order?._id ||
      "N/A"
    );
  };

  /* =========================================================
     COMPLETE BILL
  ========================================================= */

  const handleCompleteBill = async () => {
    if (!cartItems.length) {
      toast.warning("Please add at least one product.");
      return;
    }

    if (processing) return;

    if (totals.total <= 0) {
      toast.error("Bill total must be greater than ₹0.");
      return;
    }

    try {
      setProcessing(true);

      /* -----------------------------------------------
         STEP 1: CREATE ORDER
      ------------------------------------------------ */

      const orderPayload = buildOrderPayload();

      const orderResponse = await api.post(
        "/orders",
        orderPayload
      );

      if (!orderResponse?.data?.success) {
        throw new Error(
          orderResponse?.data?.message ||
            "Failed to create order."
        );
      }

      const order = extractOrder(orderResponse);

      const orderId = extractOrderId(order);

      if (!orderId) {
        throw new Error(
          "Order was created but no order ID was returned."
        );
      }

      /* -----------------------------------------------
         STEP 2: RECORD MANUAL PAYMENT
      ------------------------------------------------ */

      const paymentResponse = await api.post(
        "/payments/manual",
        {
          orderId,
          paymentMethod,
          amount: Number(totals.total.toFixed(2)),
        }
      );

      if (!paymentResponse?.data?.success) {
        throw new Error(
          paymentResponse?.data?.message ||
            "Payment could not be recorded."
        );
      }

      /* -----------------------------------------------
         SAVE SUCCESS INFORMATION BEFORE CLEARING CART
      ------------------------------------------------ */

      const billNumber = extractOrderNumber(order);

      const completedTotal = totals.total;

      setLastBillNumber(billNumber);
      setLastBillTotal(completedTotal);
      setLastCompletedOrder(order);

      /* -----------------------------------------------
         CLEAR CURRENT BILL
      ------------------------------------------------ */

      setCartItems([]);
      setSelectedCustomer(null);
      setCustomerSearch("");
      setDiscount(0);
      setPaymentMethod("cash");

      setShowSuccess(true);

      toast.success("Bill completed successfully!");
    } catch (error) {
      console.error("Complete bill error:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to complete bill.";

      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  /* =========================================================
     PRINT
  ========================================================= */

  const handlePrint = () => {
    if (!lastCompletedOrder && !cartItems.length) {
      toast.warning("No bill available to print.");
      return;
    }

    window.print();
  };

  /* =========================================================
     START NEW BILL
  ========================================================= */

  const startNewBill = () => {
    setShowSuccess(false);

    setCartItems([]);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setDiscount(0);
    setPaymentMethod("cash");

    setLastBillNumber("");
    setLastBillTotal(0);
    setLastCompletedOrder(null);
  };

  /* =========================================================
     BACK
  ========================================================= */

  const handleBack = () => {
    window.history.back();
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="billing-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="billing-header">

        <div className="billing-header-left">

          <button
            type="button"
            className="billing-back-btn"
            onClick={handleBack}
          >
            <FaArrowLeft />
          </button>

          <div>
            <div className="billing-eyebrow">
              POINT OF SALE
            </div>

            <h1>
              Create New Bill
            </h1>

            <p>
              Select products, add customer details,
              and complete the transaction.
            </p>
          </div>

        </div>

        <div className="billing-header-icon">
          <FaShoppingCart />
        </div>

      </header>

      {/* =====================================================
          MAIN LAYOUT
      ===================================================== */}

      <main className="billing-layout">

        {/* ===================================================
            LEFT — PRODUCTS
        =================================================== */}

        <section className="billing-products-section">

          <div className="billing-section-heading">

            <div>
              <span className="section-kicker">
                PRODUCTS
              </span>

              <h2>
                Choose Ice Cream
              </h2>
            </div>

            <div className="product-count">
              {products.length} products
            </div>

          </div>

          {/* SEARCH */}

          <div className="billing-search-wrapper">

            <FaSearch />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search products..."
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}

          </div>

          {/* CATEGORIES */}

          <div className="billing-category-scroll">

            <button
              type="button"
              className={`category-pill ${
                selectedCategory === "all"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setSelectedCategory("all")
              }
            >
              All
            </button>

            {categories.map((category) => {

              const categoryId =
                category?._id || category?.id;

              const categoryName =
                category?.name ||
                category?.categoryName ||
                "Category";

              return (
                <button
                  type="button"
                  key={categoryId}
                  className={`category-pill ${
                    selectedCategory === categoryId
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedCategory(categoryId)
                  }
                >
                  {categoryName}
                </button>
              );
            })}

          </div>

          {/* PRODUCTS GRID */}

          {loadingProducts ? (
            <div className="billing-loading">
              <div className="billing-spinner" />
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="billing-empty">

              <div className="billing-empty-icon">
                <FaSearch />
              </div>

              <h3>
                No products found
              </h3>

              <p>
                Try another search or category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
              >
                Clear Filters
              </button>

            </div>
          ) : (
            <div className="billing-products-grid">

              {products.map((product) => (
                <ProductCard
                  key={getProductId(product)}
                  product={product}
                  onAdd={() => addToCart(product)}
                />
              ))}

            </div>
          )}

        </section>

        {/* ===================================================
            RIGHT — CHECKOUT
        =================================================== */}

        <aside className="billing-checkout-section">

          {/* CUSTOMER */}

          <div className="billing-panel">

            <div className="billing-panel-header">

              <div>
                <span className="section-kicker">
                  CUSTOMER
                </span>

                <h3>
                  Customer Details
                </h3>
              </div>

              <FaUser />
            </div>

            {selectedCustomer ? (

              <div className="selected-customer">

                <div className="customer-avatar">
                  {(
                    selectedCustomer.name ||
                    selectedCustomer.user?.name ||
                    "C"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="customer-info">

                  <strong>
                    {selectedCustomer.name ||
                      selectedCustomer.user?.name ||
                      "Customer"}
                  </strong>

                  <span>
                    {selectedCustomer.phone ||
                      selectedCustomer.user?.phone ||
                      "No phone"}
                  </span>

                </div>

                <button
                  type="button"
                  onClick={clearCustomer}
                  className="remove-customer"
                >
                  ×
                </button>

              </div>

            ) : (

              <div className="customer-selector">

                <div className="customer-search">

                  <FaUser />

                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(event) => {
                      setCustomerSearch(
                        event.target.value
                      );

                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() =>
                      setShowCustomerDropdown(true)
                    }
                    placeholder="Search customer..."
                  />

                  <FaChevronDown />

                </div>

                {showCustomerDropdown && (

                  <div className="customer-dropdown">

                    {loadingCustomers ? (

                      <div className="dropdown-loading">
                        Loading customers...
                      </div>

                    ) : customers.length > 0 ? (

                      customers.map((customer) => {

                        const customerId =
                          getCustomerId(customer);

                        const name =
                          customer?.name ||
                          customer?.user?.name ||
                          "Customer";

                        const phone =
                          customer?.phone ||
                          customer?.user?.phone ||
                          "";

                        return (
                          <button
                            type="button"
                            key={customerId}
                            className="customer-option"
                            onClick={() =>
                              handleCustomerSelect(
                                customer
                              )
                            }
                          >

                            <div className="customer-option-avatar">
                              {name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {name}
                              </strong>

                              {phone && (
                                <span>
                                  {phone}
                                </span>
                              )}
                            </div>

                          </button>
                        );
                      })

                    ) : (

                      <div className="no-customers">

                        <FaUserPlus />

                        <span>
                          No customers found
                        </span>

                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

          </div>

          {/* CART */}

          <div className="billing-panel cart-panel">

            <div className="billing-panel-header">

              <div>
                <span className="section-kicker">
                  ORDER
                </span>

                <h3>
                  Your Cart
                </h3>
              </div>

              <span className="cart-count">
                {cartItems.reduce(
                  (sum, item) =>
                    sum + Number(item.quantity || 0),
                  0
                )}
              </span>

            </div>

            <Cart
              cartItems={cartItems}
              onIncrease={increaseQuantity}
              onDecrease={decreaseQuantity}
              onRemove={removeFromCart}
            />

          </div>

          {/* BILL */}

          <div className="billing-panel">

            <Bill
              cartItems={cartItems}
              discount={discount}
              onDiscountChange={setDiscount}
              onPrint={handlePrint}
            />

          </div>

          {/* PAYMENT */}

          <div className="billing-panel payment-panel">

            <div className="billing-panel-header">

              <div>
                <span className="section-kicker">
                  PAYMENT
                </span>

                <h3>
                  Payment Method
                </h3>
              </div>

              <FaWallet />

            </div>

            <div className="payment-method-grid">

              {PAYMENT_METHODS.map((method) => (

                <button
                  type="button"
                  key={method.value}
                  className={`payment-method ${
                    paymentMethod === method.value
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setPaymentMethod(
                      method.value
                    )
                  }
                >

                  <span className="payment-method-icon">
                    {method.icon}
                  </span>

                  <span>
                    {method.label}
                  </span>

                </button>

              ))}

            </div>

          </div>

          {/* COMPLETE BILL */}

          <button
            type="button"
            className="complete-bill-btn"
            disabled={
              !cartItems.length ||
              processing
            }
            onClick={handleCompleteBill}
          >

            {processing ? (
              <>
                <span className="button-spinner" />
                Processing...
              </>
            ) : (
              <>
                <FaCheckCircle />

                <span>
                  Complete Bill
                </span>

                <strong>
                  {formatCurrency(totals.total)}
                </strong>
              </>
            )}

          </button>

        </aside>

      </main>

      {/* =====================================================
          SUCCESS MODAL
      ===================================================== */}

      {showSuccess && (

        <div className="success-overlay">

          <div className="success-modal">

            <div className="success-icon">
              <FaCheckCircle />
            </div>

            <span className="success-kicker">
              TRANSACTION COMPLETE
            </span>

            <h2>
              Bill Created Successfully
            </h2>

            <p>
              The payment has been recorded and
              inventory has been updated.
            </p>

            <div className="success-details">

              <div className="success-detail-row">

                <span>
                  Bill Number
                </span>

                <strong>
                  {lastBillNumber || "N/A"}
                </strong>

              </div>

              <div className="success-detail-row">

                <span>
                  Payment
                </span>

                <strong>
                  {
                    PAYMENT_METHODS.find(
                      (method) =>
                        method.value ===
                        paymentMethod
                    )?.label || "Cash"
                  }
                </strong>

              </div>

              <div className="success-total-label">
                Total Paid
              </div>

              <div className="success-total">
                {formatCurrency(lastBillTotal)}
              </div>

            </div>

            <div className="success-actions">

              <button
                type="button"
                className="success-print-btn"
                onClick={handlePrint}
              >
                Print Bill
              </button>

              <button
                type="button"
                className="success-new-btn"
                onClick={startNewBill}
              >
                Start New Bill
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Billing;