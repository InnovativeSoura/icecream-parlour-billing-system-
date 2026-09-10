// frontend/src/context/CartContext.jsx

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const CART_KEY = "icecream_cart";

// =====================================================
// CART PROVIDER
// =====================================================

export const CartProvider = ({ children }) => {
  // ---------------------------------------------------
  // LOAD CART FROM LOCAL STORAGE
  // ---------------------------------------------------

  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem(CART_KEY);

      if (!storedCart) {
        return [];
      }

      const parsedCart = JSON.parse(storedCart);

      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch (error) {
      console.error(
        "Failed to load cart from localStorage:",
        error
      );

      return [];
    }
  });

  // ---------------------------------------------------
  // SAVE CART TO LOCAL STORAGE
  // ---------------------------------------------------

  useEffect(() => {
    try {
      localStorage.setItem(
        CART_KEY,
        JSON.stringify(cartItems)
      );

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

  // ---------------------------------------------------
  // ADD TO CART
  // ---------------------------------------------------

  const addToCart = (product) => {
    if (!product?._id) {
      console.warn(
        "Cannot add product without _id:",
        product
      );
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item._id === product._id
      );

      if (existingItem) {
        return currentItems.map((item) =>
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
        ...currentItems,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  // ---------------------------------------------------
  // REMOVE FROM CART
  // ---------------------------------------------------

  const removeFromCart = (id) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => item._id !== id
      )
    );
  };

  // ---------------------------------------------------
  // INCREASE QUANTITY
  // ---------------------------------------------------

  const increaseQuantity = (id) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity:
                Number(item.quantity || 1) + 1,
            }
          : item
      )
    );
  };

  // ---------------------------------------------------
  // DECREASE QUANTITY
  // ---------------------------------------------------

  const decreaseQuantity = (id) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity:
                Number(item.quantity || 1) > 1
                  ? Number(item.quantity || 1) - 1
                  : 1,
            }
          : item
      )
    );
  };

  // ---------------------------------------------------
  // CLEAR CART
  // ---------------------------------------------------

  const clearCart = () => {
    setCartItems([]);
  };

  // ---------------------------------------------------
  // TOTAL ITEMS
  // ---------------------------------------------------

  const totalItems = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + Number(item.quantity || 1),
      0
    );
  }, [cartItems]);

  // ---------------------------------------------------
  // SUBTOTAL
  // ---------------------------------------------------

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => {
        const price = Number(
          item.price ??
            item.unitPrice ??
            0
        );

        const quantity = Number(
          item.quantity || 1
        );

        return total + price * quantity;
      },
      0
    );
  }, [cartItems]);

  // ---------------------------------------------------
  // GST
  // ---------------------------------------------------

  const gst = useMemo(() => {
    return subtotal * 0.18;
  }, [subtotal]);

  // ---------------------------------------------------
  // GRAND TOTAL
  // ---------------------------------------------------

  const grandTotal = useMemo(() => {
    return subtotal + gst;
  }, [subtotal, gst]);

  // ---------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    totalItems,
    subtotal,
    gst,
    grandTotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// =====================================================
// USE CART
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