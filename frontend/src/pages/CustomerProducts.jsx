import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import {
  FaSearch,
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaIceCream,
  FaFilter,
  FaTimes,
  FaArrowRight,
  FaSpinner,
  FaExclamationCircle,
  FaCheck,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import api from "../api/api";

import "./CustomerProducts.css";

const CART_STORAGE_KEY = "icecream_customer_cart";

const CustomerProducts = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [cart, setCart] = useState(() => {
    try {
      const savedCart =
        localStorage.getItem(CART_STORAGE_KEY);

      return savedCart
        ? JSON.parse(savedCart)
        : [];
    } catch {
      return [];
    }
  });

  /*
   * ============================================================
   * FETCH PRODUCTS
   * ============================================================
   */

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  /*
   * Persist cart
   */

  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    );
  }, [cart]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/products/available");

      const data = response?.data;

      setProducts(
        Array.isArray(data?.products)
          ? data.products
          : []
      );
    } catch (err) {
      console.error(
        "Customer products error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);

      const response =
        await api.get("/categories/active");

      const data = response?.data;

      setCategories(
        Array.isArray(data?.categories)
          ? data.categories
          : []
      );
    } catch (err) {
      console.error(
        "Customer categories error:",
        err
      );

      setCategories([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  /*
   * ============================================================
   * FILTER PRODUCTS
   * ============================================================
   */

  const filteredProducts = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        product.sku
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        product.description
          ?.toLowerCase()
          .includes(normalizedSearch);

      const productCategoryId =
        typeof product.category === "object"
          ? product.category?._id
          : product.category;

      const matchesCategory =
        selectedCategory === "all" ||
        productCategoryId === selectedCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    products,
    search,
    selectedCategory,
  ]);

  /*
   * ============================================================
   * CART HELPERS
   * ============================================================
   */

  const getCartQuantity = (productId) => {
    const item = cart.find(
      (cartItem) =>
        cartItem.product === productId
    );

    return item?.quantity || 0;
  };

  const addToCart = (product) => {
    setCart((previousCart) => {
      const existingIndex =
        previousCart.findIndex(
          (item) =>
            item.product === product._id
        );

      if (existingIndex !== -1) {
        return previousCart.map(
          (item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
                }
              : item
        );
      }

      return [
        ...previousCart,
        {
          product: product._id,
          name: product.name,
          sku: product.sku,
          image: product.image || "",
          price: Number(product.price) || 0,
          taxRate:
            Number(product.taxRate) || 0,
          unit:
            product.unit || "piece",
          quantity: 1,
        },
      ];
    });

    toast.success(
      `${product.name} added to cart`,
      {
        autoClose: 1600,
      }
    );
  };

  const increaseQuantity = (productId) => {
    setCart((previousCart) =>
      previousCart.map((item) =>
        item.product === productId
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (productId) => {
    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item.product === productId
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    );
  };

  /*
   * ============================================================
   * CART TOTALS
   * ============================================================
   */

  const cartCount = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const cartTax = useMemo(
    () =>
      cart.reduce(
        (total, item) => {
          const lineSubtotal =
            Number(item.price || 0) *
            Number(item.quantity || 0);

          const tax =
            (lineSubtotal *
              Number(item.taxRate || 0)) /
            100;

          return total + tax;
        },
        0
      ),
    [cart]
  );

  const cartTotal =
    cartSubtotal + cartTax;

  /*
   * ============================================================
   * NAVIGATION
   * ============================================================
   */

  const goToCart = () => {
    navigate("/customer/cart");
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
  };

  /*
   * ============================================================
   * IMAGE FALLBACK
   * ============================================================
   */

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="customer-products-page">
      <div className="customer-products-container">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <motion.div
          className="customer-products-header"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
          }}
        >
          <div>
            <span className="customer-products-eyebrow">
              OUR MENU
            </span>

            <h1>
              Find your perfect scoop
            </h1>

            <p>
              Explore our delicious collection
              of ice creams, desserts,
              beverages and more.
            </p>
          </div>

          <motion.button
            className="customer-cart-summary"
            onClick={goToCart}
            whileHover={{
              y: -3,
            }}
            whileTap={{
              scale: 0.97,
            }}
          >
            <div className="customer-cart-summary-icon">
              <FaShoppingCart />
            </div>

            <div className="customer-cart-summary-content">
              <span>
                {cartCount}{" "}
                {cartCount === 1
                  ? "item"
                  : "items"}
              </span>

              <strong>
                ₹
                {cartTotal.toFixed(2)}
              </strong>
            </div>

            <div className="customer-cart-summary-arrow">
              <FaArrowRight />
            </div>
          </motion.button>
        </motion.div>

        {/* =====================================================
            FILTER BAR
        ====================================================== */}

        <motion.div
          className="customer-product-filters"
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
            duration: 0.4,
          }}
        >
          <div className="customer-product-search">
            <FaSearch />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search ice creams, desserts..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="customer-search-clear"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="customer-category-filter">
            <FaFilter />

            <select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(
                  event.target.value
                )
              }
              disabled={categoryLoading}
            >
              <option value="all">
                All Categories
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
          </div>
        </motion.div>

        {/* =====================================================
            CATEGORY CHIPS
        ====================================================== */}

        {!categoryLoading &&
          categories.length > 0 && (
            <div className="customer-category-chips">
              <button
                type="button"
                className={
                  selectedCategory === "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedCategory("all")
                }
              >
                All
              </button>

              {categories.map(
                (category) => (
                  <button
                    type="button"
                    key={category._id}
                    className={
                      selectedCategory ===
                      category._id
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSelectedCategory(
                        category._id
                      )
                    }
                  >
                    {category.name}
                  </button>
                )
              )}
            </div>
          )}

        {/* =====================================================
            RESULT INFO
        ====================================================== */}

        {!loading &&
          !error && (
            <div className="customer-products-result-bar">
              <div>
                <strong>
                  {selectedCategory ===
                  "all"
                    ? "All Products"
                    : categories.find(
                        (category) =>
                          category._id ===
                          selectedCategory
                      )?.name ||
                      "Products"}
                </strong>

                <span>
                  {" "}
                  •{" "}
                  {filteredProducts.length}{" "}
                  products
                </span>
              </div>

              {(search ||
                selectedCategory !==
                  "all") && (
                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading && (
          <div className="customer-products-state">
            <FaSpinner className="spin" />

            <h3>
              Loading delicious treats...
            </h3>

            <p>
              We're preparing the menu
              for you.
            </p>
          </div>
        )}

        {/* =====================================================
            ERROR
        ====================================================== */}

        {!loading && error && (
          <div className="customer-products-state error">
            <div className="state-icon">
              <FaExclamationCircle />
            </div>

            <h3>
              Unable to load products
            </h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={fetchProducts}
            >
              Try Again
            </button>
          </div>
        )}

        {/* =====================================================
            EMPTY
        ====================================================== */}

        {!loading &&
          !error &&
          filteredProducts.length ===
            0 && (
            <div className="customer-products-state">
              <div className="state-icon">
                <FaIceCream />
              </div>

              <h3>
                No products found
              </h3>

              <p>
                {search ||
                selectedCategory !==
                  "all"
                  ? "Try changing your search or category filter."
                  : "There are currently no products available."}
              </p>

              {(search ||
                selectedCategory !==
                  "all") && (
                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

        {/* =====================================================
            PRODUCT GRID
        ====================================================== */}

        {!loading &&
          !error &&
          filteredProducts.length >
            0 && (
            <motion.div
              className="customer-products-grid"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.045,
                  },
                },
              }}
            >
              <AnimatePresence>
                {filteredProducts.map(
                  (product) => {
                    const quantity =
                      getCartQuantity(
                        product._id
                      );

                    const categoryName =
                      typeof product.category ===
                      "object"
                        ? product.category
                            ?.name
                        : "";

                    return (
                      <motion.article
                        key={product._id}
                        className="customer-product-card"
                        variants={{
                          hidden: {
                            opacity: 0,
                            y: 20,
                          },
                          visible: {
                            opacity: 1,
                            y: 0,
                          },
                        }}
                        layout
                      >
                        {/* IMAGE */}

                        <div className="customer-product-image">
                          {product.image ? (
                            <img
                              src={
                                product.image
                              }
                              alt={
                                product.name
                              }
                              onError={(
                                event
                              ) => {
                                event.currentTarget.style.display =
                                  "none";

                                event.currentTarget.parentElement.classList.add(
                                  "fallback"
                                );
                              }}
                            />
                          ) : (
                            <div className="customer-product-image-placeholder">
                              <FaIceCream />
                            </div>
                          )}

                          <div className="customer-product-image-overlay">
                            <span>
                              {categoryName ||
                                "Ice Cream"}
                            </span>
                          </div>

                          {quantity > 0 && (
                            <motion.div
                              className="customer-product-added"
                              initial={{
                                scale: 0,
                              }}
                              animate={{
                                scale: 1,
                              }}
                            >
                              <FaCheck />
                              Added
                            </motion.div>
                          )}
                        </div>

                        {/* CONTENT */}

                        <div className="customer-product-content">
                          <div className="customer-product-title-row">
                            <div>
                              <h3>
                                {
                                  product.name
                                }
                              </h3>

                              {product.sku && (
                                <span className="customer-product-sku">
                                  {
                                    product.sku
                                  }
                                </span>
                              )}
                            </div>

                            <strong className="customer-product-price">
                              ₹
                              {Number(
                                product.price ||
                                  0
                              ).toFixed(2)}
                            </strong>
                          </div>

                          {product.description && (
                            <p className="customer-product-description">
                              {
                                product.description
                              }
                            </p>
                          )}

                          <div className="customer-product-footer">
                            <span className="customer-product-unit">
                              Per{" "}
                              {product.unit ||
                                "piece"}
                            </span>

                            {quantity ===
                            0 ? (
                              <motion.button
                                type="button"
                                className="add-cart-button"
                                onClick={() =>
                                  addToCart(
                                    product
                                  )
                                }
                                whileHover={{
                                  y: -2,
                                }}
                                whileTap={{
                                  scale: 0.96,
                                }}
                              >
                                <FaPlus />
                                Add to Cart
                              </motion.button>
                            ) : (
                              <div className="product-quantity-control">
                                <button
                                  type="button"
                                  onClick={() =>
                                    decreaseQuantity(
                                      product._id
                                    )
                                  }
                                  aria-label="Decrease quantity"
                                >
                                  <FaMinus />
                                </button>

                                <span>
                                  {quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    increaseQuantity(
                                      product._id
                                    )
                                  }
                                  aria-label="Increase quantity"
                                >
                                  <FaPlus />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    );
                  }
                )}
              </AnimatePresence>
            </motion.div>
          )}

        {/* =====================================================
            FLOATING CART
        ====================================================== */}

        {cartCount > 0 && (
          <motion.button
            className="customer-floating-cart"
            onClick={goToCart}
            initial={{
              opacity: 0,
              y: 30,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 30,
              scale: 0.9,
            }}
            whileHover={{
              y: -4,
            }}
            whileTap={{
              scale: 0.96,
            }}
          >
            <div className="floating-cart-icon">
              <FaShoppingCart />

              <span>
                {cartCount}
              </span>
            </div>

            <div className="floating-cart-text">
              <strong>
                View Cart
              </strong>

              <small>
                {cartCount}{" "}
                {cartCount === 1
                  ? "item"
                  : "items"}
              </small>
            </div>

            <strong className="floating-cart-total">
              ₹
              {cartTotal.toFixed(2)}
            </strong>

            <FaArrowRight />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default CustomerProducts;