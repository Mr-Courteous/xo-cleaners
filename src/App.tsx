import React, { useState, useEffect } from "react";
import Layout from "./components/Layout";
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
import { getToken, removeToken } from "./utils/authUtils";
import UsersManagement from "./components/UsersManagement";
import ReceiptConfig from "./components/ReceiptConfig";

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleUnauthorized = () => {
      // Prevent multiple rapid triggers
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        removeToken();
        setIsLoggedIn(false);
        setCurrentView("dashboard");
      }, 50);
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("unauthorized", handleUnauthorized);
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setCurrentView("dashboard");
  };

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "dropoff":
        return <DropOff />;
      case "pickup":
        return <PickUp />;
      case "tickets":
        return <TicketManagement />;
      case "status":
        return <StatusManagement />;
      case "customers":
        return <CustomerManagement />;
      case "racks":
        return <RackManagement />;
      case "clothing":
        return <ClothingManagement />;
      case "tags":
        return <Tag />;
      case "users":
        return <UsersManagement />;
      case "receipt-config":
        return <ReceiptConfig />;
      default:
        return <Dashboard />;
    }
  };

  // 🚨 Instantly render login if not logged in
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={handleLogout}
    >
      {renderView()}
    </Layout>
  );
}

export default App;
