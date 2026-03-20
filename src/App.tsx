import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { SidebarProvider } from "./state/SidebarContext";

// Removed: import Layout from "./components/Layout"; 
import MainLayout from "./components/MainLayout";
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
import OrganizationSettings from "./components/OrganizationSettings";
import CustomerDashboard from "./components/CustomerDashboard";

import CustomerLogin from "./components/CustomerLogin";
import NotFound from "./components/NotFound";
import DashboardAnalytics from "./components/DashboardAnalytics";
import BatchTransfer from "./components/BatchTransfer";
import TicketTransfersProcess from "./components/TicketTransfersProcess";
import WorkerManagement from "./components/WorkerManagement";


// import CustomerDirectory from "./components/customerDirectory";
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

      {/* 🟢 Protected routes with MainLayout (Sidebar + Header) */}

      <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
      <Route path="/dropoff" element={<MainLayout><DropOff /></MainLayout>} />
      <Route path="/pickup" element={<MainLayout><PickUp /></MainLayout>} />
      <Route path="/tickets" element={<MainLayout><TicketManagement /></MainLayout>} />
      <Route path="/status" element={<MainLayout><StatusManagement /></MainLayout>} />
      <Route path="/customers" element={<MainLayout><CustomerManagement /></MainLayout>} />
      <Route path="/racks" element={<MainLayout><RackManagement /></MainLayout>} />
      <Route path="/clothing" element={<MainLayout><ClothingManagement /></MainLayout>} />
      <Route path="/tags" element={<MainLayout><Tag /></MainLayout>} />
      <Route path="/users" element={<MainLayout><UsersManagement /></MainLayout>} />
      <Route path="/receipt-config" element={<MainLayout><ReceiptConfig /></MainLayout>} />
      <Route path="/analytics" element={<MainLayout><DashboardAnalytics /></MainLayout>} />
      <Route path="/batchtransfer" element={<MainLayout><BatchTransfer /></MainLayout>} />
      <Route path="/transfers" element={<MainLayout><TicketTransfersProcess /></MainLayout>} />
      <Route path="/staff" element={<MainLayout><WorkerManagement /></MainLayout>} />
      <Route path="/add-worker" element={<MainLayout><AddWorker /></MainLayout>} />
      <Route path="/cashier" element={<MainLayout><Cashier /></MainLayout>} />
      <Route path="/org-settings" element={<MainLayout><OrganizationSettings /></MainLayout>} />

      
      {/* Public/Login Routes (no sidebar) */}
      <Route path="/store-owner-login" element={<Login />} />
      <Route path="/platform-admin-login" element={<PlatformAdmin />} />
      <Route path="/store-admin" element={<StoreAdmin />} />
      <Route path="/org" element={<StoreOwner />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/store-worker-login" element={<WorkersLogin />} />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/customer-login" element={<CustomerLogin />} />
      {/* <Route path="/cashier-associate" element={<CashierAssociate />} /> */}
      <Route path="/NotFound" element={<NotFound />} />





      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/NotFound" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    </Router>
  );
}