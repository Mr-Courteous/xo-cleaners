import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Power,
  RefreshCcw,
  Shield,
  Loader2,
  Mail,
  Phone
} from "lucide-react";
import baseURL from "../lib/config"; // Ensure this path is correct for your project

// --- Types ---
interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  is_deactivated: boolean;
  joined_at: string;
}

interface WorkerFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  password?: string; // Only needed for creation
}

export default function WorkerManagement() {
  // --- State ---
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  
  // Feedback State
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Data
  const initialFormState: WorkerFormData = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "cashier",
    password: ""
  };
  const [formData, setFormData] = useState<WorkerFormData>(initialFormState);

  // --- Initial Load ---
  useEffect(() => {
    fetchWorkers();
  }, []);

  // --- Filtering Logic ---
  useEffect(() => {
    if (!searchQuery) {
      setFilteredWorkers(workers);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = workers.filter(
        (worker) =>
          worker.first_name.toLowerCase().includes(lowerQuery) ||
          worker.last_name.toLowerCase().includes(lowerQuery) ||
          worker.email.toLowerCase().includes(lowerQuery) ||
          worker.role.toLowerCase().includes(lowerQuery)
      );
      setFilteredWorkers(filtered);
    }
  }, [searchQuery, workers]);

  // --- API Functions ---

  const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${baseURL}/workers`, getAuthHeader());
      if (Array.isArray(response.data)) {
        setWorkers(response.data);
        setFilteredWorkers(response.data);
      } else {
        setWorkers([]);
      }
    } catch (err: any) {
      console.error("Error fetching workers:", err);
      setError("Failed to load worker list.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      if (modalMode === "create") {
        // --- CREATE WORKER (POST) ---
        await axios.post(`${baseURL}/register/staff`, formData, getAuthHeader());
        setSuccess(`Successfully added ${formData.first_name} ${formData.last_name}`);
      } else if (modalMode === "edit" && selectedWorker) {
        // --- EDIT WORKER (PUT) ---
        // Construct payload with only necessary fields
        const updatePayload = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        };

        await axios.put(`${baseURL}/workers/${selectedWorker.id}`, updatePayload, getAuthHeader());
        setSuccess(`Successfully updated ${formData.first_name}`);
      }

      closeModal();
      fetchWorkers();
    } catch (err: any) {
      console.error("Operation failed:", err);
      setError(err.response?.data?.detail || "Operation failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (worker: Worker) => {
    if (!window.confirm(`Are you sure you want to deactivate ${worker.first_name}? They will lose access immediately.`)) return;
    
    setActionLoading(true);
    try {
      await axios.delete(`${baseURL}/users/${worker.id}`, getAuthHeader());
      setSuccess(`${worker.first_name} has been deactivated.`);
      fetchWorkers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to deactivate worker.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (worker: Worker) => {
    setActionLoading(true);
    try {
      await axios.patch(`${baseURL}/users/${worker.id}/reactivate`, {}, getAuthHeader());
      setSuccess(`${worker.first_name} has been reactivated.`);
      fetchWorkers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reactivate worker.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- Helper Functions ---

  const openCreateModal = () => {
    setModalMode("create");
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (worker: Worker) => {
    setModalMode("edit");
    setSelectedWorker(worker);
    setFormData({
      first_name: worker.first_name,
      last_name: worker.last_name,
      email: worker.email,
      phone: worker.phone || "",
      role: worker.role,
      password: "" // Password is not editable here for security
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedWorker(null);
    setFormData(initialFormState);
    setError(null);
  };

  // --- Render ---

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-indigo-600" /> Worker Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage employees, roles, and system access.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95 font-medium"
        >
          <Plus size={20} /> Add New Worker
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Active: {workers.filter(w => !w.is_deactivated).length}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Inactive: {workers.filter(w => w.is_deactivated).length}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span> Total: {workers.length}
          </div>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mb-3" size={32} />
            <p>Loading worker data...</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No workers found.</p>
            <p className="text-sm">Try adjusting your search or add a new worker.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          {worker.first_name[0]}{worker.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{worker.first_name} {worker.last_name}</p>
                          <p className="text-xs text-gray-400">ID: #{worker.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm text-gray-500">
                        <div className="flex items-center gap-2"><Mail size={14} /> {worker.email}</div>
                        {worker.phone && <div className="flex items-center gap-2"><Phone size={14} /> {worker.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide border
                        ${worker.role === 'org_owner' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                          worker.role === 'store_manager' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-gray-100 text-gray-600 border-gray-200'}
                      `}>
                        {worker.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${worker.is_deactivated 
                          ? 'bg-red-50 text-red-700 border border-red-100' 
                          : 'bg-green-50 text-green-700 border border-green-100'}
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${worker.is_deactivated ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        {worker.is_deactivated ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(worker)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 size={18} />
                        </button>
                        
                        {worker.is_deactivated ? (
                          <button 
                            onClick={() => handleReactivate(worker)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Reactivate Account"
                          >
                            <RefreshCcw size={18} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleDeactivate(worker)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deactivate Account"
                          >
                            <Power size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- CREATE / EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {modalMode === 'create' ? <Users className="text-green-600" size={20} /> : <Edit2 className="text-indigo-600" size={20} />}
                {modalMode === 'create' ? "Add New Worker" : "Edit Worker Details"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto">
              <form id="workerForm" onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="e.g. John"
                      value={formData.first_name} 
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="e.g. Doe"
                      value={formData.last_name} 
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="email" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="john@example.com"
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  />
                  {/* {modalMode === 'edit' && <p className="text-xs text-gray-500 mt-1">Changing this may require re-verification depending on your settings.</p>} */}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <select 
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none"
                        value={formData.role} 
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="cashier">Cashier</option>
                        <option value="store_manager">Manager</option>
                        <option value="driver">Driver</option>
                        <option value="operator">Operator</option>
                      </select>
                    </div>
                  </div>
                  
                  {modalMode === 'create' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                      <input 
                        required 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="••••••••"
                        value={formData.password} 
                        onChange={e => setFormData({ ...formData, password: e.target.value })} 
                      />
                    </div>
                  )}
                </div>
                
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button 
                onClick={closeModal} 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white hover:border-gray-400 transition-all font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="workerForm"
                disabled={actionLoading}
                className={`
                  flex-1 px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-all flex justify-center items-center gap-2
                  ${modalMode === 'create' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}
                  ${actionLoading ? 'opacity-70 cursor-not-allowed' : ''}
                `}
              >
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : null}
                {modalMode === 'create' ? "Create Worker" : "Save Changes"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {success && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-[100]">
          <CheckCircle size={20} />
          <span className="font-medium">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-2 hover:bg-white/20 p-1 rounded-full"><X size={16} /></button>
        </div>
      )}

    </div>
  );
}