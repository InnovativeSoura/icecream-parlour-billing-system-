import { useAuth } from "../context/AuthContext";

const CustomerDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <main style={{ padding: "40px" }}>
      <h1>Customer Dashboard</h1>

      <p>
        Welcome, <strong>{user?.name}</strong>
      </p>

      <p>Role: {user?.role}</p>

      <button onClick={logout}>
        Logout
      </button>
    </main>
  );
};

export default CustomerDashboard;