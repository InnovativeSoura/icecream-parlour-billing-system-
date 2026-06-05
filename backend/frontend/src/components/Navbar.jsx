import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">🍦 IceCream Billing</div>

      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/products">Products</Link>
        <Link to="/billing">Billing</Link>
        <Link to="/orders">Orders</Link>
        <Link to="/reports">Reports</Link>
      </div>
    </nav>
  );
};

export default Navbar;