import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

// Removed: import Layout from "./components/Layout"; 
import Dashboard from "./components/Dashboard";
import DropOff from "./components/DropOff";
import PickUp from "./components/PickUp";
import TicketManagement from "./components/TicketManagement";
import StatusManagement from "./components/StatusManagement";
import CustomerManagement from "./components/CustomerManagement";
import RackManagement from "./components/RackManagement";
import ClothingManagement from "./components/ClothingManagement";
import Tag from "./components/Tag";
import Login from "./components/Login";
import HomePage from "./components/Homepage";
import UsersManagement from "./components/UsersManagement";
import ReceiptConfig from "./components/ReceiptConfig";
import PlatformAdmin from "./components/PlatformAdmin";
import StoreAdmin from "./components/StoreAdmin";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";

import { getToken, removeToken } from "./utils/authUtils";
import StoreOwner from "./components/StoreOwner";
import AddWorker from "./components/AddWorker";
import WorkersLogin from "./components/WorkersLogin";
import CashierAssociate from "./components/CashierAssociate";
import Cashier from "./components/Cashier";

// ----------------------
// Protected Route Wrapper (REMOVED)
// ----------------------
// const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
//   const token = getToken();
//   return token ? children : <Navigate to="/" replace />;
// };

function AppContent() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleUnauthorized = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        removeToken();
        setIsLoggedIn(false);
        navigate("/"); // Redirect to home
      }, 50);
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("unauthorized", handleUnauthorized);
    };
  }, [navigate]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <Routes>
      {/* ---------- Public Routes (Home & Login) ---------- */}
      <Route path="/" element={<HomePage onLoginClick={() => navigate("/login")} />} />
      <Route
        path="/login"
        element={
          <Login
            onLoginSuccess={handleLoginSuccess}
            onBackToHome={() => navigate("/")}
          />
        }
      />

      {/* 🟢 All routes are now UNPROTECTED (removed <ProtectedRoute> wrapper) */}

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dropoff" element={<DropOff />} />
      <Route path="/pickup" element={<PickUp />} />
      <Route path="/tickets" element={<TicketManagement />} />
      <Route path="/status" element={<StatusManagement />} />
      <Route path="/customers" element={<CustomerManagement />} />
      <Route path="/racks" element={<RackManagement />} />
      <Route path="/clothing" element={<ClothingManagement />} />
      <Route path="/tags" element={<Tag />} />
      <Route path="/users" element={<UsersManagement />} />
      <Route path="/receipt-config" element={<ReceiptConfig />} />
      <Route path="/store-owner-login" element={<Login />} />

      {/* ✅ PLATFORM ADMIN ROUTE (Now Unprotected) */}
      <Route path="/platform-admin" element={<PlatformAdmin />} />
      <Route path="/store-admin" element={<StoreAdmin />} />
      <Route path="/org" element={<StoreOwner />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/add-worker" element={<AddWorker />} />
      <Route path="/workers-login" element={<WorkersLogin />} />
      <Route path="/cashier" element={<Cashier />} />




      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/store-admin" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}