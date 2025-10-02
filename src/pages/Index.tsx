import React, { useState } from 'react';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import DropOff from '../components/DropOff';
import PickUp from '../components/PickUp';
import TicketManagement from '../components/TicketManagement';
import StatusManagement from '../components/StatusManagement';
import CustomerManagement from '../components/CustomerManagement';
import RackManagement from '../components/RackManagement';
import ClothingManagement from '../components/ClothingManagement';
import Tag from '../components/Tag';

function Index() {
  const [currentView, setCurrentView] = useState('dashboard');

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

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default Index;