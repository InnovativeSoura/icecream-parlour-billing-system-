const Bill = ({ cartItems }) => {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  return (
    <div className="bill-container">
      <h2>🍦 Invoice</h2>

      <hr />

      {cartItems.map((item, index) => (
        <div
          key={index}
          className="bill-item"
        >
          <span>
            {item.name} ({item.quantity})
          </span>

          <span>
            ₹{item.price * item.quantity}
          </span>
        </div>
      ))}

      <hr />

      <div className="bill-item">
        <strong>Subtotal</strong>
        <strong>₹{subtotal.toFixed(2)}</strong>
      </div>

      <div className="bill-item">
        <strong>GST (18%)</strong>
        <strong>₹{gst.toFixed(2)}</strong>
      </div>

      <div className="bill-item total">
        <strong>Total</strong>
        <strong>₹{total.toFixed(2)}</strong>
      </div>

      <button
        className="btn"
        onClick={() => window.print()}
      >
        Print Bill
      </button>
    </div>
  );
};

export default Bill;