import {
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  FaArrowRight,
  FaBoxOpen,
  FaCheckCircle,
  FaCreditCard,
  FaMinus,
  FaPlus,
  FaReceipt,
  FaRupeeSign,
  FaShieldAlt,
  FaShoppingBag,
  FaSpinner,
  FaTrash,
  FaTimes,
  FaWallet,
} from "react-icons/fa";

import { useCart } from "../../context/CartContext";

import api from "../../api/api";

import { loadRazorpay } from "../../utils/loadRazorpay";

import "./MyCart.css";


/*
|--------------------------------------------------------------------------
| Animation Variants
|--------------------------------------------------------------------------
*/

const pageVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};


const cardVariants = {
  hidden: {
    opacity: 0,
    y: 16,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};


/*
|--------------------------------------------------------------------------
| Currency Formatter
|--------------------------------------------------------------------------
*/

const formatCurrency = (
  value
) => {
  const amount =
    Number(value) || 0;

  return amount.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
};


/*
|--------------------------------------------------------------------------
| Product Price Helper
|--------------------------------------------------------------------------
|
| Supports both:
|
| product.price
| product.unitPrice
|
|--------------------------------------------------------------------------
*/

const getItemPrice = (
  item
) => {
  return Number(
    item?.price ??
      item?.unitPrice ??
      0
  );
};


/*
|--------------------------------------------------------------------------
| My Cart
|--------------------------------------------------------------------------
*/

const MyCart = () => {
  const navigate =
    useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Cart Context
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | Local UI State
  |--------------------------------------------------------------------------
  */

  const [
    showClearModal,
    setShowClearModal,
  ] = useState(false);

  const [
    checkoutLoading,
    setCheckoutLoading,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | Tax Percentage
  |--------------------------------------------------------------------------
  */

  const gstPercentage =
    Number(gstRate ?? 18);


  /*
  |--------------------------------------------------------------------------
  | Cart Totals
  |--------------------------------------------------------------------------
  |
  | These values are displayed to the customer.
  |
  | The backend independently recalculates the actual order total.
  |
  |--------------------------------------------------------------------------
  */

  const totals = useMemo(
    () => ({
      subtotal:
        Number(subtotal) || 0,

      gst:
        Number(gst) || 0,

      grandTotal:
        Number(grandTotal) || 0,
    }),
    [
      subtotal,
      gst,
      grandTotal,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | Empty Cart
  |--------------------------------------------------------------------------
  */

  if (
    !cartItems ||
    cartItems.length === 0
  ) {
    return (
      <motion.div
        className="my-cart-page my-cart-empty-page"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="my-cart-empty-card">
          <motion.div
            className="my-cart-empty-icon"
            initial={{
              scale: 0.7,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            transition={{
              duration: 0.45,
              ease: "backOut",
            }}
          >
            <FaShoppingBag />
          </motion.div>

          <h1>
            Your Cart Is Empty
          </h1>

          <p>
            Looks like you haven't
            added any delicious
            treats yet.
          </p>

          <motion.button
            type="button"
            className="my-cart-primary-button"
            whileHover={{
              y: -2,
              scale: 1.01,
            }}
            whileTap={{
              scale: 0.98,
            }}
            onClick={() =>
              navigate(
                "/customer/products"
              )
            }
          >
            <FaIceCreamFallback />

            Browse Products

            <FaArrowRight />
          </motion.button>
        </div>
      </motion.div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Remove Item
  |--------------------------------------------------------------------------
  */

  const handleRemove = (
    item
  ) => {
    removeFromCart(
      item._id
    );

    toast.success(
      `${item.name || "Item"} removed from cart`
    );
  };


  /*
  |--------------------------------------------------------------------------
  | Increase Quantity
  |--------------------------------------------------------------------------
  */

  const handleIncrease = (
    item
  ) => {
    increaseQuantity(
      item._id
    );
  };


  /*
  |--------------------------------------------------------------------------
  | Decrease Quantity
  |--------------------------------------------------------------------------
  */

  const handleDecrease = (
    item
  ) => {
    decreaseQuantity(
      item._id
    );
  };


  /*
  |--------------------------------------------------------------------------
  | Clear Cart
  |--------------------------------------------------------------------------
  */

  const confirmClearCart = () => {
    clearCart();

    setShowClearModal(
      false
    );

    toast.success(
      "Cart cleared successfully"
    );
  };


  /*
  |--------------------------------------------------------------------------
  | Customer Checkout
  |--------------------------------------------------------------------------
  |
  | Flow:
  |
  | 1. Create internal order
  | 2. Create Razorpay order
  | 3. Load Razorpay Checkout
  | 4. Open Razorpay
  | 5. Receive payment response
  | 6. Verify payment on backend
  | 7. Clear cart
  | 8. Redirect to orders
  |
  |--------------------------------------------------------------------------
  */

  const handleCheckout =
    async () => {
      if (
        checkoutLoading
      ) {
        return;
      }

      if (
        !cartItems ||
        cartItems.length === 0
      ) {
        toast.warning(
          "Your cart is empty"
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Validate cart products
      |--------------------------------------------------------------------------
      */

      const invalidItem =
        cartItems.find(
          (item) =>
            !item?._id ||
            !Number.isFinite(
              Number(
                item.quantity
              )
            ) ||
            Number(
              item.quantity
            ) <= 0
        );

      if (invalidItem) {
        toast.error(
          "One or more cart items are invalid. Please refresh your cart."
        );

        return;
      }

      setCheckoutLoading(
        true
      );

      let createdOrderId =
        null;

      try {
        /*
        |--------------------------------------------------------------------------
        | STEP 1
        |--------------------------------------------------------------------------
        | Create the application's internal order.
        |
        | IMPORTANT:
        | Do not send subtotal, GST or grandTotal as trusted values.
        |
        | The backend must fetch current product prices and calculate
        | the actual amount.
        |--------------------------------------------------------------------------
        */

        const orderResponse =
          await api.post(
            "/orders/customer",
            {
              items:
                cartItems.map(
                  (item) => ({
                    product:
                      item._id,

                    quantity:
                      Number(
                        item.quantity
                      ),
                  })
                ),

              orderType:
                "online",

              paymentMethod:
                "razorpay",
            }
          );

        /*
        |--------------------------------------------------------------------------
        | Extract internal order
        |--------------------------------------------------------------------------
        */

        const createdOrder =
          orderResponse
            ?.data
            ?.data
            ?.order ||
          orderResponse
            ?.data
            ?.order ||
          orderResponse
            ?.data
            ?.data;

        createdOrderId =
          createdOrder?._id ||
          createdOrder?.id ||
          null;

        if (
          !createdOrderId
        ) {
          throw new Error(
            "Unable to create the order"
          );
        }

        /*
        |--------------------------------------------------------------------------
        | STEP 2
        |--------------------------------------------------------------------------
        | Ask backend to create Razorpay order.
        |--------------------------------------------------------------------------
        */

        const razorpayResponse =
          await api.post(
            "/payments/razorpay/create-order",
            {
              orderId:
                createdOrderId,
            }
          );

        const paymentData =
          razorpayResponse
            ?.data
            ?.data;

        if (
          !paymentData
        ) {
          throw new Error(
            "Unable to initialize Razorpay payment"
          );
        }

        const {
          paymentId,
          orderId,
          orderNumber,
          razorpayOrderId,
          keyId,
          amount,
          currency,
          customer,
        } = paymentData;

        /*
        |--------------------------------------------------------------------------
        | Validate Razorpay response
        |--------------------------------------------------------------------------
        */

        if (
          !paymentId ||
          !orderId ||
          !razorpayOrderId ||
          !keyId ||
          !amount
        ) {
          throw new Error(
            "Incomplete Razorpay payment information"
          );
        }

        /*
        |--------------------------------------------------------------------------
        | STEP 3
        |--------------------------------------------------------------------------
        | Load Razorpay Checkout SDK.
        |--------------------------------------------------------------------------
        */

        const razorpayLoaded =
          await loadRazorpay();

        if (
          !razorpayLoaded
        ) {
          throw new Error(
            "Unable to load Razorpay Checkout. Please check your internet connection and try again."
          );
        }

        if (
          !window.Razorpay
        ) {
          throw new Error(
            "Razorpay Checkout is unavailable"
          );
        }

        /*
        |--------------------------------------------------------------------------
        | STEP 4
        |--------------------------------------------------------------------------
        | Configure Razorpay Checkout.
        |--------------------------------------------------------------------------
        */

        const options = {
          key:
            keyId,

          amount:
            amount,

          currency:
            currency ||
            "INR",

          name:
            "IceCream Parlour",

          description:
            orderNumber
              ? `Payment for Order ${orderNumber}`
              : "Ice Cream Order",

          order_id:
            razorpayOrderId,

          /*
          |--------------------------------------------------------------------------
          | Customer prefill
          |--------------------------------------------------------------------------
          */

          prefill: {
            name:
              customer?.name ||
              "",

            email:
              customer?.email ||
              "",

            contact:
              customer?.phone ||
              "",
          },

          /*
          |--------------------------------------------------------------------------
          | Notes
          |--------------------------------------------------------------------------
          */

          notes: {
            orderId:
              String(
                orderId
              ),

            orderNumber:
              String(
                orderNumber ||
                  ""
              ),
          },

          /*
          |--------------------------------------------------------------------------
          | Theme
          |--------------------------------------------------------------------------
          */

          theme: {
            color:
              "#7c3aed",
          },

          /*
          |--------------------------------------------------------------------------
          | Modal
          |--------------------------------------------------------------------------
          */

          modal: {
            escape:
              true,

            backdropclose:
              false,

            ondismiss:
              () => {
                setCheckoutLoading(
                  false
                );

                toast.info(
                  "Payment window closed"
                );
              },
          },

          /*
          |--------------------------------------------------------------------------
          | Payment Handler
          |--------------------------------------------------------------------------
          |
          | Razorpay calls this only after Checkout returns a payment result.
          |
          |--------------------------------------------------------------------------
          */

          handler:
            async (
              response
            ) => {
              try {
                /*
                |--------------------------------------------------------------------------
                | Validate Razorpay response
                |--------------------------------------------------------------------------
                */

                if (
                  !response
                    ?.razorpay_payment_id ||
                  !response
                    ?.razorpay_order_id ||
                  !response
                    ?.razorpay_signature
                ) {
                  throw new Error(
                    "Incomplete Razorpay payment response"
                  );
                }

                /*
                |--------------------------------------------------------------------------
                | STEP 5
                |--------------------------------------------------------------------------
                | Verify payment on backend.
                |--------------------------------------------------------------------------
                */

                const verifyResponse =
                  await api.post(
                    "/payments/razorpay/verify",
                    {
                      orderId:
                        orderId,

                      paymentId:
                        paymentId,

                      razorpay_order_id:
                        response.razorpay_order_id,

                      razorpay_payment_id:
                        response.razorpay_payment_id,

                      razorpay_signature:
                        response.razorpay_signature,
                    }
                  );

                const verification =
                  verifyResponse
                    ?.data;

                /*
                |--------------------------------------------------------------------------
                | Verify backend success.
                |--------------------------------------------------------------------------
                */

                if (
                  !verification?.success
                ) {
                  throw new Error(
                    verification?.message ||
                      "Payment verification failed"
                  );
                }

                /*
                |--------------------------------------------------------------------------
                | STEP 6
                |--------------------------------------------------------------------------
                | Payment is now verified by backend.
                |
                | Only NOW should we clear the cart.
                |--------------------------------------------------------------------------
                */

                clearCart();

                toast.success(
                  "Payment successful! Your order has been confirmed."
                );

                /*
                |--------------------------------------------------------------------------
                | STEP 7
                |--------------------------------------------------------------------------
                | Navigate to My Orders.
                |--------------------------------------------------------------------------
                */

                navigate(
                  "/customer/orders",
                  {
                    replace:
                      true,

                    state: {
                      paymentSuccess:
                        true,

                      orderId:
                        orderId,

                      orderNumber:
                        orderNumber,
                    },
                  }
                );
              } catch (error) {
                console.error(
                  "Razorpay verification error:",
                  error
                );

                const message =
                  error
                    ?.response
                    ?.data
                    ?.message ||
                  error?.message ||
                  "Payment verification failed";

                toast.error(
                  message
                );

                /*
                |--------------------------------------------------------------------------
                | IMPORTANT
                |--------------------------------------------------------------------------
                |
                | Do NOT clear the cart here.
                |
                | The payment may still be recoverable through the webhook.
                |--------------------------------------------------------------------------
                */
              } finally {
                setCheckoutLoading(
                  false
                );
              }
            },
        };

        /*
        |--------------------------------------------------------------------------
        | STEP 4B
        |--------------------------------------------------------------------------
        | Create and open Razorpay Checkout.
        |--------------------------------------------------------------------------
        */

        const razorpay =
          new window.Razorpay(
            options
          );

        /*
        |--------------------------------------------------------------------------
        | Payment failure handler
        |--------------------------------------------------------------------------
        */

        razorpay.on(
          "payment.failed",
          (
            response
          ) => {
            console.error(
              "Razorpay payment failed:",
              response
            );

            const description =
              response
                ?.error
                ?.description;

            toast.error(
              description ||
                "Payment failed. Please try again."
            );

            setCheckoutLoading(
              false
            );
          }
        );

        /*
        |--------------------------------------------------------------------------
        | Open Razorpay Checkout
        |--------------------------------------------------------------------------
        */

        razorpay.open();
      } catch (error) {
        console.error(
          "Checkout error:",
          error
        );

        const message =
          error
            ?.response
            ?.data
            ?.message ||
          error?.message ||
          "Unable to start checkout";

        /*
        |--------------------------------------------------------------------------
        | If an internal order was created but Razorpay initialization failed,
        | don't clear the cart.
        |--------------------------------------------------------------------------
        */

        toast.error(
          message
        );

        setCheckoutLoading(
          false
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <motion.div
        className="my-cart-page"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/*
        |--------------------------------------------------------------------------
        | Page Header
        |--------------------------------------------------------------------------
        */}

        <div className="my-cart-header">
          <div>
            <div className="my-cart-eyebrow">
              <FaShoppingBag />
              YOUR SHOPPING CART
            </div>

            <h1>
              My Cart
            </h1>

            <p>
              Review your favourite
              treats before checkout.
            </p>
          </div>

          <div className="my-cart-item-badge">
            <FaBoxOpen />

            <span>
              {totalItems}
            </span>

            <small>
              {totalItems === 1
                ? "item"
                : "items"}
            </small>
          </div>
        </div>


        {/*
        |--------------------------------------------------------------------------
        | Main Grid
        |--------------------------------------------------------------------------
        */}

        <div className="my-cart-layout">

          {/*
          |--------------------------------------------------------------------------
          | Cart Items
          |--------------------------------------------------------------------------
          */}

          <motion.section
            className="my-cart-items-card"
            variants={cardVariants}
          >
            <div className="my-cart-section-header">
              <div>
                <h2>
                  Cart Items
                </h2>

                <span>
                  {cartItems.length}{" "}
                  {cartItems.length === 1
                    ? "product"
                    : "products"}
                </span>
              </div>

              <button
                type="button"
                className="my-cart-clear-button"
                onClick={() =>
                  setShowClearModal(
                    true
                  )
                }
                disabled={
                  checkoutLoading
                }
              >
                <FaTrash />
                Clear Cart
              </button>
            </div>


            <div className="my-cart-items-list">
              <AnimatePresence>
                {cartItems.map(
                  (
                    item,
                    index
                  ) => {
                    const price =
                      getItemPrice(
                        item
                      );

                    const quantity =
                      Number(
                        item.quantity
                      ) || 1;

                    const itemTotal =
                      price *
                      quantity;

                    return (
                      <motion.div
                        key={
                          item._id
                        }
                        className="my-cart-item"
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
                          x: -30,
                        }}
                        transition={{
                          duration:
                            0.3,

                          delay:
                            index *
                            0.04,
                        }}
                        layout
                      >
                        {/*
                        |--------------------------------------------------------------------------
                        | Product Image
                        |--------------------------------------------------------------------------
                        */}

                        <div className="my-cart-product-image">
                          {item.image ? (
                            <img
                              src={
                                item.image
                              }
                              alt={
                                item.name ||
                                "Ice cream"
                              }
                              onError={(
                                event
                              ) => {
                                event.currentTarget.style.display =
                                  "none";

                                const fallback =
                                  event
                                    .currentTarget
                                    .parentElement
                                    ?.querySelector(
                                      ".my-cart-image-fallback"
                                    );

                                if (
                                  fallback
                                ) {
                                  fallback.style.display =
                                    "flex";
                                }
                              }}
                            />
                          ) : null}

                          <div
                            className="my-cart-image-fallback"
                            style={{
                              display:
                                item.image
                                  ? "none"
                                  : "flex",
                            }}
                          >
                            <FaIceCreamFallback />
                          </div>
                        </div>


                        {/*
                        |--------------------------------------------------------------------------
                        | Product Information
                        |--------------------------------------------------------------------------
                        */}

                        <div className="my-cart-product-info">
                          <h3>
                            {item.name ||
                              "Ice Cream"}
                          </h3>

                          {item.category ? (
                            <span className="my-cart-product-category">
                              {typeof item.category ===
                              "object"
                                ? item
                                    .category
                                    ?.name
                                : item.category}
                            </span>
                          ) : null}

                          {item.sku ? (
                            <span className="my-cart-product-sku">
                              SKU:{" "}
                              {item.sku}
                            </span>
                          ) : null}

                          <div className="my-cart-product-price-mobile">
                            <FaRupeeSign />
                            {formatCurrency(
                              price
                            )}
                          </div>
                        </div>


                        {/*
                        |--------------------------------------------------------------------------
                        | Unit Price
                        |--------------------------------------------------------------------------
                        */}

                        <div className="my-cart-unit-price">
                          <span>
                            Unit Price
                          </span>

                          <strong>
                            <FaRupeeSign />
                            {formatCurrency(
                              price
                            )}
                          </strong>
                        </div>


                        {/*
                        |--------------------------------------------------------------------------
                        | Quantity Controls
                        |--------------------------------------------------------------------------
                        */}

                        <div className="my-cart-quantity">
                          <span>
                            Quantity
                          </span>

                          <div className="my-cart-quantity-controls">
                            <button
                              type="button"
                              aria-label={`Decrease ${item.name || "product"} quantity`}
                              onClick={() =>
                                handleDecrease(
                                  item
                                )
                              }
                              disabled={
                                checkoutLoading ||
                                quantity <=
                                  1
                              }
                            >
                              <FaMinus />
                            </button>

                            <strong>
                              {quantity}
                            </strong>

                            <button
                              type="button"
                              aria-label={`Increase ${item.name || "product"} quantity`}
                              onClick={() =>
                                handleIncrease(
                                  item
                                )
                              }
                              disabled={
                                checkoutLoading
                              }
                            >
                              <FaPlus />
                            </button>
                          </div>
                        </div>


                        {/*
                        |--------------------------------------------------------------------------
                        | Item Total
                        |--------------------------------------------------------------------------
                        */}

                        <div className="my-cart-item-total">
                          <span>
                            Total
                          </span>

                          <strong>
                            <FaRupeeSign />
                            {formatCurrency(
                              itemTotal
                            )}
                          </strong>
                        </div>


                        {/*
                        |--------------------------------------------------------------------------
                        | Remove
                        |--------------------------------------------------------------------------
                        */}

                        <button
                          type="button"
                          className="my-cart-remove-button"
                          aria-label={`Remove ${item.name || "product"} from cart`}
                          onClick={() =>
                            handleRemove(
                              item
                            )
                          }
                          disabled={
                            checkoutLoading
                          }
                        >
                          <FaTimes />
                        </button>
                      </motion.div>
                    );
                  }
                )}
              </AnimatePresence>
            </div>


            {/*
            |--------------------------------------------------------------------------
            | Continue Shopping
            |--------------------------------------------------------------------------
            */}

            <div className="my-cart-continue">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/customer/products"
                  )
                }
                disabled={
                  checkoutLoading
                }
              >
                <FaArrowRight />

                Continue Shopping
              </button>
            </div>
          </motion.section>


          {/*
          |--------------------------------------------------------------------------
          | Order Summary
          |--------------------------------------------------------------------------
          */}

          <motion.aside
            className="my-cart-summary-card"
            variants={cardVariants}
          >
            <div className="my-cart-summary-top">
              <div className="my-cart-summary-icon">
                <FaReceipt />
              </div>

              <div>
                <span>
                  ORDER SUMMARY
                </span>

                <h2>
                  Checkout
                </h2>
              </div>
            </div>


            {/*
            |--------------------------------------------------------------------------
            | Summary Rows
            |--------------------------------------------------------------------------
            */}

            <div className="my-cart-summary-lines">
              <div className="my-cart-summary-row">
                <span>
                  Items
                </span>

                <strong>
                  {totalItems}
                </strong>
              </div>

              <div className="my-cart-summary-row">
                <span>
                  Subtotal
                </span>

                <strong>
                  <FaRupeeSign />
                  {formatCurrency(
                    totals.subtotal
                  )}
                </strong>
              </div>

              <div className="my-cart-summary-row">
                <span>
                  GST{" "}
                  <small>
                    ({gstPercentage}%)
                  </small>
                </span>

                <strong>
                  <FaRupeeSign />
                  {formatCurrency(
                    totals.gst
                  )}
                </strong>
              </div>
            </div>


            {/*
            |--------------------------------------------------------------------------
            | Divider
            |--------------------------------------------------------------------------
            */}

            <div className="my-cart-summary-divider" />


            {/*
            |--------------------------------------------------------------------------
            | Grand Total
            |--------------------------------------------------------------------------
            */}

            <div className="my-cart-grand-total">
              <span>
                Total Payable
              </span>

              <strong>
                <FaRupeeSign />
                {formatCurrency(
                  totals.grandTotal
                )}
              </strong>
            </div>


            {/*
            |--------------------------------------------------------------------------
            | Checkout Button
            |--------------------------------------------------------------------------
            */}

            <motion.button
              type="button"
              className="my-cart-checkout-button"
              onClick={
                handleCheckout
              }
              disabled={
                checkoutLoading ||
                !cartItems.length
              }
              whileHover={
                checkoutLoading
                  ? {}
                  : {
                      y: -2,
                    }
              }
              whileTap={
                checkoutLoading
                  ? {}
                  : {
                      scale: 0.98,
                    }
              }
            >
              {checkoutLoading ? (
                <>
                  <FaSpinner className="my-cart-spinner" />

                  Processing...
                </>
              ) : (
                <>
                  <FaCreditCard />

                  Proceed to Checkout

                  <FaArrowRight />
                </>
              )}
            </motion.button>


            {/*
            |--------------------------------------------------------------------------
            | Razorpay Security
            |--------------------------------------------------------------------------
            */}

            <div className="my-cart-security">
              <div className="my-cart-security-icon">
                <FaShieldAlt />
              </div>

              <div>
                <strong>
                  Secure Payment
                </strong>

                <span>
                  Payments are securely
                  processed by Razorpay.
                </span>
              </div>
            </div>


            {/*
            |--------------------------------------------------------------------------
            | Payment Methods
            |--------------------------------------------------------------------------
            */}

            <div className="my-cart-payment-methods">
              <span>
                Accepted Payment Methods
              </span>

              <div>
                <div
                  className="my-cart-payment-method"
                  title="UPI"
                >
                  UPI
                </div>

                <div
                  className="my-cart-payment-method"
                  title="Cards"
                >
                  <FaCreditCard />
                </div>

                <div
                  className="my-cart-payment-method"
                  title="Wallets"
                >
                  <FaWallet />
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </motion.div>


      {/*
      |--------------------------------------------------------------------------
      | Clear Cart Modal
      |--------------------------------------------------------------------------
      */}

      <AnimatePresence>
        {showClearModal && (
          <motion.div
            className="my-cart-modal-overlay"
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
              setShowClearModal(
                false
              )
            }
          >
            <motion.div
              className="my-cart-confirm-modal"
              initial={{
                opacity: 0,
                scale: 0.92,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.92,
                y: 20,
              }}
              transition={{
                duration: 0.25,
              }}
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="my-cart-modal-icon">
                <FaTrash />
              </div>

              <h2>
                Clear Cart?
              </h2>

              <p>
                Are you sure you want
                to remove all items from
                your cart?
              </p>

              <div className="my-cart-modal-actions">
                <button
                  type="button"
                  className="my-cart-modal-cancel"
                  onClick={() =>
                    setShowClearModal(
                      false
                    )
                  }
                >
                  Keep Items
                </button>

                <button
                  type="button"
                  className="my-cart-modal-confirm"
                  onClick={
                    confirmClearCart
                  }
                >
                  <FaTrash />

                  Clear Cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


/*
|--------------------------------------------------------------------------
| Small Ice Cream Fallback
|--------------------------------------------------------------------------
|
| Kept local so this file does not depend on a potentially unavailable
| FontAwesome ice-cream icon export.
|
|--------------------------------------------------------------------------
*/

const FaIceCreamFallback = () => {
  return (
    <span
      aria-hidden="true"
      style={{
        fontSize:
          "1.05em",

        lineHeight: 1,
      }}
    >
      🍦
    </span>
  );
};


export default MyCart;