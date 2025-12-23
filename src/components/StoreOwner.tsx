import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  // Layout Icons
  LayoutDashboard,
  Menu,
  X,
  LogOut,

  // Operational Icons (Cashier Features)
  Package, // Drop Off
  Clock,   // Pick Up
  Ticket as TicketIcon, // Tickets
  Users,   // Customers
  MapPin,  // Racks
  Shirt,   // Clothing
  Activity, // Status
  Tag,     // Tags
  BookUser, // Directory

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
  ArrowLeft // Added ArrowLeft for Back Button
} from "lucide-react";

import baseURL from "../lib/config";
import Header from "./Header";

// --- Import Components (Cashier Features) ---
import DropOff from './DropOff';
import PickUp from './PickUp';
import TicketManagement from './TicketManagement';
import CustomerManagement from './CustomerManagement';
import RackManagement from './RackManagement';
import ClothingManagement from './ClothingManagement';
import StatusManagement from './StatusManagement';
import TagManagement from './Tag'; // Assuming exported as TagManagement or default
import CustomerDirectory from './CustomerDirectory';
import DashboardAnalytics from './DashboardAnalytics'; // <--- ADD THIS IMPORT

// --- Import Components (Owner Features) ---
import OrganizationSettings from "./OrganizationSettings";

export default function StoreOwner() {
  // --- Navigation State ---
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // --- Owner Data State ---
  const [organizationName, setOrganizationName] = useState("Your Organization");
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- Modals State (Staff Management) ---
  const [showManageModal, setShowManageModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // --- Add Worker Form State ---
  const [addLoading, setAddLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    role: "cashier"
  });

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

  // --- API: Fetch Workers ---
  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${baseURL}/workers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(response.data)) {
        setWorkers(response.data);
      } else {
        setWorkers([]);
      }
    } catch (err: any) {
      console.error("Error fetching workers:", err);
      setError(err.response?.data?.detail || "Failed to fetch workers.");
    } finally {
      setLoading(false);
    }
  };

  // --- API: Add Worker ---
  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      await axios.post(`${baseURL}/register/staff`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMsg(`Successfully registered ${formData.first_name}.`);
      setFormData({ first_name: "", last_name: "", email: "", phone: "", password: "", role: "cashier" });
      setShowAddModal(false);
      if (showManageModal) fetchWorkers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add worker.");
    } finally {
      setAddLoading(false); 
    }
  };

  // --- API: Worker Actions ---
  const handleDeactivate = async (userId: number) => {
    if (!window.confirm("Are you sure? User will lose access.")) return;
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      await axios.delete(`${baseURL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWorkers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to deactivate.");
    }
  };

  const handleReactivate = async (userId: number) => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      await axios.patch(`${baseURL}/users/${userId}/reactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWorkers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to reactivate.");
    }
  };

  // --- MENU ITEMS CONFIGURATION ---
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Main' },
    { id: 'dropoff', label: 'Drop Off', icon: Package, category: 'Operations' },
    { id: 'pickup', label: 'Pick Up', icon: Clock, category: 'Operations' },
    { id: 'tickets', label: 'Tickets', icon: TicketIcon, category: 'Operations' },
    { id: 'customers', label: 'Customers', icon: Users, category: 'Operations' },
    { id: 'racks', label: 'Racks', icon: MapPin, category: 'Management' },
    { id: 'clothing', label: 'Clothing', icon: Shirt, category: 'Management' },
    { id: 'status', label: 'Status', icon: Activity, category: 'Management' },
    { id: 'tags', label: 'Tags', icon: Tag, category: 'Management' },
    // { id: 'directory', label: 'Directory', icon: BookUser, category: 'Management' },
    { id: 'settings', label: 'Settings', icon: Settings, category: 'System' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'Main' },
  ];

  // --- RENDER CONTENT ---
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Main App Header on First View */}
            {/* Added mt-4 to prevent overlap with the dashboard sticky header */}
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

              {/* Manage Staff Card */}
              <div
                onClick={() => { setShowManageModal(true); fetchWorkers(); }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 group"
              >
                <div className="flex justify-between items-start">
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-800 text-lg">Manage Staff</h3>
                  <p className="text-sm text-gray-500 mt-1">View, Edit & Deactivate</p>
                </div>
              </div>

              {/* Add Worker Card */}
              <div
                onClick={() => setShowAddModal(true)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 group"
              >
                <div className="flex justify-between items-start">
                  <div className="bg-green-100 p-3 rounded-xl text-green-600 group-hover:scale-110 transition-transform">
                    <UserPlus size={24} />
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:text-green-600 transition-colors" />
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-800 text-lg">Add Worker</h3>
                  <p className="text-sm text-gray-500 mt-1">Register new employee</p>
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

              {/* Reports Placeholder */}
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

            {/* Additional Dashboard Content can go here */}
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Recent System Activity</h3>
              <div className="text-gray-400 text-sm italic py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Audit logs and recent activities will appear here.
              </div>
            </div>
          </div>
        );
      case 'dropoff': return <DropOff />;
      case 'pickup': return <PickUp />;
      case 'tickets': return <TicketManagement />;
      case 'customers': return <CustomerManagement />;
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
            // Group separators
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

            {/* BACK TO DASHBOARD BUTTON */}
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

      {/* ========================================= */}
      {/* MODALS (Kept from original StoreOwner)    */}
      {/* ========================================= */}

      {/* 1. ADD WORKER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserPlus size={20} className="text-green-600" /> Add Worker
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddWorker} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input required type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input required type="password" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    <option value="cashier">Cashier</option>
                    <option value="store_manager">Manager</option>
                    <option value="driver">Driver</option>
                    <option value="operator">Operator</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={addLoading} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  {addLoading ? "Creating..." : "Create Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MANAGE STAFF MODAL */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-xl flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users size={20} className="text-indigo-600" /> Staff Management
              </h3>
              <div className="flex gap-2">
                <button onClick={() => { setShowManageModal(false); setShowAddModal(true); }} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200">
                  + Add New
                </button>
                <button onClick={() => setShowManageModal(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="text-center py-10 text-gray-500">Loading staff...</div>
              ) : workers.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No workers found.</div>
              ) : (
                <div className="overflow-hidden border rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workers.map((worker) => (
                        <tr key={worker.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{worker.first_name} {worker.last_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{worker.email}</td>
                          <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs uppercase font-semibold">{worker.role}</span></td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${worker.is_deactivated ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {worker.is_deactivated ? 'Inactive' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {worker.is_deactivated ? (
                              <button onClick={() => handleReactivate(worker.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded" title="Reactivate"><RefreshCcw size={18} /></button>
                            ) : (
                              <button onClick={() => handleDeactivate(worker.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded" title="Deactivate"><Power size={18} /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Notifications */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 text-red-700 px-6 py-4 rounded-xl shadow-lg border border-red-100 flex items-center gap-2 animate-in slide-in-from-bottom-5 z-50">
          <AlertCircle size={20} /> <span>{error}</span> <X size={16} className="cursor-pointer ml-2" onClick={() => setError(null)} />
        </div>
      )}
      {successMsg && (
        <div className="fixed bottom-4 right-4 bg-green-50 text-green-700 px-6 py-4 rounded-xl shadow-lg border border-green-100 flex items-center gap-2 animate-in slide-in-from-bottom-5 z-50">
          <CheckCircle size={20} /> <span>{successMsg}</span> <X size={16} className="cursor-pointer ml-2" onClick={() => setSuccessMsg(null)} />
        </div>
      )}

    </div>
  );
}