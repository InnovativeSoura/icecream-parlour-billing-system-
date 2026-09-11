// frontend/src/context/CartContext.jsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// =====================================================
// CART CONFIGURATION
// =====================================================

const CartContext = createContext(null);

const CART_KEY = "icecream_cart";

// Current GST rate used by the customer cart
const GST_RATE = 0.05;

// =====================================================
// SAFE CART READER
// =====================================================

const getStoredCart = () => {
  try {
    const storedCart = localStorage.getItem(CART_KEY);

    if (!storedCart) {
      return [];
    }

    const parsedCart = JSON.parse(storedCart);

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart
      .filter((item) => item && item._id)
      .map((item) => ({
        ...item,
        quantity: Math.max(
          1,
          Number(item.quantity) || 1
        ),
      }));
  } catch (error) {
    console.error(
      "Failed to load cart from localStorage:",
      error
    );

    return [];
  }
};

// =====================================================
// CART PROVIDER
// =====================================================

export const CartProvider = ({ children }) => {
  // ===================================================
  // INITIAL CART
  // ===================================================

  const [cartItems, setCartItems] = useState(() => {
    return getStoredCart();
  });

  // ===================================================
  // PERSIST CART
  // ===================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        CART_KEY,
        JSON.stringify(cartItems)
      );

      // Notify other components in the same tab.
      window.dispatchEvent(
        new Event("cartUpdated")
      );
    } catch (error) {
      console.error(
        "Failed to save cart to localStorage:",
        error
      );
    }
  }, [cartItems]);

  // ===================================================
  // SYNC CART FROM LOCAL STORAGE
  // ===================================================
  //
  // This handles:
  //
  // - Multiple tabs
  // - Existing carts
  // - Other components modifying localStorage
  //
  // ===================================================

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== CART_KEY) {
        return;
      }

      setCartItems(getStoredCart());
    };

    const handleCartUpdated = () => {
      const storedCart = getStoredCart();

      setCartItems((currentCart) => {
        const currentJSON = JSON.stringify(
          currentCart
        );

        const storedJSON = JSON.stringify(
          storedCart
        );

        if (currentJSON === storedJSON) {
          return currentCart;
        }

        return storedCart;
      });
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    window.addEventListener(
      "cartUpdated",
      handleCartUpdated
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      window.removeEventListener(
        "cartUpdated",
        handleCartUpdated
      );
    };
  }, []);

  // ===================================================
  // ADD TO CART
  // ===================================================

  const addToCart = useCallback((product) => {
    if (!product || !product._id) {
      console.error(
        "Cannot add invalid product to cart."
      );
      return;
    }

    setCartItems((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item._id === product._id
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 1) + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  }, []);

  // ===================================================
  // REMOVE FROM CART
  // ===================================================

  const removeFromCart = useCallback((id) => {
    if (!id) {
      return;
    }

    setCartItems((currentCart) =>
      currentCart.filter(
        (item) => item._id !== id
      )
    );
  }, []);

  // ===================================================
  // INCREASE QUANTITY
  // ===================================================

  const increaseQuantity = useCallback((id) => {
    if (!id) {
      return;
    }

    setCartItems((currentCart) =>
      currentCart.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity:
                Number(item.quantity || 1) + 1,
            }
          : item
      )
    );
  }, []);

  // ===================================================
  // DECREASE QUANTITY
  // ===================================================

  const decreaseQuantity = useCallback((id) => {
    if (!id) {
      return;
    }

    setCartItems((currentCart) =>
      currentCart.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity: Math.max(
                1,
                Number(item.quantity || 1) - 1
              ),
            }
          : item
      )
    );
  }, []);

  // ===================================================
  // SET QUANTITY
  // ===================================================
  //
  // Useful if a future checkout/cart component wants
  // to directly enter a quantity.
  //
  // ===================================================

  const setQuantity = useCallback(
    (id, quantity) => {
      if (!id) {
        return;
      }

      const parsedQuantity = Number(quantity);

      if (!Number.isFinite(parsedQuantity)) {
        return;
      }

      setCartItems((currentCart) =>
        currentCart.map((item) =>
          item._id === id
            ? {
                ...item,
                quantity: Math.max(
                  1,
                  Math.floor(parsedQuantity)
                ),
              }
            : item
        )
      );
    },
    []
  );

  // ===================================================
  // CLEAR CART
  // ===================================================

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // ===================================================
  // CART ITEM COUNT
  // ===================================================

  const totalItems = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total +
        Math.max(
          1,
          Number(item.quantity) || 1
        ),
      0
    );
  }, [cartItems]);

  // ===================================================
  // SUBTOTAL
  // ===================================================

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => {
        const price = Number(item.price) || 0;
        const quantity =
          Math.max(
            1,
            Number(item.quantity) || 1
          );

        return total + price * quantity;
      },
      0
    );
  }, [cartItems]);

  // ===================================================
  // GST
  // ===================================================

  const gst = useMemo(() => {
    return subtotal * GST_RATE;
  }, [subtotal]);

  // ===================================================
  // GRAND TOTAL
  // ===================================================

  const grandTotal = useMemo(() => {
    return subtotal + gst;
  }, [subtotal, gst]);

  // ===================================================
  // FORMATTED VALUES
  // ===================================================

  const formattedSubtotal = useMemo(() => {
    return subtotal.toFixed(2);
  }, [subtotal]);

  const formattedGst = useMemo(() => {
    return gst.toFixed(2);
  }, [gst]);

  const formattedGrandTotal = useMemo(() => {
    return grandTotal.toFixed(2);
  }, [grandTotal]);

  // ===================================================
  // CONTEXT VALUE
  // ===================================================

  const value = useMemo(
    () => ({
      // Cart
      cartItems,

      // Cart operations
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      setQuantity,
      clearCart,

      // Counts
      totalItems,

      // Pricing
      subtotal,
      gst,
      grandTotal,

      // Formatted pricing
      formattedSubtotal,
      formattedGst,
      formattedGrandTotal,

      // Configuration
      gstRate: GST_RATE,
    }),
    [
      cartItems,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      setQuantity,
      clearCart,
      totalItems,
      subtotal,
      gst,
      grandTotal,
      formattedSubtotal,
      formattedGst,
      formattedGrandTotal,
    ]
  );

  // ===================================================
  // PROVIDER
  // ===================================================

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// =====================================================
// USE CART HOOK
// =====================================================

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
};

export default CartContext;