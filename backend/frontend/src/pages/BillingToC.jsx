import { useState } from "react";
import Cart from "../components/Cart";
import Bill from "../components/Bill";

const BillingToC = () => {
  const [cartItems, setCartItems] = useState([
    {
      _id: 1,
      name: "Chocolate Cone",
      price: 50,
      quantity: 2,
    },
    {
      _id: 2,
      name: "Vanilla Cup",
      price: 40,
      quantity: 1,
    },
  ]);

  const removeFromCart = (id) => {
    setCartItems(
      cartItems.filter(
        (item) => item._id !== id
      )
    );
  };

  return (
    <div className="billing">
      <h1>🍦 Billing Counter</h1>

      <Cart
        cartItems={cartItems}
        removeFromCart={removeFromCart}
      />

      <br />

      <Bill cartItems={cartItems} />
    </div>
  );
};

export default BillingToC;