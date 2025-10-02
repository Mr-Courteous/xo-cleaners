import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DropOff from './components/DropOff'; 
import PickUp from './components/PickUp';
import TicketManagement from './components/TicketManagement';
import StatusManagement from './components/StatusManagement';
import CustomerManagement from './components/CustomerManagement';
import RackManagement from './components/RackManagement';
import ClothingManagement from './components/ClothingManagement';
import Tag from './components/Tag';
import Login from './components/Login';
import { getToken, removeToken } from './utils/authUtils';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());

  // 🔥 Listen for unauthorized events triggered by apiCall/useApi
  useEffect(() => {
    const handleUnauthorized = () => {
      removeToken();
      setIsLoggedIn(false);
      setCurrentView('dashboard');
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, []);

  // Called when login succeeds
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  // Handle manual logout
  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'dropoff':
        return <DropOff />;
      case 'pickup':
        return <PickUp />;
      case 'tickets':
        return <TicketManagement />;
      case 'status':
        return <StatusManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'racks':
        return <RackManagement />;
      case 'clothing':
        return <ClothingManagement />;
      case 'tags':
        return <Tag />;
      default:
        return <Dashboard />;
    }
  };

  // 🚨 If not logged in, always render Login
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // ✅ If logged in, show dashboard layout
  return (
    <Layout currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogout}>
      {renderView()}
    </Layout>
  );
}

export default App;
