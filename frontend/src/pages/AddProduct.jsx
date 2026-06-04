const Orders = () => {
  const orders = [
    {
      id: 1001,
      customer: "Rahul",
      amount: 250,
      date: "03-06-2026",
    },
    {
      id: 1002,
      customer: "Priya",
      amount: 180,
      date: "03-06-2026",
    },
    {
      id: 1003,
      customer: "Amit",
      amount: 320,
      date: "04-06-2026",
    },
  ];

  return (
    <div className="table-container">
      <h1>📦 Orders</h1>

      <br />

      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer}</td>
              <td>₹{order.amount}</td>
              <td>{order.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Orders;