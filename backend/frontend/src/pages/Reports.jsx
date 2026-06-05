const Reports = () => {
  return (
    <div className="dashboard">
      <h1 className="dashboard-title">
        📊 Sales Reports
      </h1>

      <div className="cards">
        <div className="card">
          <h3>Today's Sales</h3>
          <p>₹12,500</p>
        </div>

        <div className="card">
          <h3>Weekly Sales</h3>
          <p>₹78,000</p>
        </div>

        <div className="card">
          <h3>Monthly Sales</h3>
          <p>₹3,25,000</p>
        </div>

        <div className="card">
          <h3>Top Selling Item</h3>
          <p>Chocolate Cone 🍫</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;