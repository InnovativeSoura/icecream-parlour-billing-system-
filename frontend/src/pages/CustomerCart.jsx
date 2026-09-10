import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBoxOpen,
  FaCartPlus,
  FaCheck,
  FaChevronRight,
  FaIceCream,
  FaMinus,
  FaPlus,
  FaReceipt,
  FaShoppingBag,
  FaSignOutAlt,
  FaTrash,
  FaUserCircle,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import "./CustomerCart.css";

const CART_KEY = "customerCart";

const CustomerCart = () => {
  const { user, logout } = useAuth();

  const [cart, setCart] = useState([]);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    loadCart();

    const handleStorageChange = () => {
      loadCart();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem(CART_KEY);

      if (!savedCart) {
        setCart([]);
        return;
      }

      const parsedCart = JSON.parse(savedCart);

      if (Array.isArray(parsedCart)) {
        setCart(parsedCart);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error("Unable to load cart:", error);
      setCart([]);
    }
  };

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );
  }, [cart]);

  /*
   * Product tax is normally 5% in the current billing system.
   * This calculation is kept here for customer checkout preview.
   */
  const taxRate = 5;

  const tax = useMemo(() => {
    return (subtotal * taxRate) / 100;
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal + tax;
  }, [subtotal, tax]);

  const updateQuantity = (productId, change) => {
    setCart((previousCart) =>
      previousCart
        .map((item) => {
          if (item.productId !== productId) {
            return item;
          }

          const newQuantity =
            Number(item.quantity || 0) + change;

          return {
            ...item,
            quantity: Math.max(0, newQuantity),
          };
        })
        .filter(
          (item) => Number(item.quantity || 0) > 0
        )
    );
  };

  const setQuantity = (productId, quantity) => {
    const normalizedQuantity = Math.max(
      1,
      Number(quantity) || 1
    );

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: normalizedQuantity,
            }
          : item
      )
    );
  };

  const removeItem = (productId) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) => item.productId !== productId
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setShowClearModal(false);
  };

  const continueShopping = () => {
    window.location.href = "/customer/products";
  };

  const proceedToCheckout = () => {
    if (!cart.length) {
      return;
    }

    window.location.href = "/customer/checkout";
  };

  const getInitial = (name) => {
    return (
      name?.trim()?.charAt(0)?.toUpperCase() || "I"
    );
  };

  return (
    <div className="customer-cart-page">
      {/* ================================
          SIDEBAR
      ================================= */}

      <aside className="customer-cart-sidebar">
        <div className="customer-cart-brand">
          <div className="customer-cart-brand-icon">
            <FaIceCream />
          </div>

          <div>
            <h2>IceCream</h2>
            <span>PARLOUR</span>
          </div>
        </div>

        <nav className="customer-cart-navigation">
          <a
            href="/customer/dashboard"
            className="customer-cart-nav-item"
          >
            <FaBoxOpen />
            <span>Dashboard</span>
          </a>

          <a
            href="/customer/products"
            className="customer-cart-nav-item"
          >
            <FaIceCream />
            <span>Browse Products</span>
          </a>

          <a
            href="/customer/orders"
            className="customer-cart-nav-item"
          >
            <FaShoppingBag />
            <span>My Orders</span>
          </a>

          <a
            href="/customer/cart"
            className="customer-cart-nav-item active"
          >
            <FaCartPlus />
            <span>My Cart</span>

            {cartCount > 0 && (
              <b className="customer-cart-nav-count">
                {cartCount}
              </b>
            )}
          </a>

          <a
            href="/customer/invoices"
            className="customer-cart-nav-item"
          >
            <FaReceipt />
            <span>Invoices</span>
          </a>

          <a
            href="/customer/profile"
            className="customer-cart-nav-item"
          >
            <FaUserCircle />
            <span>My Profile</span>
          </a>
        </nav>

        <div className="customer-cart-sidebar-bottom">
          <button
            type="button"
            className="customer-cart-logout"
            onClick={logout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ================================
          MAIN
      ================================= */}

      <main className="customer-cart-main">
        {/* TOPBAR */}

        <header className="customer-cart-topbar">
          <div className="customer-cart-mobile-brand">
            <div className="customer-cart-mobile-icon">
              <FaIceCream />
            </div>

            <span>IceCream Parlour</span>
          </div>

          <div className="customer-cart-topbar-actions">
            <div className="customer-cart-top-cart">
              <FaCartPlus />

              {cartCount > 0 && (
                <span>{cartCount}</span>
              )}
            </div>

            <div className="customer-cart-profile">
              <div className="customer-cart-avatar">
                {getInitial(user?.name)}
              </div>

              <div>
                <strong>
                  {user?.name || "Customer"}
                </strong>

                <span>Customer</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <section className="customer-cart-content">
          {/* PAGE HEADER */}

          <motion.div
            className="customer-cart-page-header"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <span className="customer-cart-eyebrow">
                SHOPPING CART
              </span>

              <h1>My Cart</h1>

              <p>
                Review your selected treats before
                continuing to checkout.
              </p>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                className="customer-cart-clear-button"
                onClick={() =>
                  setShowClearModal(true)
                }
              >
                <FaTrash />
                Clear Cart
              </button>
            )}
          </motion.div>

          {/* BREADCRUMB */}

          <div className="customer-cart-breadcrumb">
            <button
              type="button"
              onClick={continueShopping}
            >
              Browse Products
            </button>

            <FaChevronRight />

            <span>My Cart</span>
          </div>

          {/* EMPTY STATE */}

          {cart.length === 0 ? (
            <motion.div
              className="customer-cart-empty"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="customer-cart-empty-icon">
                <FaShoppingBag />
              </div>

              <span className="customer-cart-empty-small">
                YOUR CART IS EMPTY
              </span>

              <h2>Nothing here yet</h2>

              <p>
                Looks like you haven't added any
                delicious treats to your cart.
              </p>

              <button
                type="button"
                onClick={continueShopping}
              >
                <FaIceCream />
                Start Shopping
                <FaArrowRight />
              </button>
            </motion.div>
          ) : (
            <div className="customer-cart-layout">
              {/* ================================
                  CART ITEMS
              ================================= */}

              <div className="customer-cart-items-section">
                <div className="customer-cart-items-heading">
                  <div>
                    <h2>Your Items</h2>

                    <span>
                      {cartCount}{" "}
                      {cartCount === 1
                        ? "item"
                        : "items"}{" "}
                      selected
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={continueShopping}
                  >
                    <FaPlus />
                    Add More
                  </button>
                </div>

                <div className="customer-cart-items">
                  <AnimatePresence>
                    {cart.map((item) => {
                      const itemTotal =
                        Number(item.price || 0) *
                        Number(item.quantity || 0);

                      return (
                        <motion.article
                          key={item.productId}
                          className="customer-cart-item"
                          layout
                          initial={{
                            opacity: 0,
                            y: 12,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            x: -25,
                            height: 0,
                            marginBottom: 0,
                          }}
                        >
                          {/* IMAGE */}

                          <div className="customer-cart-item-image">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";

                                  event.currentTarget.parentElement.classList.add(
                                    "fallback"
                                  );
                                }}
                              />
                            ) : null}

                            <div className="customer-cart-item-image-fallback">
                              <FaIceCream />
                            </div>
                          </div>

                          {/* DETAILS */}

                          <div className="customer-cart-item-details">
                            <span className="customer-cart-item-sku">
                              {item.sku ||
                                "ICE-CREAM"}
                            </span>

                            <h3>{item.name}</h3>

                            <span className="customer-cart-unit-price">
                              ₹
                              {Number(
                                item.price || 0
                              ).toFixed(2)}{" "}
                              / unit
                            </span>
                          </div>

                          {/* QUANTITY */}

                          <div className="customer-cart-quantity">
                            <span>Quantity</span>

                            <div className="customer-cart-quantity-control">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    -1
                                  )
                                }
                                aria-label="Decrease quantity"
                              >
                                <FaMinus />
                              </button>

                              <input
                                type="number"
                                min="1"
                                value={
                                  item.quantity
                                }
                                onChange={(event) =>
                                  setQuantity(
                                    item.productId,
                                    event.target.value
                                  )
                                }
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    1
                                  )
                                }
                                aria-label="Increase quantity"
                              >
                                <FaPlus />
                              </button>
                            </div>
                          </div>

                          {/* TOTAL */}

                          <div className="customer-cart-item-total">
                            <span>Total</span>

                            <strong>
                              ₹
                              {itemTotal.toFixed(2)}
                            </strong>
                          </div>

                          {/* REMOVE */}

                          <button
                            type="button"
                            className="customer-cart-remove"
                            onClick={() =>
                              removeItem(
                                item.productId
                              )
                            }
                            aria-label={`Remove ${item.name}`}
                          >
                            <FaTrash />
                          </button>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* CONTINUE SHOPPING */}

                <button
                  type="button"
                  className="customer-cart-continue"
                  onClick={continueShopping}
                >
                  <FaArrowLeft />
                  Continue Shopping
                </button>
              </div>

              {/* ================================
                  SUMMARY
              ================================= */}

              <aside className="customer-cart-summary">
                <div className="customer-cart-summary-header">
                  <div className="customer-cart-summary-icon">
                    <FaReceipt />
                  </div>

                  <div>
                    <span>ORDER SUMMARY</span>
                    <h2>Checkout Details</h2>
                  </div>
                </div>

                <div className="customer-cart-summary-items">
                  <div>
                    <span>
                      Subtotal
                    </span>

                    <strong>
                      ₹{subtotal.toFixed(2)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Tax ({taxRate}%)
                    </span>

                    <strong>
                      ₹{tax.toFixed(2)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Delivery
                    </span>

                    <strong className="free">
                      FREE
                    </strong>
                  </div>
                </div>

                <div className="customer-cart-summary-divider" />

                <div className="customer-cart-grand-total">
                  <div>
                    <span>Grand Total</span>
                    <small>
                      Inclusive of applicable tax
                    </small>
                  </div>

                  <strong>
                    ₹{total.toFixed(2)}
                  </strong>
                </div>

                <button
                  type="button"
                  className="customer-cart-checkout-button"
                  onClick={proceedToCheckout}
                >
                  Proceed to Checkout
                  <FaArrowRight />
                </button>

                <div className="customer-cart-secure">
                  <div className="customer-cart-secure-icon">
                    <FaCheck />
                  </div>

                  <div>
                    <strong>
                      Secure Checkout
                    </strong>

                    <span>
                      Your payment details are
                      protected.
                    </span>
                  </div>
                </div>

                <div className="customer-cart-payment-methods">
                  <span>PAYMENT METHODS</span>

                  <div>
                    <b>R</b>
                    <b>UPI</b>
                    <b>VISA</b>
                    <b>MC</b>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </section>
      </main>

      {/* ================================
          CLEAR CART MODAL
      ================================= */}

      <AnimatePresence>
        {showClearModal && (
          <motion.div
            className="customer-cart-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() =>
              setShowClearModal(false)
            }
          >
            <motion.div
              className="customer-cart-modal"
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 15,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.94,
                y: 15,
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="customer-cart-modal-icon">
                <FaTrash />
              </div>

              <h2>Clear your cart?</h2>

              <p>
                This will remove all{" "}
                {cartCount}{" "}
                {cartCount === 1
                  ? "item"
                  : "items"}{" "}
                from your cart.
              </p>

              <div className="customer-cart-modal-actions">
                <button
                  type="button"
                  className="cancel"
                  onClick={() =>
                    setShowClearModal(false)
                  }
                >
                  Keep Items
                </button>

                <button
                  type="button"
                  className="confirm"
                  onClick={clearCart}
                >
                  Clear Cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerCart;