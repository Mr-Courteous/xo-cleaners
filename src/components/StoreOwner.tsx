import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// --- 1. Add Briefcase to imports for the sidebar icon ---
import {
  // Layout Icons
  LayoutDashboard,
  Menu,
  X,
  LogOut,

  // Operational Icons
  Package, 
  Clock,   
  Ticket as TicketIcon, 
  Users,   
  MapPin,  
  Shirt,   
  Activity, 
  Tag,     
  BookUser, 

  // Owner Specific Icons
  UserPlus,
  Shield,
  Power,
  RefreshCcw,
  CheckCircle,
  AlertCircle,
  Settings,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Briefcase // <--- NEW ICON for Staff
} from "lucide-react";

import baseURL from "../lib/config";
import Header from "./Header";

// --- Import Components ---
import DropOff from './DropOff';
import PickUp from './PickUp';
import TicketManagement from './TicketManagement';
import CustomerManagement from './CustomerManagement';
import RackManagement from './RackManagement';
import ClothingManagement from './ClothingManagement';
import StatusManagement from './StatusManagement';
import TagManagement from './Tag'; 
import CustomerDirectory from './CustomerDirectory';
import DashboardAnalytics from './DashboardAnalytics'; 
import OrganizationSettings from "./OrganizationSettings";

// --- 2. Import the new WorkerManagement Component ---
import WorkerManagement from "./WorkerManagement"; 
// --- 3. Import the AuditLogTable Component (ADDED) ---
import AuditLogTable from "./AuditLogTable";

export default function StoreOwner() {
  // --- Navigation State ---
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // --- Owner Data State ---
  const [organizationName, setOrganizationName] = useState("Your Organization");

  // (Removed old worker states: workers, loading, showManageModal, formData, etc.)
  // (Removed old API functions: fetchWorkers, handleAddWorker, handleDeactivate, etc.)

  const navigate = useNavigate();

  // Handle Resize for Sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const name = localStorage.getItem("organizationName");
    if (name) setOrganizationName(name);
  }, []);

  // --- 3. Update MENU ITEMS ---
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Main' },
    
    // Operations
    { id: 'dropoff', label: 'Drop Off', icon: Package, category: 'Operations' },
    { id: 'pickup', label: 'Pick Up', icon: Clock, category: 'Operations' },
    { id: 'tickets', label: 'Tickets', icon: TicketIcon, category: 'Operations' },
    { id: 'customers', label: 'Customers', icon: Users, category: 'Operations' },
    
    // Management
    { id: 'staff', label: 'Staff', icon: Briefcase, category: 'Management' }, // <--- NEW MENU ITEM
    { id: 'racks', label: 'Racks', icon: MapPin, category: 'Management' },
    { id: 'clothing', label: 'Clothing', icon: Shirt, category: 'Management' },
    { id: 'status', label: 'Status', icon: Activity, category: 'Management' },
    { id: 'tags', label: 'Tags', icon: Tag, category: 'Management' },
    
    // System
    { id: 'settings', label: 'Settings', icon: Settings, category: 'System' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'System' },
  ];

  // --- 4. Update RENDER CONTENT ---
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="mb-6 -mx-6 mt-4">
              <Header />
            </div>

            <div className="flex justify-between items-end mb-4 px-1">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Owner Dashboard</h1>
                <p className="text-gray-500 mt-1">Overview for <span className="font-semibold text-indigo-600">{organizationName}</span></p>
              </div>
              <div className="text-sm text-gray-400">{new Date().toLocaleDateString()}</div>
            </div>

            {/* QUICK STATS / ACTION CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Manage Staff Card - NOW LINKS TO STAFF VIEW */}
              <div
                onClick={() => setActiveView('staff')} // <--- Updated to switch view
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 group"
              >
                <div className="flex justify-between items-start">
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                    <Briefcase size={24} />
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-800 text-lg">Manage Staff</h3>
                  <p className="text-sm text-gray-500 mt-1">View, Edit & Deactivate</p>
                </div>
              </div>

              {/* Settings Shortcut */}
              <div
                onClick={() => setActiveView('settings')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 group"
              >
                <div className="flex justify-between items-start">
                  <div className="bg-purple-100 p-3 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                    <Settings size={24} />
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:text-purple-600 transition-colors" />
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-800 text-lg">System Settings</h3>
                  <p className="text-sm text-gray-500 mt-1">Branding, Tags, Payments</p>
                </div>
              </div>

              {/* Analytics Shortcut */}
              <div
                onClick={() => setActiveView('analytics')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 group"
              >
                <div className="flex justify-between items-start">
                  <div className="bg-orange-100 p-3 rounded-xl text-orange-600 group-hover:scale-110 transition-transform">
                    <BarChart3 size={24} />
                  </div>
                  <ArrowRight size={20} className="text-gray-300" />
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-800 text-lg">Analytics</h3>
                  <p className="text-sm text-gray-500 mt-1">Sales & Performance</p>
                </div>
              </div>
            </div>

            {/* --- ADDED: AUDIT LOG TABLE BELOW CARDS --- */}
            <div className="mt-8">
              <AuditLogTable />
            </div>

          </div>
        );
      case 'dropoff': return <DropOff />;
      case 'pickup': return <PickUp />;
      case 'tickets': return <TicketManagement />;
      case 'customers': return <CustomerManagement />;
      
      // --- 5. Add Case for Staff ---
      case 'staff': return <WorkerManagement />; // <--- Renders the new component
      
      case 'racks': return <RackManagement />;
      case 'clothing': return <ClothingManagement />;
      case 'status': return <StatusManagement />;
      case 'tags': return <TagManagement />;
      case 'directory': return <CustomerDirectory />;
      case 'settings': return <OrganizationSettings />;
      case 'analytics': return <DashboardAnalytics />;

      default: return <div>View Not Found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'} 
          fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-center border-b border-gray-100 px-4">
          {isSidebarOpen ? (
            <h2 className="text-xl font-bold text-indigo-600 tracking-tight">XO Cleaners</h2>
          ) : (
            <h2 className="text-xl font-bold text-indigo-600">XO</h2>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item, index) => {
            const showCategory = isSidebarOpen && (index === 0 || menuItems[index - 1].category !== item.category);

            return (
              <React.Fragment key={item.id}>
                {showCategory && (
                  <div className="px-3 mt-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {item.category}
                  </div>
                )}
                <button
                  onClick={() => {
                    setActiveView(item.id);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${activeView === item.id
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                  title={!isSidebarOpen ? item.label : ""}
                >
                  <item.icon size={20} className={activeView === item.id ? 'text-indigo-600' : 'text-gray-500'} />
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors
              ${!isSidebarOpen && 'justify-center'}
            `}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0 lg:ml-20'}`}>

        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {activeView !== 'dashboard' && (
              <button
                onClick={() => setActiveView('dashboard')}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
            )}

            <h2 className="text-lg font-semibold text-gray-800 capitalize ml-2">
              {menuItems.find(i => i.id === activeView)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-800">Store Owner</p>
              <p className="text-xs text-gray-500">{organizationName}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
              SO
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 relative">
          {renderContent()}
        </main>
      </div>

      {/* 6. REMOVED OLD MODALS (ADD WORKER / MANAGE STAFF)
         The WorkerManagement component now handles these internally.
      */}

    </div>
  );
}