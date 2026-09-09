import {
  FaPlus,
  FaShoppingCart,
  FaTag,
} from "react-icons/fa";

const ProductCard = ({ product, addToCart }) => {
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "Ice Cream";

  const price = Number(product.price || 0);

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img
          src={
            product.image ||
            "https://images.unsplash.com/photo-1563805042-7684c019e1cb"
          }
          alt={product.name}
          className="product-image"
          onError={(event) => {
            event.currentTarget.src =
              "https://images.unsplash.com/photo-1563805042-7684c019e1cb";
          }}
        />

        {!product.isAvailable && (
          <div className="product-unavailable">
            Out of Stock
          </div>
        )}
      </div>

      <div className="product-info">
        <div className="product-category">
          <FaTag />
          <span>{categoryName}</span>
        </div>

        <h3>{product.name}</h3>

        {product.description && (
          <p className="product-description">
            {product.description}
          </p>
        )}

        <div className="product-bottom">
          <div className="product-price">
            <span>₹</span>
            {price.toFixed(2)}
          </div>

          <button
            type="button"
            className="add-cart-btn"
            disabled={!product.isAvailable}
            onClick={() => addToCart(product)}
          >
            {product.isAvailable ? (
              <>
                <FaPlus />
                <FaShoppingCart />
              </>
            ) : (
              "Unavailable"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;