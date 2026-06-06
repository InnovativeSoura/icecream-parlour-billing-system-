import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import BillingToC from "./pages/BillingToC";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";

function App() {
  return <Auth />;
}

export default App;