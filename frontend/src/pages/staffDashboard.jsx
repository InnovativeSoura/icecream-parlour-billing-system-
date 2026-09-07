import { useAuth } from "../context/AuthContext";

const StaffDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <main style={{ padding: "40px" }}>
      <h1>Staff Dashboard</h1>

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

export default StaffDashboard;