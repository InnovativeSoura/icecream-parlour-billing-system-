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

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

// =====================================================
// BILLING PAGE
// =====================================================

const Billing = () => {
  // ===================================================
  // DATA
  // ===================================================

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [cartItems, setCartItems] = useState([]);

  // ===================================================
  // LOADING
  // ===================================================

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [processing, setProcessing] = useState(false);

  // ===================================================
  // SEARCH / FILTERS
  // ===================================================

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // ===================================================
  // CUSTOMER
  // ===================================================

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] =
    useState(false);

  // ===================================================
  // BILL
  // ===================================================

  const [discount, setDiscount] = useState(0);

  // ===================================================
  // PAYMENT
  // ===================================================

  const [paymentMethod, setPaymentMethod] = useState("cash");

  // ===================================================
  // SUCCESS
  // ===================================================

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastBillNumber, setLastBillNumber] = useState("");
  const [lastBillTotal, setLastBillTotal] = useState(0);
  const [lastPaymentMethod, setLastPaymentMethod] =
    useState("");

  // ===================================================
  // LOAD PRODUCTS
  // ===================================================

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);

      const response = await api.get("/products", {
        params: {
          search: search || undefined,
          category:
            selectedCategory !== "all"
              ? selectedCategory
              : undefined,
          isActive: true,
          isAvailable: true,
        },
      });

      const data = response.data;

      setProducts(
        data.products ||
          data.data ||
          (Array.isArray(data) ? data : []),
      );
    } catch (error) {
      console.error("Failed to load products:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load products",
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

  // ===================================================
  // LOAD CATEGORIES
  // ===================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get(
          "/categories/active",
        );

        const data = response.data;

        setCategories(
          data.categories ||
            data.data ||
            (Array.isArray(data) ? data : []),
        );
      } catch (error) {
        console.error(
          "Failed to load categories:",
          error,
        );
      }
    };

    fetchCategories();
  }, []);

  // ===================================================
  // LOAD CUSTOMERS
  // ===================================================

  const fetchCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);

      const response = await api.get("/customers", {
        params: {
          search: customerSearch || undefined,
          isActive: true,
          limit: 20,
          page: 1,
        },
      });

      const data = response.data;

      setCustomers(
        data.customers ||
          data.data ||
          (Array.isArray(data) ? data : []),
      );
    } catch (error) {
      console.error(
        "Failed to load customers:",
        error,
      );

      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, [customerSearch]);

  useEffect(() => {
    if (!showCustomerDropdown) {
      return;
    }

    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    customerSearch,
    showCustomerDropdown,
    fetchCustomers,
  ]);

  // ===================================================
  // CATEGORY ID
  // ===================================================

  const getCategoryId = (category) => {
    if (!category) {
      return "";
    }

    if (typeof category === "object") {
      return category._id || category.id || "";
    }

    return category;
  };

  // ===================================================
  // ADD TO CART
  // ===================================================

  const addToCart = (product) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item._id === product._id,
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    toast.success(`${product.name} added to cart`, {
      autoClose: 1200,
    });
  };

  // ===================================================
  // REMOVE FROM CART
  // ===================================================

  const removeFromCart = (productId) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => item._id !== productId,
      ),
    );
  };

  // ===================================================
  // INCREASE QUANTITY
  // ===================================================

  const increaseQuantity = (productId) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item._id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  };

  // ===================================================
  // DECREASE QUANTITY
  // ===================================================

  const decreaseQuantity = (productId) => {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item._id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  // ===================================================
  // CART TOTALS
  // ===================================================

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0,
    );

    const tax = cartItems.reduce((sum, item) => {
      const itemSubtotal =
        Number(item.price || 0) *
        Number(item.quantity || 0);

      const taxRate = Number(item.taxRate || 0);

      return (
        sum + (itemSubtotal * taxRate) / 100
      );
    }, 0);

    const discountAmount = Math.min(
      Math.max(Number(discount || 0), 0),
      subtotal,
    );

    const total = Math.max(
      subtotal + tax - discountAmount,
      0,
    );

    return {
      subtotal,
      tax,
      discount: discountAmount,
      total,
    };
  }, [cartItems, discount]);

  // ===================================================
  // SELECT CUSTOMER
  // ===================================================

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
    setCustomerSearch("");
  };

  // ===================================================
  // CLEAR CUSTOMER
  // ===================================================

  const clearCustomer = () => {
    setSelectedCustomer(null);
  };

  // ===================================================
  // NEW BILL
  // ===================================================

  const startNewBill = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setPaymentMethod("cash");
    setShowSuccess(false);
    setLastBillNumber("");
    setLastBillTotal(0);
    setLastPaymentMethod("");
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  // ===================================================
  // PRINT BILL
  // ===================================================

  const handlePrint = () => {
    if (!cartItems.length && !lastBillNumber) {
      toast.warning(
        "Add at least one product before printing",
      );
      return;
    }

    window.print();
  };

  // ===================================================
  // CREATE INTERNAL ORDER
  // ===================================================

  const createInternalOrder = async () => {
    const orderPayload = {
      customer: selectedCustomer?._id || null,

      items: cartItems.map((item) => ({
        product: item._id,
        quantity: Number(item.quantity),
      })),

      discountAmount: Number(
        totals.discount || 0,
      ),

      notes: "",

      paymentMethod:
        paymentMethod === "razorpay"
          ? "razorpay"
          : paymentMethod,

      orderType: "pos",
    };

    const response = await api.post(
      "/orders",
      orderPayload,
    );

    const createdOrder =
      response.data?.order ||
      response.data?.data?.order;

    if (!createdOrder) {
      throw new Error(
        "Order was created but no order data was returned.",
      );
    }

    return createdOrder;
  };

  // ===================================================
  // MANUAL PAYMENT
  // ===================================================

  const processManualPayment = async (
    createdOrder,
  ) => {
    const response = await api.post(
      "/payments/manual",
      {
        orderId:
          createdOrder._id ||
          createdOrder.id,

        paymentMethod,

        reference: "",
      },
    );

    const paymentData =
      response.data?.data;

    if (!paymentData?.order) {
      throw new Error(
        "Payment was processed but no order data was returned.",
      );
    }

    return paymentData;
  };

  // ===================================================
  // RAZORPAY PAYMENT
  // ===================================================

  const processRazorpayPayment = async (
    createdOrder,
  ) => {
    const razorpayLoaded =
      await loadRazorpayScript();

    if (!razorpayLoaded) {
      throw new Error(
        "Unable to load Razorpay Checkout. Please check your internet connection.",
      );
    }

    // -----------------------------------------------
    // CREATE RAZORPAY ORDER
    // -----------------------------------------------

    const createResponse =
      await api.post(
        "/payments/razorpay/create-order",
        {
          orderId:
            createdOrder._id ||
            createdOrder.id,
        },
      );

    const razorpayData =
      createResponse.data?.data;

    if (!razorpayData) {
      throw new Error(
        "Razorpay order information was not returned.",
      );
    }

    // -----------------------------------------------
    // OPEN RAZORPAY CHECKOUT
    // -----------------------------------------------

    return new Promise((resolve, reject) => {
      let completed = false;

      const options = {
        key: razorpayData.keyId,

        amount: razorpayData.amount,

        currency:
          razorpayData.currency || "INR",

        name: "Ice Cream Parlour",

        description:
          `Payment for ${razorpayData.orderNumber}`,

        order:
          razorpayData.razorpayOrderId,

        prefill: {
          name:
            razorpayData.customer?.name ||
            "",

          email:
            razorpayData.customer?.email ||
            "",

          contact:
            razorpayData.customer?.phone ||
            "",
        },

        notes: {
          orderNumber:
            razorpayData.orderNumber,
        },

        theme: {
          color: "#7c3aed",
        },

        handler: async (paymentResponse) => {
          if (completed) {
            return;
          }

          try {
            // -----------------------------------------
            // SERVER-SIDE VERIFICATION
            // -----------------------------------------

            const verifyResponse =
              await api.post(
                "/payments/razorpay/verify",
                {
                  orderId:
                    createdOrder._id ||
                    createdOrder.id,

                  paymentId:
                    razorpayData.paymentId,

                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,

                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,

                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                },
              );

            completed = true;

            resolve(
              verifyResponse.data?.data ||
                verifyResponse.data,
            );
          } catch (error) {
            reject(error);
          }
        },

        modal: {
          ondismiss: () => {
            if (!completed) {
              reject(
                new Error(
                  "Razorpay payment window was closed.",
                ),
              );
            }
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        (response) => {
          if (completed) {
            return;
          }

          const reason =
            response.error?.description ||
            "Razorpay payment failed.";

          reject(new Error(reason));
        },
      );

      razorpay.open();
    });
  };

  // ===================================================
  // COMPLETE BILL
  // ===================================================

  const handleCompleteBill = async () => {
    if (processing) {
      return;
    }

    if (cartItems.length === 0) {
      toast.error(
        "Please add at least one product.",
      );
      return;
    }

    if (totals.total <= 0) {
      toast.error(
        "The bill total must be greater than ₹0.",
      );
      return;
    }

    // -----------------------------------------------
    // SNAPSHOT TOTAL BEFORE CLEARING CART
    // -----------------------------------------------

    const billTotal = totals.total;
    const selectedPaymentMethod = paymentMethod;

    try {
      setProcessing(true);

      // ---------------------------------------------
      // STEP 1: CREATE INTERNAL ORDER
      // ---------------------------------------------

      toast.info("Creating order...", {
        autoClose: 1200,
      });

      const createdOrder =
        await createInternalOrder();

      const orderId =
        createdOrder._id ||
        createdOrder.id;

      if (!orderId) {
        throw new Error(
          "The created order does not contain a valid ID.",
        );
      }

      // ---------------------------------------------
      // STEP 2: PROCESS PAYMENT
      // ---------------------------------------------

      let paymentResult;

      if (
        selectedPaymentMethod ===
        "razorpay"
      ) {
        paymentResult =
          await processRazorpayPayment(
            createdOrder,
          );
      } else {
        paymentResult =
          await processManualPayment(
            createdOrder,
          );
      }

      // ---------------------------------------------
      // STEP 3: GET FINAL ORDER NUMBER
      // ---------------------------------------------

      const settledOrder =
        paymentResult?.order ||
        createdOrder;

      const orderNumber =
        settledOrder.orderNumber ||
        createdOrder.orderNumber ||
        `ORD-${Date.now()}`;

      // ---------------------------------------------
      // STEP 4: SAVE SUCCESS DATA
      // ---------------------------------------------

      setLastBillNumber(orderNumber);
      setLastBillTotal(billTotal);
      setLastPaymentMethod(
        selectedPaymentMethod,
      );

      // ---------------------------------------------
      // STEP 5: CLEAR CURRENT BILL
      // ---------------------------------------------

      setCartItems([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setCustomerSearch("");
      setShowCustomerDropdown(false);

      // ---------------------------------------------
      // STEP 6: SHOW SUCCESS
      // ---------------------------------------------

      setShowSuccess(true);

      toast.success(
        `Payment successful for ${orderNumber}`,
      );
    } catch (error) {
      console.error(
        "Complete bill error:",
        error,
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to complete payment",
      );
    } finally {
      setProcessing(false);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="billing-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="billing-header">
        <div className="billing-header-left">
          <button
            type="button"
            className="billing-back-btn"
            onClick={() => window.history.back()}
          >
            <FaArrowLeft />
          </button>

          <div>
            <span className="billing-eyebrow">
              POINT OF SALE
            </span>

            <h1>New Bill</h1>

            <p>
              Create a new ice cream order
              quickly and accurately.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="new-bill-btn"
          onClick={startNewBill}
          disabled={processing}
        >
          <FaCashRegister />
          New Bill
        </button>
      </header>

      {/* =================================================
          MAIN POS LAYOUT
      ================================================= */}

      <main className="billing-layout">
        {/* =================================================
            PRODUCTS PANEL
        ================================================= */}

        <section className="products-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">
                MENU
              </span>

              <h2>Select Products</h2>
            </div>

            <span className="product-count">
              {products.length} products
            </span>
          </div>

          {/* SEARCH */}

          <div className="product-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Search ice creams, sundaes, cones..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          {/* CATEGORIES */}

          <div className="category-tabs">
            <button
              type="button"
              className={
                selectedCategory === "all"
                  ? "category-tab active"
                  : "category-tab"
              }
              onClick={() =>
                setSelectedCategory("all")
              }
            >
              All Products
            </button>

            {categories.map((category) => {
              const categoryId =
                getCategoryId(category);

              return (
                <button
                  type="button"
                  key={categoryId}
                  className={
                    selectedCategory ===
                    categoryId
                      ? "category-tab active"
                      : "category-tab"
                  }
                  onClick={() =>
                    setSelectedCategory(
                      categoryId,
                    )
                  }
                >
                  {category.name}
                </button>
              );
            })}
          </div>

          {/* PRODUCT GRID */}

          {loadingProducts ? (
            <div className="billing-loading">
              <div className="loading-spinner" />

              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="billing-empty">
              <FaShoppingCart />

              <h3>No products found</h3>

              <p>
                Try another search or category.
              </p>
            </div>
          ) : (
            <div className="billing-product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  addToCart={addToCart}
                />
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            CHECKOUT PANEL
        ================================================= */}

        <aside className="checkout-panel">
          {/* CUSTOMER */}

          <div className="checkout-section">
            <div className="checkout-section-heading">
              <div>
                <span className="section-kicker">
                  CUSTOMER
                </span>

                <h3>Customer Details</h3>
              </div>

              <FaUser />
            </div>

            {selectedCustomer ? (
              <div className="selected-customer">
                <div className="customer-avatar">
                  {selectedCustomer.name
                    ?.charAt(0)
                    ?.toUpperCase() || "C"}
                </div>

                <div className="selected-customer-info">
                  <strong>
                    {selectedCustomer.name}
                  </strong>

                  <span>
                    {selectedCustomer.phone ||
                      "No phone number"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={clearCustomer}
                  className="clear-customer-btn"
                  disabled={processing}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="customer-selector">
                <div className="customer-search">
                  <FaUser />

                  <input
                    type="text"
                    placeholder="Search customer..."
                    value={customerSearch}
                    disabled={processing}
                    onFocus={() =>
                      setShowCustomerDropdown(
                        true,
                      )
                    }
                    onChange={(event) => {
                      setCustomerSearch(
                        event.target.value,
                      );

                      setShowCustomerDropdown(
                        true,
                      );
                    }}
                  />

                  <FaChevronDown />
                </div>

                {showCustomerDropdown && (
                  <div className="customer-dropdown">
                    {loadingCustomers ? (
                      <div className="dropdown-message">
                        Searching...
                      </div>
                    ) : customers.length ===
                      0 ? (
                      <div className="dropdown-message">
                        No customers found.
                      </div>
                    ) : (
                      customers.map(
                        (customer) => (
                          <button
                            type="button"
                            key={
                              customer.id ||
                              customer._id
                            }
                            className="customer-option"
                            onClick={() =>
                              handleSelectCustomer(
                                customer,
                              )
                            }
                          >
                            <span className="customer-option-avatar">
                              {customer.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "C"}
                            </span>

                            <span>
                              <strong>
                                {
                                  customer.name
                                }
                              </strong>

                              <small>
                                {customer.phone ||
                                  customer.email ||
                                  "Customer"}
                              </small>
                            </span>
                          </button>
                        ),
                      )
                    )}

                    <button
                      type="button"
                      className="add-customer-option"
                      onClick={() =>
                        toast.info(
                          "Add Customer will be connected to the Customers module.",
                        )
                      }
                    >
                      <FaUserPlus />

                      Add New Customer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CART */}

          <div className="checkout-cart-section">
            <Cart
              cartItems={cartItems}
              removeFromCart={
                removeFromCart
              }
              increaseQuantity={
                increaseQuantity
              }
              decreaseQuantity={
                decreaseQuantity
              }
            />
          </div>

          {/* DISCOUNT */}

          <div className="checkout-section discount-section">
            <label htmlFor="discount">
              Discount
            </label>

            <div className="discount-input">
              <span>₹</span>

              <input
                id="discount"
                type="number"
                min="0"
                max={totals.subtotal}
                step="0.01"
                value={discount}
                disabled={processing}
                onChange={(event) =>
                  setDiscount(
                    event.target.value,
                  )
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* PAYMENT */}

          <div className="checkout-section">
            <div className="checkout-section-heading">
              <div>
                <span className="section-kicker">
                  PAYMENT
                </span>

                <h3>Payment Method</h3>
              </div>

              <FaWallet />
            </div>

            <div className="payment-methods">
              <button
                type="button"
                disabled={processing}
                className={
                  paymentMethod === "cash"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod("cash")
                }
              >
                <span>💵</span>
                <strong>Cash</strong>
              </button>

              <button
                type="button"
                disabled={processing}
                className={
                  paymentMethod === "upi"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod("upi")
                }
              >
                <span>📱</span>
                <strong>UPI</strong>
              </button>

              <button
                type="button"
                disabled={processing}
                className={
                  paymentMethod === "card"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod("card")
                }
              >
                <span>💳</span>
                <strong>Card</strong>
              </button>

              <button
                type="button"
                disabled={processing}
                className={
                  paymentMethod ===
                  "razorpay"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod(
                    "razorpay",
                  )
                }
              >
                <span>⚡</span>
                <strong>Razorpay</strong>
              </button>
            </div>
          </div>

          {/* BILL */}

          <Bill
            cartItems={cartItems}
            discount={discount}
            onPrint={handlePrint}
          />

          {/* COMPLETE */}

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

                Complete Bill

                <span>
                  {formatCurrency(
                    totals.total,
                  )}
                </span>
              </>
            )}
          </button>
        </aside>
      </main>

      {/* =================================================
          SUCCESS MODAL
      ================================================= */}

      {showSuccess && (
        <div className="billing-success-overlay">
          <div className="billing-success-modal">
            <div className="success-icon">
              <FaCheckCircle />
            </div>

            <span className="success-kicker">
              PAYMENT COMPLETE
            </span>

            <h2>
              Bill Completed Successfully
            </h2>

            <p>
              Bill number{" "}
              <strong>
                {lastBillNumber}
              </strong>
            </p>

            <div className="success-total">
              {formatCurrency(
                lastBillTotal,
              )}
            </div>

            {lastPaymentMethod && (
              <p className="success-payment-method">
                Payment:{" "}
                <strong>
                  {lastPaymentMethod
                    .charAt(0)
                    .toUpperCase() +
                    lastPaymentMethod.slice(
                      1,
                    )}
                </strong>
              </p>
            )}

            <div className="success-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={handlePrint}
              >
                Print Bill
              </button>

              <button
                type="button"
                className="primary-action"
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
};

export default Billing;