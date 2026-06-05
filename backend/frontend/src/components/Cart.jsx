const Cart = ({ cartItems, removeFromCart }) => {
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart">
      <h2>🛒 Cart</h2>

      {cartItems.length === 0 ? (
        <p>No Items Added</p>
      ) : (
        <>
          {cartItems.map((item, index) => (
            <div
              className="cart-item"
              key={index}
            >
              <div>
                <h4>{item.name}</h4>
                <p>
                  ₹{item.price} × {item.quantity}
                </p>
              </div>

              <button
                className="btn"
                onClick={() => removeFromCart(item._id)}
              >
                Remove
              </button>
            </div>
          ))}

          <hr />

          <h3>Total: ₹{total}</h3>
        </>
      )}
    </div>
  );
};

export default Cart;