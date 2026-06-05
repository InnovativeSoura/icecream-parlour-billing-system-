const ProductCard = ({ product, addToCart }) => {
  return (
    <div className="product-card">
      <img
        src={
          product.image ||
          "https://images.unsplash.com/photo-1563805042-7684c019e1cb"
        }
        alt={product.name}
      />

      <div className="product-info">
        <h3>{product.name}</h3>

        <p>
          <strong>Category:</strong> {product.category}
        </p>

        <p className="price">₹{product.price}</p>

        <button
          className="btn"
          onClick={() => addToCart(product)}
        >
          Add To Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;