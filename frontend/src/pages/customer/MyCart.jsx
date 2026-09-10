// frontend/src/pages/customer/MyCart.jsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import {
  FaShoppingCart,
  FaMinus,
  FaPlus,
  FaTrash,
  FaArrowRight,
  FaIceCream,
  FaReceipt,
  FaShieldAlt,
  FaTimes,
} from "react-icons/fa";

import "./MyCart.css";

const CART_KEY = "icecream_cart";

const MyCart = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState(() => {
    try {
      const storedCart = localStorage.getItem(CART_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      console.error("Failed to load cart:", error);
      return [];
    }
  });

  const [showClearModal, setShowClearModal] = useState(false);

  /* ---------------------------------------------
     SAVE CART
  --------------------------------------------- */

  const updateCartStorage = (updatedCart) => {
    setCart(updatedCart);

    try {
      localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
    } catch (error) {
      console.error("Failed to save cart:", error);
    }

    window.dispatchEvent(new Event("cartUpdated"));
  };

  /* ---------------------------------------------
     QUANTITY
  --------------------------------------------- */

  const updateQuantity = (index, change) => {
    const updatedCart = [...cart];
    const currentItem = updatedCart[index];

    if (!currentItem) return;

    const currentQuantity = Number(currentItem.quantity) || 1;
    const newQuantity = currentQuantity + change;

    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }

    updatedCart[index] = {
      ...currentItem,
      quantity: newQuantity,
    };

    updateCartStorage(updatedCart);
  };

  /* ---------------------------------------------
     REMOVE ITEM
  --------------------------------------------- */

  const removeItem = (index) => {
    const item = cart[index];

    const updatedCart = cart.filter((_, itemIndex) => itemIndex !== index);

    updateCartStorage(updatedCart);

    if (item) {
      toast.info(`${item.name || "Item"} removed from cart`);
    }
  };

  /* ---------------------------------------------
     CLEAR CART
  --------------------------------------------- */

  const clearCart = () => {
    updateCartStorage([]);
    setShowClearModal(false);
    toast.success("Cart cleared successfully");
  };

  /* ---------------------------------------------
     TOTALS
  --------------------------------------------- */

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const price = Number(item.price || item.unitPrice || 0);
      const quantity = Number(item.quantity || 1);

      return sum + price * quantity;
    }, 0);

    const tax = subtotal * 0.05;
    const grandTotal = subtotal + tax;

    const itemCount = cart.reduce(
      (count, item) => count + Number(item.quantity || 1),
      0
    );

    return {
      subtotal,
      tax,
      grandTotal,
      itemCount,
    };
  }, [cart]);

  /* ---------------------------------------------
     CHECKOUT
  --------------------------------------------- */

  const handleCheckout = () => {
    if (!cart.length) {
      toast.warning("Your cart is empty");
      return;
    }

    navigate("/customer/orders", {
      state: {
        checkout: true,
        cart,
        totals,
      },
    });
  };

  /* ---------------------------------------------
     FORMAT CURRENCY
  --------------------------------------------- */

  const formatPrice = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };

  /* ---------------------------------------------
     EMPTY CART
  --------------------------------------------- */

  if (!cart.length) {
    return (
      <div className="my-cart-page">
        <div className="cart-background-orb cart-orb-one" />
        <div className="cart-background-orb cart-orb-two" />

        <motion.div
          className="cart-empty-state"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="empty-cart-icon">
            <FaShoppingCart />
          </div>

          <h1>Your Cart is Empty</h1>

          <p>
            Looks like you haven't added anything delicious yet.
            Explore our menu and find your favourite treats.
          </p>

          <motion.button
            className="cart-primary-button"
            onClick={() => navigate("/customer/products")}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <FaIceCream />
            Browse Products
            <FaArrowRight />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ---------------------------------------------
     MAIN CART
  --------------------------------------------- */

  return (
    <div className="my-cart-page">
      <div className="cart-background-orb cart-orb-one" />
      <div className="cart-background-orb cart-orb-two" />

      <div className="my-cart-container">

        {/* =========================================
            HEADER
        ========================================= */}

        <motion.header
          className="cart-page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="cart-header-left">
            <div className="cart-title-icon">
              <FaShoppingCart />
            </div>

            <div>
              <span className="cart-eyebrow">YOUR SELECTION</span>

              <h1>My Cart</h1>

              <p>
                Review your delicious selections before checkout.
              </p>
            </div>
          </div>

          <div className="cart-header-actions">
            <div className="cart-item-count">
              <FaShoppingCart />
              <span>
                {totals.itemCount}{" "}
                {totals.itemCount === 1 ? "Item" : "Items"}
              </span>
            </div>

            <button
              className="clear-cart-button"
              onClick={() => setShowClearModal(true)}
            >
              <FaTrash />
              Clear Cart
            </button>
          </div>
        </motion.header>

        {/* =========================================
            CONTENT
        ========================================= */}

        <div className="cart-layout">

          {/* =======================================
              CART ITEMS
          ======================================= */}

          <section className="cart-items-section">

            <div className="cart-section-heading">
              <div>
                <h2>Cart Items</h2>
                <span>
                  {totals.itemCount}{" "}
                  {totals.itemCount === 1 ? "item" : "items"} selected
                </span>
              </div>

              <button
                className="continue-shopping-button"
                onClick={() => navigate("/customer/products")}
              >
                Continue Shopping
                <FaArrowRight />
              </button>
            </div>

            <div className="cart-items-list">
              <AnimatePresence mode="popLayout">
                {cart.map((item, index) => {
                  const price = Number(
                    item.price || item.unitPrice || 0
                  );

                  const quantity = Number(item.quantity || 1);

                  const itemTotal = price * quantity;

                  return (
                    <motion.article
                      className="cart-item-card"
                      key={
                        item._id ||
                        item.id ||
                        `${item.name}-${index}`
                      }
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        x: -30,
                        height: 0,
                        marginBottom: 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >

                      {/* Product Image */}

                      <div className="cart-product-image-wrapper">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name || "Ice cream"}
                            className="cart-product-image"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                              event.currentTarget.parentElement.classList.add(
                                "image-fallback"
                              );
                            }}
                          />
                        ) : (
                          <div className="cart-product-image-placeholder">
                            <FaIceCream />
                          </div>
                        )}

                        <div className="cart-image-badge">
                          <FaIceCream />
                        </div>
                      </div>

                      {/* Product Details */}

                      <div className="cart-product-details">

                        <div className="cart-product-main">
                          <h3>
                            {item.name || "Ice Cream"}
                          </h3>

                          {item.category?.name && (
                            <span className="cart-product-category">
                              {item.category.name}
                            </span>
                          )}

                          {item.sku && (
                            <span className="cart-product-sku">
                              SKU: {item.sku}
                            </span>
                          )}
                        </div>

                        <div className="cart-product-price">
                          {formatPrice(price)}
                          <span>/ item</span>
                        </div>

                      </div>

                      {/* Quantity */}

                      <div className="cart-quantity-section">

                        <span className="quantity-label">
                          Quantity
                        </span>

                        <div className="quantity-control">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              updateQuantity(index, -1)
                            }
                          >
                            <FaMinus />
                          </button>

                          <span>{quantity}</span>

                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() =>
                              updateQuantity(index, 1)
                            }
                          >
                            <FaPlus />
                          </button>
                        </div>

                      </div>

                      {/* Item Total */}

                      <div className="cart-item-total">
                        <span>Total</span>
                        <strong>
                          {formatPrice(itemTotal)}
                        </strong>
                      </div>

                      {/* Remove */}

                      <button
                        type="button"
                        className="remove-cart-item"
                        aria-label={`Remove ${
                          item.name || "item"
                        }`}
                        onClick={() => removeItem(index)}
                      >
                        <FaTrash />
                      </button>

                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Trust Strip */}

            <div className="cart-trust-strip">

              <div className="cart-trust-item">
                <div className="trust-icon">
                  <FaShieldAlt />
                </div>

                <div>
                  <strong>Secure Checkout</strong>
                  <span>Your payment is protected</span>
                </div>
              </div>

              <div className="cart-trust-item">
                <div className="trust-icon">
                  <FaReceipt />
                </div>

                <div>
                  <strong>Digital Invoice</strong>
                  <span>Available after purchase</span>
                </div>
              </div>

              <div className="cart-trust-item">
                <div className="trust-icon">
                  <FaIceCream />
                </div>

                <div>
                  <strong>Freshly Prepared</strong>
                  <span>Made with quality ingredients</span>
                </div>
              </div>

            </div>

          </section>

          {/* =======================================
              ORDER SUMMARY
          ======================================= */}

          <aside className="cart-summary-card">

            <div className="summary-card-header">
              <div>
                <span>ORDER SUMMARY</span>
                <h2>Checkout</h2>
              </div>

              <div className="summary-icon">
                <FaReceipt />
              </div>
            </div>

            <div className="summary-items">

              <div className="summary-row">
                <span>
                  Subtotal
                </span>

                <strong>
                  {formatPrice(totals.subtotal)}
                </strong>
              </div>

              <div className="summary-row">
                <span>
                  Tax
                  <small>5%</small>
                </span>

                <strong>
                  {formatPrice(totals.tax)}
                </strong>
              </div>

              <div className="summary-divider" />

              <div className="summary-total-row">
                <div>
                  <span>Total Amount</span>
                  <small>Inclusive of applicable tax</small>
                </div>

                <strong>
                  {formatPrice(totals.grandTotal)}
                </strong>
              </div>

            </div>

            {/* Checkout */}

            <motion.button
              className="checkout-button"
              onClick={handleCheckout}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>
                Proceed to Checkout
              </span>

              <div className="checkout-arrow">
                <FaArrowRight />
              </div>
            </motion.button>

            <div className="secure-payment-note">
              <FaShieldAlt />
              <span>
                Secure payments powered by Razorpay
              </span>
            </div>

            <button
              className="summary-browse-button"
              onClick={() =>
                navigate("/customer/products")
              }
            >
              <FaIceCream />
              Add More Items
            </button>

          </aside>

        </div>
      </div>

      {/* =========================================
          CLEAR CART MODAL
      ========================================= */}

      <AnimatePresence>
        {showClearModal && (
          <motion.div
            className="cart-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowClearModal(false)}
          >
            <motion.div
              className="clear-cart-modal"
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.25 }}
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <button
                className="modal-close-button"
                onClick={() =>
                  setShowClearModal(false)
                }
                aria-label="Close"
              >
                <FaTimes />
              </button>

              <div className="modal-warning-icon">
                <FaTrash />
              </div>

              <h2>Clear your cart?</h2>

              <p>
                This will remove all {totals.itemCount}{" "}
                {totals.itemCount === 1
                  ? "item"
                  : "items"}{" "}
                from your cart.
              </p>

              <div className="modal-actions">

                <button
                  className="modal-cancel-button"
                  onClick={() =>
                    setShowClearModal(false)
                  }
                >
                  Keep Items
                </button>

                <button
                  className="modal-confirm-button"
                  onClick={clearCart}
                >
                  <FaTrash />
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

export default MyCart;