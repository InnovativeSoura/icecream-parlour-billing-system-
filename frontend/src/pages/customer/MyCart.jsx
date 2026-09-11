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

import { useCart } from "../../context/CartContext";

import "./MyCart.css";

// =====================================================
// MY CART
// =====================================================

const MyCart = () => {
  const navigate = useNavigate();

  // ===================================================
  // CART CONTEXT
  // ===================================================

  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    totalItems,
    subtotal,
    gst,
    grandTotal,
    gstRate,
  } = useCart();

  const [showClearModal, setShowClearModal] =
    useState(false);

  // ===================================================
  // TOTALS
  // ===================================================

  const totals = useMemo(() => {
    return {
      subtotal: Number(subtotal || 0),
      tax: Number(gst || 0),
      grandTotal: Number(grandTotal || 0),
      itemCount: Number(totalItems || 0),
    };
  }, [
    subtotal,
    gst,
    grandTotal,
    totalItems,
  ]);

  // ===================================================
  // QUANTITY
  // ===================================================

  const updateQuantity = (item, change) => {
    if (!item?._id) {
      return;
    }

    const quantity = Math.max(
      1,
      Number(item.quantity || 1)
    );

    // Increase
    if (change > 0) {
      increaseQuantity(item._id);
      return;
    }

    // If quantity is already 1,
    // remove the item instead of going to 0.
    if (quantity <= 1) {
      removeItem(item);
      return;
    }

    // Decrease
    decreaseQuantity(item._id);
  };

  // ===================================================
  // REMOVE ITEM
  // ===================================================

  const removeItem = (item) => {
    if (!item?._id) {
      return;
    }

    removeFromCart(item._id);

    toast.info(
      `${item.name || "Item"} removed from cart`
    );
  };

  // ===================================================
  // CLEAR CART
  // ===================================================

  const handleClearCart = () => {
    clearCart();

    setShowClearModal(false);

    toast.success(
      "Cart cleared successfully"
    );
  };

  // ===================================================
  // CHECKOUT
  // ===================================================

  const handleCheckout = () => {
    if (!cartItems.length) {
      toast.warning(
        "Your cart is empty"
      );

      return;
    }

    navigate("/customer/orders", {
      state: {
        checkout: true,

        // Keep the existing state structure
        // expected by the checkout page.
        cart: cartItems,

        totals,
      },
    });
  };

  // ===================================================
  // FORMAT PRICE
  // ===================================================

  const formatPrice = (value) => {
    return `₹${Number(
      value || 0
    ).toFixed(2)}`;
  };

  // ===================================================
  // GST LABEL
  // ===================================================

  const gstPercentage = Math.round(
    Number(gstRate || 0) * 100
  );

  // ===================================================
  // EMPTY CART
  // ===================================================

  if (!cartItems.length) {
    return (
      <div className="my-cart-page">

        {/* Background */}

        <div className="cart-background-orb cart-orb-one" />

        <div className="cart-background-orb cart-orb-two" />

        {/* Empty State */}

        <motion.div
          className="cart-empty-state"
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
        >

          <div className="empty-cart-icon">
            <FaShoppingCart />
          </div>

          <span className="cart-eyebrow">
            YOUR SELECTION
          </span>

          <h1>
            Your Cart is Empty
          </h1>

          <p>
            Looks like you haven't added
            anything delicious yet.
            Explore our menu and find
            your favourite treats.
          </p>

          <motion.button
            type="button"
            className="cart-primary-button"
            onClick={() =>
              navigate(
                "/customer/products"
              )
            }
            whileHover={{
              y: -2,
            }}
            whileTap={{
              scale: 0.97,
            }}
          >
            <FaIceCream />

            <span>
              Browse Products
            </span>

            <FaArrowRight />
          </motion.button>

        </motion.div>

      </div>
    );
  }

  // ===================================================
  // MAIN CART
  // ===================================================

  return (
    <div className="my-cart-page">

      {/* Background */}

      <div className="cart-background-orb cart-orb-one" />

      <div className="cart-background-orb cart-orb-two" />

      <div className="my-cart-container">

        {/* =========================================
            HEADER
        ========================================= */}

        <motion.header
          className="cart-page-header"
          initial={{
            opacity: 0,
            y: -20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
          }}
        >

          {/* Header Left */}

          <div className="cart-header-left">

            <div className="cart-title-icon">
              <FaShoppingCart />
            </div>

            <div>

              <span className="cart-eyebrow">
                YOUR SELECTION
              </span>

              <h1>
                My Cart
              </h1>

              <p>
                Review your delicious
                selections before checkout.
              </p>

            </div>

          </div>

          {/* Header Actions */}

          <div className="cart-header-actions">

            <div className="cart-item-count">

              <FaShoppingCart />

              <span>
                {totals.itemCount}{" "}
                {totals.itemCount === 1
                  ? "Item"
                  : "Items"}
              </span>

            </div>

            <button
              type="button"
              className="clear-cart-button"
              onClick={() =>
                setShowClearModal(true)
              }
            >
              <FaTrash />

              <span>
                Clear Cart
              </span>
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

            {/* Section Heading */}

            <div className="cart-section-heading">

              <div>

                <h2>
                  Cart Items
                </h2>

                <span>
                  {totals.itemCount}{" "}
                  {totals.itemCount === 1
                    ? "item"
                    : "items"}{" "}
                  selected
                </span>

              </div>

              <button
                type="button"
                className="continue-shopping-button"
                onClick={() =>
                  navigate(
                    "/customer/products"
                  )
                }
              >
                <span>
                  Continue Shopping
                </span>

                <FaArrowRight />
              </button>

            </div>

            {/* Cart Items */}

            <div className="cart-items-list">

              <AnimatePresence mode="popLayout">

                {cartItems.map((item) => {

                  // ---------------------------------
                  // PRICE
                  // ---------------------------------

                  const price = Number(
                    item.price ??
                    item.unitPrice ??
                    0
                  );

                  // ---------------------------------
                  // QUANTITY
                  // ---------------------------------

                  const quantity = Math.max(
                    1,
                    Number(
                      item.quantity || 1
                    )
                  );

                  // ---------------------------------
                  // ITEM TOTAL
                  // ---------------------------------

                  const itemTotal =
                    price * quantity;

                  return (
                    <motion.article
                      className="cart-item-card"
                      key={
                        item._id ||
                        item.id ||
                        item.name
                      }
                      layout
                      initial={{
                        opacity: 0,
                        y: 15,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        x: -30,
                        height: 0,
                        marginBottom: 0,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                    >

                      {/* =================================
                          PRODUCT IMAGE
                      ================================= */}

                      <div className="cart-product-image-wrapper">

                        {item.image ? (
                          <img
                            src={item.image}
                            alt={
                              item.name ||
                              "Ice cream"
                            }
                            className="cart-product-image"
                            onError={(
                              event
                            ) => {
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

                      {/* =================================
                          PRODUCT DETAILS
                      ================================= */}

                      <div className="cart-product-details">

                        <div className="cart-product-main">

                          <h3>
                            {item.name ||
                              "Ice Cream"}
                          </h3>

                          {/* Category */}

                          {item.category?.name && (
                            <span className="cart-product-category">
                              {
                                item.category
                                  .name
                              }
                            </span>
                          )}

                          {/* SKU */}

                          {item.sku && (
                            <span className="cart-product-sku">
                              SKU:{" "}
                              {item.sku}
                            </span>
                          )}

                        </div>

                        {/* Product Price */}

                        <div className="cart-product-price">

                          {formatPrice(
                            price
                          )}

                          <span>
                            / item
                          </span>

                        </div>

                      </div>

                      {/* =================================
                          QUANTITY
                      ================================= */}

                      <div className="cart-quantity-section">

                        <span className="quantity-label">
                          Quantity
                        </span>

                        <div className="quantity-control">

                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${
                              item.name ||
                              "item"
                            }`}
                            onClick={() =>
                              updateQuantity(
                                item,
                                -1
                              )
                            }
                          >
                            <FaMinus />
                          </button>

                          <span>
                            {quantity}
                          </span>

                          <button
                            type="button"
                            aria-label={`Increase quantity of ${
                              item.name ||
                              "item"
                            }`}
                            onClick={() =>
                              updateQuantity(
                                item,
                                1
                              )
                            }
                          >
                            <FaPlus />
                          </button>

                        </div>

                      </div>

                      {/* =================================
                          ITEM TOTAL
                      ================================= */}

                      <div className="cart-item-total">

                        <span>
                          Total
                        </span>

                        <strong>
                          {formatPrice(
                            itemTotal
                          )}
                        </strong>

                      </div>

                      {/* =================================
                          REMOVE
                      ================================= */}

                      <button
                        type="button"
                        className="remove-cart-item"
                        aria-label={`Remove ${
                          item.name ||
                          "item"
                        }`}
                        onClick={() =>
                          removeItem(item)
                        }
                      >
                        <FaTrash />
                      </button>

                    </motion.article>
                  );
                })}

              </AnimatePresence>

            </div>

            {/* =====================================
                TRUST STRIP
            ===================================== */}

            <div className="cart-trust-strip">

              {/* Secure Checkout */}

              <div className="cart-trust-item">

                <div className="trust-icon">
                  <FaShieldAlt />
                </div>

                <div>

                  <strong>
                    Secure Checkout
                  </strong>

                  <span>
                    Your payment is protected
                  </span>

                </div>

              </div>

              {/* Digital Invoice */}

              <div className="cart-trust-item">

                <div className="trust-icon">
                  <FaReceipt />
                </div>

                <div>

                  <strong>
                    Digital Invoice
                  </strong>

                  <span>
                    Available after purchase
                  </span>

                </div>

              </div>

              {/* Freshly Prepared */}

              <div className="cart-trust-item">

                <div className="trust-icon">
                  <FaIceCream />
                </div>

                <div>

                  <strong>
                    Freshly Prepared
                  </strong>

                  <span>
                    Made with quality ingredients
                  </span>

                </div>

              </div>

            </div>

          </section>

          {/* =======================================
              ORDER SUMMARY
          ======================================= */}

          <aside className="cart-summary-card">

            {/* Summary Header */}

            <div className="summary-card-header">

              <div>

                <span>
                  ORDER SUMMARY
                </span>

                <h2>
                  Checkout
                </h2>

              </div>

              <div className="summary-icon">
                <FaReceipt />
              </div>

            </div>

            {/* =====================================
                SUMMARY ITEMS
            ===================================== */}

            <div className="summary-items">

              {/* Subtotal */}

              <div className="summary-row">

                <span>
                  Subtotal
                </span>

                <strong>
                  {formatPrice(
                    totals.subtotal
                  )}
                </strong>

              </div>

              {/* GST */}

              <div className="summary-row">

                <span>
                  GST{" "}
                  <small>
                    {gstPercentage}%
                  </small>
                </span>

                <strong>
                  {formatPrice(
                    totals.tax
                  )}
                </strong>

              </div>

              <div className="summary-divider" />

              {/* Grand Total */}

              <div className="summary-total-row">

                <div>

                  <span>
                    Total Amount
                  </span>

                  <small>
                    Inclusive of applicable tax
                  </small>

                </div>

                <strong>
                  {formatPrice(
                    totals.grandTotal
                  )}
                </strong>

              </div>

            </div>

            {/* =====================================
                CHECKOUT BUTTON
            ===================================== */}

            <motion.button
              type="button"
              className="checkout-button"
              onClick={handleCheckout}
              whileHover={{
                y: -2,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >

              <span>
                Proceed to Checkout
              </span>

              <div className="checkout-arrow">
                <FaArrowRight />
              </div>

            </motion.button>

            {/* =====================================
                SECURE PAYMENT NOTE
            ===================================== */}

            <div className="secure-payment-note">

              <FaShieldAlt />

              <span>
                Secure payments powered
                by Razorpay
              </span>

            </div>

            {/* =====================================
                ADD MORE ITEMS
            ===================================== */}

            <button
              type="button"
              className="summary-browse-button"
              onClick={() =>
                navigate(
                  "/customer/products"
                )
              }
            >

              <FaIceCream />

              <span>
                Add More Items
              </span>

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
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={() =>
              setShowClearModal(false)
            }
          >

            <motion.div
              className="clear-cart-modal"
              initial={{
                opacity: 0,
                scale: 0.92,
                y: 15,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.92,
                y: 15,
              }}
              transition={{
                duration: 0.25,
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* Close */}

              <button
                type="button"
                className="modal-close-button"
                onClick={() =>
                  setShowClearModal(false)
                }
                aria-label="Close"
              >
                <FaTimes />
              </button>

              {/* Warning Icon */}

              <div className="modal-warning-icon">
                <FaTrash />
              </div>

              <h2>
                Clear your cart?
              </h2>

              <p>
                This will remove all{" "}
                {totals.itemCount}{" "}
                {totals.itemCount === 1
                  ? "item"
                  : "items"}{" "}
                from your cart.
              </p>

              {/* Modal Actions */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={() =>
                    setShowClearModal(false)
                  }
                >
                  Keep Items
                </button>

                <button
                  type="button"
                  className="modal-confirm-button"
                  onClick={
                    handleClearCart
                  }
                >
                  <FaTrash />

                  <span>
                    Clear Cart
                  </span>
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