// frontend/src/pages/CustomerDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaBars,
  FaBoxOpen,
  FaCheckCircle,
  FaChevronRight,
  FaIceCream,
  FaMinus,
  FaPlus,
  FaSearch,
  FaShoppingBag,
  FaShoppingCart,
  FaSignOutAlt,
  FaStar,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import api from "../api/api";

import "./CustomerDashboard.css";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80";

const CustomerDashboard = () => {
  const { user, logout } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("icecream_customer_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /*
   * ---------------------------------------------------------
   * FETCH PRODUCTS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const response = await api.get("/products");
        const data = response?.data;

        const productList =
          data?.products ||
          data?.data ||
          (Array.isArray(data) ? data : []);

        setProducts(Array.isArray(productList) ? productList : []);
      } catch (error) {
        console.error("Failed to load products:", error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  /*
   * ---------------------------------------------------------
   * FETCH ACTIVE CATEGORIES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        const response = await api.get("/categories/active");
        const data = response?.data;

        const categoryList =
          data?.categories ||
          data?.data ||
          (Array.isArray(data) ? data : []);

        setCategories(Array.isArray(categoryList) ? categoryList : []);
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  /*
   * ---------------------------------------------------------
   * SAVE CART
   * ---------------------------------------------------------
   */

  useEffect(() => {
    localStorage.setItem(
      "icecream_customer_cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  /*
   * ---------------------------------------------------------
   * NORMALIZE PRODUCT DATA
   * ---------------------------------------------------------
   */

  const getProductId = (product) =>
    product?._id || product?.id || product?.productId;

  const getProductName = (product) =>
    product?.name ||
    product?.productName ||
    product?.title ||
    "Ice Cream";

  const getProductPrice = (product) =>
    Number(
      product?.sellingPrice ??
        product?.price ??
        product?.unitPrice ??
        product?.salePrice ??
        0
    );

  const getProductImage = (product) =>
    product?.image ||
    product?.imageUrl ||
    product?.photo ||
    product?.thumbnail ||
    FALLBACK_IMAGE;

  const getCategoryId = (product) => {
    if (!product?.category) return "";

    if (typeof product.category === "object") {
      return (
        product.category?._id ||
        product.category?.id ||
        product.category?.name ||
        ""
      );
    }

    return product.category;
  };

  /*
   * ---------------------------------------------------------
   * FILTER PRODUCTS
   * ---------------------------------------------------------
   */

  const filteredProducts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const name = getProductName(product).toLowerCase();

      const matchesSearch =
        !search ||
        name.includes(search) ||
        product?.description?.toLowerCase?.().includes(search);

      const categoryValue = getCategoryId(product);

      let matchesCategory = true;

      if (selectedCategory !== "all") {
        const selected = categories.find(
          (category) =>
            String(category?._id || category?.id) ===
            String(selectedCategory)
        );

        matchesCategory =
          String(categoryValue) === String(selectedCategory) ||
          String(categoryValue).toLowerCase() ===
            String(selected?.name || "").toLowerCase();
      }

      return matchesSearch && matchesCategory;
    });
  }, [
    products,
    categories,
    searchTerm,
    selectedCategory,
  ]);

  /*
   * ---------------------------------------------------------
   * CART
   * ---------------------------------------------------------
   */

  const getCartQuantity = (productId) => {
    const item = cart.find(
      (cartItem) => String(cartItem.id) === String(productId)
    );

    return item?.quantity || 0;
  };

  const addToCart = (product) => {
    const id = getProductId(product);

    if (!id) {
      console.error("Product ID missing:", product);
      return;
    }

    const existing = cart.find(
      (item) => String(item.id) === String(id)
    );

    if (existing) {
      setCart((current) =>
        current.map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
    } else {
      setCart((current) => [
        ...current,
        {
          id,
          name: getProductName(product),
          price: getProductPrice(product),
          image: getProductImage(product),
          quantity: 1,
        },
      ]);
    }
  };

  const decreaseCartItem = (product) => {
    const id = getProductId(product);

    setCart((current) =>
      current
        .map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                quantity: Math.max(item.quantity - 1, 0),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartCount = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const cartTotal = useMemo(
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

  /*
   * ---------------------------------------------------------
   * CATEGORY ICONS
   * ---------------------------------------------------------
   */

  const getCategoryIcon = (name = "") => {
    const value = name.toLowerCase();

    if (
      value.includes("ice cream") ||
      value.includes("icecream")
    ) {
      return <FaIceCream />;
    }

    if (
      value.includes("cake") ||
      value.includes("brownie")
    ) {
      return <FaBoxOpen />;
    }

    if (
      value.includes("beverage") ||
      value.includes("drink") ||
      value.includes("shake")
    ) {
      return <FaShoppingBag />;
    }

    return <FaStar />;
  };

  /*
   * ---------------------------------------------------------
   * LOGOUT
   * ---------------------------------------------------------
   */

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="customer-dashboard">
      {/* =====================================================
          TOP NAVIGATION
      ====================================================== */}

      <header className="customer-navbar">
        <div className="customer-navbar-inner">
          <Link
            to="/customer/dashboard"
            className="customer-brand"
          >
            <div className="customer-brand-icon">
              <FaIceCream />
            </div>

            <div className="customer-brand-text">
              <strong>IceCream Parlour</strong>
              <span>Sweet moments, every day</span>
            </div>
          </Link>

          <nav className="customer-desktop-nav">
            <Link
              to="/customer/dashboard"
              className="customer-nav-link active"
            >
              Home
            </Link>

            <a
              href="#menu"
              className="customer-nav-link"
            >
              Menu
            </a>

            <a
              href="#categories"
              className="customer-nav-link"
            >
              Categories
            </a>

            <Link
              to="/customer/orders"
              className="customer-nav-link"
            >
              My Orders
            </Link>
          </nav>

          <div className="customer-nav-actions">
            <Link
              to="/customer/cart"
              className="customer-cart-button"
              aria-label="Shopping cart"
            >
              <FaShoppingCart />

              {cartCount > 0 && (
                <span className="customer-cart-count">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="customer-profile">
              <div className="customer-profile-avatar">
                <FaUserCircle />
              </div>

              <div className="customer-profile-info">
                <strong>{user?.name || "Customer"}</strong>
                <span>Customer</span>
              </div>

              <button
                type="button"
                className="customer-logout-button"
                onClick={handleLogout}
                title="Logout"
              >
                <FaSignOutAlt />
              </button>
            </div>

            <button
              type="button"
              className="customer-mobile-menu-button"
              onClick={() =>
                setMobileMenuOpen((current) => !current)
              }
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            className="customer-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <a
              href="#menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </a>

            <a
              href="#categories"
              onClick={() => setMobileMenuOpen(false)}
            >
              Categories
            </a>

            <Link
              to="/customer/orders"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Orders
            </Link>

            <Link
              to="/customer/cart"
              onClick={() => setMobileMenuOpen(false)}
            >
              Cart
              {cartCount > 0 && ` (${cartCount})`}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              Logout
            </button>
          </motion.div>
        )}
      </header>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="customer-main">
        {/* HERO */}

        <section className="customer-hero">
          <div className="customer-hero-content">
            <motion.div
              className="customer-hero-copy"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="customer-hero-badge">
                <FaStar />
                Freshly made happiness
              </span>

              <h1>
                Welcome back,
                <br />
                <span>{user?.name || "Ice Cream Lover"}!</span>
              </h1>

              <p>
                Discover delicious flavours, creamy
                sundaes and irresistible treats made
                specially for your sweet moments.
              </p>

              <div className="customer-hero-actions">
                <a
                  href="#menu"
                  className="customer-primary-button"
                >
                  Explore Menu
                  <FaArrowRight />
                </a>

                <Link
                  to="/customer/orders"
                  className="customer-secondary-button"
                >
                  <FaBoxOpen />
                  My Orders
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="customer-hero-visual"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.7,
                delay: 0.15,
              }}
            >
              <div className="customer-hero-orbit orbit-one" />
              <div className="customer-hero-orbit orbit-two" />

              <div className="customer-hero-icecream">
                <div className="customer-scoop scoop-pink" />
                <div className="customer-scoop scoop-cream" />
                <div className="customer-scoop scoop-brown" />

                <div className="customer-cone">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="customer-floating-card customer-floating-card-one">
                <FaCheckCircle />
                <div>
                  <strong>Fresh & Delicious</strong>
                  <span>Made with quality ingredients</span>
                </div>
              </div>

              <div className="customer-floating-card customer-floating-card-two">
                <FaStar />
                <div>
                  <strong>Customer Favourite</strong>
                  <span>Sweetness worth sharing</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* QUICK STATS */}

        <section className="customer-quick-stats">
          <div className="customer-stat-card">
            <div className="customer-stat-icon">
              <FaIceCream />
            </div>
            <div>
              <strong>{products.length}</strong>
              <span>Menu Items</span>
            </div>
          </div>

          <div className="customer-stat-card">
            <div className="customer-stat-icon">
              <FaShoppingCart />
            </div>
            <div>
              <strong>{cartCount}</strong>
              <span>Items in Cart</span>
            </div>
          </div>

          <div className="customer-stat-card">
            <div className="customer-stat-icon">
              <FaStar />
            </div>
            <div>
              <strong>Fresh</strong>
              <span>Every single day</span>
            </div>
          </div>

          <div className="customer-stat-card">
            <div className="customer-stat-icon">
              <FaCheckCircle />
            </div>
            <div>
              <strong>Secure</strong>
              <span>Online payments</span>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}

        <section
          className="customer-section"
          id="categories"
        >
          <div className="customer-section-heading">
            <div>
              <span className="customer-section-eyebrow">
                Explore
              </span>

              <h2>Browse by Category</h2>

              <p>
                Find exactly what you're craving.
              </p>
            </div>

            <a href="#menu">
              View Menu
              <FaChevronRight />
            </a>
          </div>

          <div className="customer-category-list">
            <button
              type="button"
              className={`customer-category-card ${
                selectedCategory === "all"
                  ? "selected"
                  : ""
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              <div className="customer-category-icon">
                <FaIceCream />
              </div>

              <div>
                <strong>All Treats</strong>
                <span>{products.length} items</span>
              </div>

              <FaChevronRight className="customer-category-arrow" />
            </button>

            {loadingCategories ? (
              <div className="customer-category-loading">
                Loading categories...
              </div>
            ) : (
              categories.map((category) => {
                const categoryId =
                  category?._id || category?.id;

                return (
                  <button
                    type="button"
                    key={categoryId}
                    className={`customer-category-card ${
                      String(selectedCategory) ===
                      String(categoryId)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedCategory(categoryId)
                    }
                  >
                    <div className="customer-category-icon">
                      {getCategoryIcon(category?.name)}
                    </div>

                    <div>
                      <strong>
                        {category?.name || "Category"}
                      </strong>

                      <span>
                        Delicious choices
                      </span>
                    </div>

                    <FaChevronRight className="customer-category-arrow" />
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* MENU */}

        <section
          className="customer-section customer-menu-section"
          id="menu"
        >
          <div className="customer-section-heading">
            <div>
              <span className="customer-section-eyebrow">
                Our Menu
              </span>

              <h2>Pick Your Favourite</h2>

              <p>
                Handpicked treats for every mood.
              </p>
            </div>

            <div className="customer-menu-search">
              <FaSearch />

              <input
                type="text"
                placeholder="Search treats..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {/* PRODUCT GRID */}

          {loadingProducts ? (
            <div className="customer-products-loading">
              <div className="customer-loader" />
              <p>Loading delicious treats...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="customer-empty-products">
              <div className="customer-empty-icon">
                <FaIceCream />
              </div>

              <h3>No treats found</h3>

              <p>
                Try another search or select a
                different category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
              >
                Show All Items
              </button>
            </div>
          ) : (
            <div className="customer-product-grid">
              {filteredProducts.map((product, index) => {
                const id = getProductId(product);
                const quantity = getCartQuantity(id);
                const price = getProductPrice(product);

                return (
                  <motion.article
                    className="customer-product-card"
                    key={id || index}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(index * 0.04, 0.4),
                    }}
                  >
                    <div className="customer-product-image-wrapper">
                      <img
                        src={getProductImage(product)}
                        alt={getProductName(product)}
                        className="customer-product-image"
                        onError={(event) => {
                          event.currentTarget.src =
                            FALLBACK_IMAGE;
                        }}
                      />

                      {product?.isFeatured && (
                        <span className="customer-product-badge">
                          <FaStar />
                          Popular
                        </span>
                      )}

                      {quantity > 0 && (
                        <span className="customer-product-cart-badge">
                          {quantity} in cart
                        </span>
                      )}
                    </div>

                    <div className="customer-product-content">
                      <span className="customer-product-category">
                        {typeof product?.category ===
                        "object"
                          ? product?.category?.name ||
                            "Treat"
                          : "Freshly made"}
                      </span>

                      <h3>
                        {getProductName(product)}
                      </h3>

                      <p>
                        {product?.description ||
                          "A delicious treat made with quality ingredients."}
                      </p>

                      <div className="customer-product-footer">
                        <div className="customer-product-price">
                          <small>Starting from</small>
                          <strong>
                            ₹{price.toFixed(2)}
                          </strong>
                        </div>

                        {quantity === 0 ? (
                          <button
                            type="button"
                            className="customer-add-button"
                            onClick={() =>
                              addToCart(product)
                            }
                          >
                            <FaPlus />
                            Add
                          </button>
                        ) : (
                          <div className="customer-quantity-control">
                            <button
                              type="button"
                              onClick={() =>
                                decreaseCartItem(product)
                              }
                              aria-label="Decrease quantity"
                            >
                              <FaMinus />
                            </button>

                            <strong>{quantity}</strong>

                            <button
                              type="button"
                              onClick={() =>
                                addToCart(product)
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
              })}
            </div>
          )}
        </section>

        {/* CART SUMMARY */}

        {cartCount > 0 && (
          <motion.section
            className="customer-cart-summary"
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <div className="customer-cart-summary-icon">
              <FaShoppingCart />
            </div>

            <div className="customer-cart-summary-info">
              <strong>
                Your sweet selection is ready!
              </strong>

              <span>
                {cartCount}{" "}
                {cartCount === 1 ? "item" : "items"} in
                your cart
              </span>
            </div>

            <div className="customer-cart-summary-total">
              <small>Total</small>
              <strong>
                ₹{cartTotal.toFixed(2)}
              </strong>
            </div>

            <Link
              to="/customer/cart"
              className="customer-checkout-button"
            >
              View Cart
              <FaArrowRight />
            </Link>
          </motion.section>
        )}

        {/* ACCOUNT CTA */}

        <section className="customer-account-section">
          <div className="customer-account-card">
            <div className="customer-account-icon">
              <FaUserCircle />
            </div>

            <div className="customer-account-content">
              <span>YOUR ACCOUNT</span>

              <h2>
                Your sweet journey starts here.
              </h2>

              <p>
                Keep track of your orders, manage your
                profile and enjoy a seamless ordering
                experience.
              </p>
            </div>

            <Link
              to="/customer/profile"
              className="customer-account-button"
            >
              View Profile
              <FaArrowRight />
            </Link>
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="customer-footer">
        <div className="customer-footer-inner">
          <div className="customer-footer-brand">
            <div className="customer-brand-icon">
              <FaIceCream />
            </div>

            <div>
              <strong>IceCream Parlour</strong>
              <span>
                Making every moment sweeter.
              </span>
            </div>
          </div>

          <div className="customer-footer-links">
            <a href="#menu">Menu</a>

            <a href="#categories">Categories</a>

            <Link to="/customer/orders">
              My Orders
            </Link>

            <Link to="/customer/profile">
              Profile
            </Link>
          </div>

          <button
            type="button"
            className="customer-footer-logout"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>

        <div className="customer-footer-bottom">
          <span>
            © {new Date().getFullYear()} IceCream
            Parlour. All rights reserved.
          </span>

          <span>
            Crafted for ice cream lovers 🍦
          </span>
        </div>
      </footer>
    </div>
  );
};

export default CustomerDashboard;