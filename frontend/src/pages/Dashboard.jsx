const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1 className="dashboard-title">
        🍦 Dashboard
      </h1>

      <div className="cards">
        <div className="card">
          <h3>Total Products</h3>
          <p>25</p>
        </div>

        <div className="card">
          <h3>Total Orders</h3>
          <p>120</p>
        </div>

        <div className="card">
          <h3>Today's Revenue</h3>
          <p>₹12,500</p>
        </div>

        <div className="card">
          <h3>Inventory Items</h3>
          <p>60</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;