import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Users,
  UserPlus,
  BarChart3,
  Shield,
  X,
  Power,
  RefreshCcw,
  CheckCircle,
  AlertCircle,
  Settings, // Import Settings Icon
  ArrowLeft // Import Arrow for back button
} from "lucide-react";
import baseURL from "../lib/config";
import Header from "./Header";

// ✅ 1. Import your new Settings Component
import OrganizationSettings from "./OrganizationSettings";

export default function StoreOwner() {
  const [organizationName, setOrganizationName] = useState("Your Organization");
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals State
  const [showManageModal, setShowManageModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // ✅ 2. New State for toggling Settings View
  const [showSettings, setShowSettings] = useState(false);

  // Add Worker Form State
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

  useEffect(() => {
    const name = localStorage.getItem("organizationName");
    if (name) setOrganizationName(name);
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) {
        setError("Authentication token missing. Please log in again.");
        setLoading(false);
        return;
      }
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

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      await axios.post(`${baseURL}/workers`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMsg(`Successfully registered ${formData.first_name} as a ${formData.role}.`);
      setFormData({ first_name: "", last_name: "", email: "", phone: "", password: "", role: "cashier" });
      setShowAddModal(false);
      if (showManageModal) fetchWorkers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add worker.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeactivate = async (userId: number) => {
    if (!window.confirm("Are you sure? User will lose access.")) return;
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      await axios.delete(`${baseURL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWorkers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to deactivate user.");
    }
  };

  const handleReactivate = async (userId: number) => {
    if (!window.confirm("Are you sure? User will regain access.")) return;
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      await axios.patch(`${baseURL}/users/${userId}/reactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWorkers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to reactivate user.");
    }
  };

  // ✅ 3. Conditional Rendering: If Settings is active, show it instead of dashboard
  if (showSettings) {
    return (
      <div className="relative">
        {/* Floating Back Button to return to Dashboard */}
        <button 
          onClick={() => setShowSettings(false)}
          className="fixed bottom-6 left-6 z-50 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-gray-700 transition-all"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        
        {/* Render the imported Settings Component */}
        <OrganizationSettings />
      </div>
    );
  }

  // --- STANDARD DASHBOARD VIEW ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Header />

      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-grow">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Store Owner Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Managing <span className="font-semibold text-indigo-600">{organizationName}</span>
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* Card 1: Manage Staff */}
          <div
            onClick={() => { setShowManageModal(true); fetchWorkers(); }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-center space-x-4 group"
          >
            <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Manage Staff</h3>
              <p className="text-sm text-gray-500">View & Edit Employees</p>
            </div>
          </div>

          {/* Card 2: Add Worker */}
          <div 
             onClick={() => setShowAddModal(true)}
             className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-center space-x-4 group"
          >
            <div className="bg-green-100 p-3 rounded-full text-green-600 group-hover:scale-110 transition-transform">
              <UserPlus size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Add Worker</h3>
              <p className="text-sm text-gray-500">Register new staff</p>
            </div>
          </div>

          {/* Card 3: Settings (NEW) - Triggers the View Switch */}
          <div 
            onClick={() => setShowSettings(true)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-center space-x-4 group"
          >
            <div className="bg-purple-100 p-3 rounded-full text-purple-600 group-hover:scale-110 transition-transform">
              <Settings size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Settings</h3>
              <p className="text-sm text-gray-500">Branding, Tags, Payments</p>
            </div>
          </div>

          {/* Card 4: Audit Logs */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-center space-x-4 group">
            <div className="bg-orange-100 p-3 rounded-full text-orange-600 group-hover:scale-110 transition-transform">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Audit Logs</h3>
              <p className="text-sm text-gray-500">Track system changes</p>
            </div>
          </div>
        </div>

        {/* ======================= */}
        {/* MODAL: Add New Worker   */}
        {/* ======================= */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <UserPlus size={20} className="text-green-600" />
                  Add New Worker
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddWorker} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input required type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input required type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input required type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input required type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                      <option value="cashier">Cashier</option>
                      <option value="store_manager">Store Manager</option>
                      <option value="driver">Driver</option>
                      <option value="operator">Operator</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={addLoading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex justify-center items-center gap-2">
                    {addLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Worker"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================= */}
        {/* MODAL: Manage Staff     */}
        {/* ======================= */}
        {showManageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Users size={20} className="text-indigo-600" />
                  Staff Management
                </h2>
                <div className="flex gap-2">
                   <button onClick={() => { setShowManageModal(false); setShowAddModal(true); }} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 flex items-center gap-1">
                     <UserPlus size={16} /> Add New
                   </button>
                   <button onClick={() => setShowManageModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                ) : workers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No workers found.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
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
                          <tr key={worker.id} className={`hover:bg-gray-50 ${worker.is_deactivated ? 'bg-gray-50' : ''}`}>
                            <td className={`px-4 py-3 text-sm font-medium ${worker.is_deactivated ? 'text-gray-400' : 'text-gray-900'}`}>{worker.first_name} {worker.last_name}</td>
                            <td className={`px-4 py-3 text-sm ${worker.is_deactivated ? 'text-gray-400' : 'text-gray-500'}`}>{worker.email}</td>
                            <td className="px-4 py-3 text-sm capitalize"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">{worker.role.replace('_', ' ')}</span></td>
                            <td className="px-4 py-3 text-center">
                              {worker.is_deactivated ? <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-semibold">Inactive</span> : <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-semibold">Active</span>}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {worker.is_deactivated ? (
                                <button onClick={() => handleReactivate(worker.id)} className="text-green-600 hover:bg-green-50 p-2 rounded-lg" title="Reactivate"><RefreshCcw size={18} /></button>
                              ) : (
                                <button onClick={() => handleDeactivate(worker.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg" title="Deactivate"><Power size={18} /></button>
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
        {error && <div className="fixed bottom-4 right-4 bg-red-50 text-red-700 px-6 py-4 rounded-xl shadow-lg border border-red-100 flex items-center gap-2 animate-slide-in z-50"><AlertCircle size={20} /><span>{error}</span><X size={16} className="cursor-pointer ml-2" onClick={() => setError(null)} /></div>}
        {successMsg && <div className="fixed bottom-4 right-4 bg-green-50 text-green-700 px-6 py-4 rounded-xl shadow-lg border border-green-100 flex items-center gap-2 animate-slide-in z-50"><CheckCircle size={20} /><span>{successMsg}</span><X size={16} className="cursor-pointer ml-2" onClick={() => setSuccessMsg(null)} /></div>}

      </div>
    </div>
  );
}