import {
  FaMinus,
  FaPlus,
  FaTrash,
  FaShoppingCart,
} from "react-icons/fa";

const Cart = ({
  cartItems,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
}) => {
  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="cart">
      <div className="cart-header">
        <div>
          <span className="cart-icon">
            <FaShoppingCart />
          </span>

          <div>
            <h2>Current Order</h2>
            <p>
              {cartItems.length}{" "}
              {cartItems.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <FaShoppingCart />

          <h3>Your cart is empty</h3>

          <p>
            Select an ice cream or add-on to start a new
            order.
          </p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div
                className="cart-item"
                key={item._id}
              >
                <div className="cart-item-info">
                  <h4>{item.name}</h4>

                  <span>
                    {formatCurrency(item.price)} each
                  </span>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button
                      type="button"
                      onClick={() =>
                        decreaseQuantity(item._id)
                      }
                      aria-label="Decrease quantity"
                    >
                      <FaMinus />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() =>
                        increaseQuantity(item._id)
                      }
                      aria-label="Increase quantity"
                    >
                      <FaPlus />
                    </button>
                  </div>

                  <strong>
                    {formatCurrency(
                      Number(item.price || 0) *
                        Number(item.quantity || 0)
                    )}
                  </strong>

                  <button
                    type="button"
                    className="remove-item-btn"
                    onClick={() =>
                      removeFromCart(item._id)
                    }
                    aria-label={`Remove ${item.name}`}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div>
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;