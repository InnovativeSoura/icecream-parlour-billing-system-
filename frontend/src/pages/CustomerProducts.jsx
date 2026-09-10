import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBoxOpen,
  FaCartPlus,
  FaCheck,
  FaChevronDown,
  FaIceCream,
  FaReceipt,
  FaSearch,
  FaShoppingBag,
  FaSignOutAlt,
  FaSpinner,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import "./CustomerProducts.css";

const CustomerProducts = () => {
  const { user, logout } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("customerCart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [addedProduct, setAddedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    localStorage.setItem("customerCart", JSON.stringify(cart));
  }, [cart]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await api.get("/products/available");

      const data = response?.data;

      if (Array.isArray(data)) {
        setProducts(data);
      } else if (Array.isArray(data?.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch customer products:", error);

      if (error?.response) {
        console.error(
          "Customer products API error:",
          error.response.status,
          error.response.data,
        );
      }

      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);

      const response = await api.get("/categories/active");

      const data = response?.data;

      if (Array.isArray(data)) {
        setCategories(data);
      } else if (Array.isArray(data?.categories)) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const productCategory =
        typeof product.category === "object"
          ? product.category?._id || product.category?.name
          : product.category;

      const categoryName =
        typeof product.category === "object" ? product.category?.name : "";

      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "all" ||
        productCategory === selectedCategory ||
        categoryName === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const cartCount = useMemo(() => {
    return cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
  }, [cart]);

  const getCategoryName = (product) => {
    if (!product?.category) {
      return "Ice Cream";
    }

    if (typeof product.category === "object") {
      return product.category?.name || "Ice Cream";
    }

    const foundCategory = categories.find(
      (category) =>
        category._id === product.category || category.id === product.category,
    );

    return foundCategory?.name || product.category;
  };

  const addToCart = (product) => {
    if (!product?._id) return;

    setCart((previousCart) => {
      const existing = previousCart.find(
        (item) => item.productId === product._id,
      );

      if (existing) {
        return previousCart.map((item) =>
          item.productId === product._id
            ? {
                ...item,
                quantity: Number(item.quantity || 0) + 1,
              }
            : item,
        );
      }

      return [
        ...previousCart,
        {
          productId: product._id,
          name: product.name,
          sku: product.sku || "",
          price: Number(product.price || 0),
          image: product.image || "",
          quantity: 1,
        },
      ];
    });

    setAddedProduct(product._id);

    setTimeout(() => {
      setAddedProduct(null);
    }, 1300);
  };

  const getProductQuantity = (productId) => {
    const item = cart.find((cartItem) => cartItem.productId === productId);
    return item?.quantity || 0;
  };

  const clearSearch = () => {
    setSearch("");
  };

  const selectedCategoryName =
    selectedCategory === "all"
      ? "All Products"
      : categories.find(
          (category) =>
            category._id === selectedCategory ||
            category.id === selectedCategory,
        )?.name || selectedCategory;

  return (
    <div className="customer-products-page">
      {/* SIDEBAR */}
      <aside className="customer-products-sidebar">
        <div className="customer-products-brand">
          <div className="customer-products-brand-icon">
            <FaIceCream />
          </div>

          <div>
            <h2>IceCream</h2>
            <span>PARLOUR</span>
          </div>
        </div>

        <nav className="customer-products-navigation">
          <a href="/customer/dashboard" className="customer-products-nav-item">
            <FaBoxOpen />
            <span>Dashboard</span>
          </a>

          <a
            href="/customer/products"
            className="customer-products-nav-item active"
          >
            <FaIceCream />
            <span>Browse Products</span>
          </a>

          <a href="/customer/orders" className="customer-products-nav-item">
            <FaShoppingBag />
            <span>My Orders</span>
          </a>

          <a href="/customer/cart" className="customer-products-nav-item">
            <FaCartPlus />
            <span>My Cart</span>

            {cartCount > 0 && (
              <b className="customer-products-nav-count">{cartCount}</b>
            )}
          </a>

          <a href="/customer/invoices" className="customer-products-nav-item">
            <FaReceipt />
            <span>Invoices</span>
          </a>

          <a href="/customer/profile" className="customer-products-nav-item">
            <FaUserCircle />
            <span>My Profile</span>
          </a>
        </nav>

        <div className="customer-products-sidebar-bottom">
          <button
            type="button"
            className="customer-products-logout"
            onClick={logout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="customer-products-main">
        {/* TOPBAR */}
        <header className="customer-products-topbar">
          <div className="customer-products-mobile-brand">
            <div className="customer-products-brand-icon">
              <FaIceCream />
            </div>

            <span>IceCream Parlour</span>
          </div>

          <div className="customer-products-topbar-actions">
            <button
              type="button"
              className="customer-products-cart-button"
              onClick={() => {
                window.location.href = "/customer/cart";
              }}
            >
              <FaCartPlus />

              {cartCount > 0 && (
                <span className="customer-products-cart-badge">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="customer-products-profile">
              <div className="customer-products-avatar">
                {(user?.name || "Customer").charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{user?.name || "Customer"}</strong>
                <span>Customer</span>
              </div>
            </div>
          </div>
        </header>

        <section className="customer-products-content">
          {/* PAGE HEADER */}
          <motion.div
            className="customer-products-header"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <span className="customer-products-eyebrow">OUR MENU</span>

              <h1>Find your perfect scoop</h1>

              <p>
                Explore our delicious collection of ice creams, desserts,
                beverages and more.
              </p>
            </div>

            <div className="customer-products-header-cart">
              <div>
                <span>{cartCount} items</span>
                <strong>₹{cartTotal.toFixed(2)}</strong>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/customer/cart";
                }}
              >
                View Cart
                <FaArrowRight />
              </button>
            </div>
          </motion.div>

          {/* SEARCH / FILTER */}
          <div className="customer-products-toolbar">
            <div className="customer-products-search">
              <FaSearch />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ice creams, desserts..."
              />

              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="customer-products-filter-wrapper">
              <button
                type="button"
                className="customer-products-category-button"
                onClick={() => setShowCategoryMenu((previous) => !previous)}
              >
                <span>{selectedCategoryName}</span>
                <FaChevronDown className={showCategoryMenu ? "rotated" : ""} />
              </button>

              <AnimatePresence>
                {showCategoryMenu && (
                  <motion.div
                    className="customer-products-category-menu"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    <button
                      type="button"
                      className={selectedCategory === "all" ? "selected" : ""}
                      onClick={() => {
                        setSelectedCategory("all");
                        setShowCategoryMenu(false);
                      }}
                    >
                      All Products
                    </button>

                    {categories.map((category) => {
                      const categoryId = category._id || category.id;

                      return (
                        <button
                          type="button"
                          key={categoryId}
                          className={
                            selectedCategory === categoryId ? "selected" : ""
                          }
                          onClick={() => {
                            setSelectedCategory(categoryId);
                            setShowCategoryMenu(false);
                          }}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RESULTS */}
          <div className="customer-products-results-bar">
            <div>
              <strong>{selectedCategoryName}</strong>

              <span>
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </span>
            </div>
          </div>

          {/* PRODUCTS */}
          {loading ? (
            <div className="customer-products-loading">
              <FaSpinner className="customer-products-spinner" />
              <span>Loading delicious treats...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="customer-products-empty">
              <div className="customer-products-empty-icon">
                <FaIceCream />
              </div>

              <h2>No products found</h2>

              <p>
                {search
                  ? "Try searching for something else."
                  : "There are currently no products available."}
              </p>

              {search && (
                <button type="button" onClick={clearSearch}>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="customer-products-grid">
              {filteredProducts.map((product, index) => {
                const quantity = getProductQuantity(product._id);

                return (
                  <motion.article
                    key={product._id}
                    className="customer-product-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.04,
                    }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="customer-product-image">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";

                            event.currentTarget.parentElement.classList.add(
                              "image-fallback",
                            );
                          }}
                        />
                      ) : null}

                      <div className="customer-product-image-fallback">
                        <FaIceCream />
                      </div>

                      <span className="customer-product-category">
                        {getCategoryName(product)}
                      </span>

                      {quantity > 0 && (
                        <span className="customer-product-quantity">
                          {quantity} in cart
                        </span>
                      )}
                    </div>

                    <div className="customer-product-info">
                      <span className="customer-product-sku">
                        {product.sku || "ICE-CREAM"}
                      </span>

                      <h3>{product.name}</h3>

                      <p>
                        {product.description ||
                          "A delicious treat made with premium ingredients."}
                      </p>

                      <div className="customer-product-footer">
                        <div className="customer-product-price">
                          <span>Price</span>
                          <strong>
                            ₹{Number(product.price || 0).toFixed(2)}
                          </strong>
                        </div>

                        <button
                          type="button"
                          className={
                            addedProduct === product._id ? "added" : ""
                          }
                          onClick={() => addToCart(product)}
                        >
                          {addedProduct === product._id ? (
                            <>
                              <FaCheck />
                              Added
                            </>
                          ) : (
                            <>
                              <FaCartPlus />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}

          {/* BOTTOM CART BAR */}
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.div
                className="customer-products-floating-cart"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
              >
                <div className="customer-products-floating-cart-icon">
                  <FaShoppingBag />
                  <span>{cartCount}</span>
                </div>

                <div className="customer-products-floating-cart-info">
                  <strong>Your Cart</strong>
                  <span>
                    {cartCount} {cartCount === 1 ? "item" : "items"}
                  </span>
                </div>

                <strong className="customer-products-floating-total">
                  ₹{cartTotal.toFixed(2)}
                </strong>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/customer/cart";
                  }}
                >
                  Go to Cart
                  <FaArrowRight />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

export default CustomerProducts;
