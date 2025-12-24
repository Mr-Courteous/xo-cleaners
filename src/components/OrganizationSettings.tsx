import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Settings,
  MapPin,
  CreditCard,
  Tag,
  Save,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Database, // New Icon
  UploadCloud // New Icon
} from "lucide-react";
import baseURL from "../lib/config"; 
import Header from "./Header";
import BulkCustomerImport from "./BulkCustomerImport"; // ✅ 1. Import the component

export default function OrganizationSettings() {
  // ================= State Management =================
  const [activeTab, setActiveTab] = useState("branding");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- Branding State ---
  const [branding, setBranding] = useState({
    primary_color: "#000000",
    secondary_color: "#ffffff",
    logo_url: "",
    receipt_header: "",
    receipt_footer: ""
  });

  // --- Branch State ---
  const [branches, setBranches] = useState<any[]>([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: "",
    address: "",
    phone: "",
    timezone: "UTC",
    location_type: "Drop-off", 
    is_plant: false
  });

  // --- ✅ New State for Bulk Import ---
  const [showBulkImport, setShowBulkImport] = useState(false);

  // ================= Effects =================
  useEffect(() => {
    fetchSettings();
    fetchBranches();
  }, []);

  // Auto-hide messages
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  // ================= API Calls =================
  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${baseURL}/api/organizations/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) setBranding(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${baseURL}/api/organizations/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${baseURL}/api/organizations/settings`, branding, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: 'success', text: 'Branding settings saved!' });
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${baseURL}/api/organizations/branches`, newBranch, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: 'success', text: 'Branch created successfully!' });
      setShowBranchModal(false);
      fetchBranches();
      setNewBranch({ name: "", address: "", phone: "", timezone: "UTC", location_type: "Drop-off", is_plant: false });
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to create branch.' });
    } finally {
      setLoading(false);
    }
  };

  // ================= Render =================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 max-w-7xl w-full mx-auto p-6">
        
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-gray-400" />
            Organization Settings
          </h1>
          <p className="text-gray-500 mt-1">Manage your store branding, locations, and data.</p>
        </div>

        {/* Messages */}
        {msg && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {msg.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <nav className="w-full md:w-64 flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab("branding")}
              className={`text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 ${
                activeTab === "branding" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Tag size={18} /> Branding & Receipts
            </button>
            
            <button 
              onClick={() => setActiveTab("branches")}
              className={`text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 ${
                activeTab === "branches" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <MapPin size={18} /> Locations / Branches
            </button>

            {/* ✅ New Tab for Imports */}
            <button 
              onClick={() => setActiveTab("data")}
              className={`text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 ${
                activeTab === "data" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Database size={18} /> Data & Imports
            </button>
          </nav>

          {/* Main Content Area */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
            
            {/* --- TAB: BRANDING --- */}
            {activeTab === "branding" && (
              <div className="p-6 animate-in fade-in duration-200">
                <h2 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b">Branding & Receipts</h2>
                <form onSubmit={saveBranding} className="space-y-6 max-w-2xl">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                        <div className="flex items-center gap-2">
                           <input type="color" className="h-10 w-14 rounded cursor-pointer border p-1" 
                                  value={branding.primary_color} onChange={e => setBranding({...branding, primary_color: e.target.value})} />
                           <span className="text-sm text-gray-500">{branding.primary_color}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                        <div className="flex items-center gap-2">
                           <input type="color" className="h-10 w-14 rounded cursor-pointer border p-1" 
                                  value={branding.secondary_color} onChange={e => setBranding({...branding, secondary_color: e.target.value})} />
                           <span className="text-sm text-gray-500">{branding.secondary_color}</span>
                        </div>
                      </div>
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Header Message</label>
                      <textarea rows={3} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="e.g. Thank you for choosing us!"
                        value={branding.receipt_header || ''} onChange={e => setBranding({...branding, receipt_header: e.target.value})} />
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Message</label>
                      <textarea rows={3} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="e.g. No refunds after 30 days."
                        value={branding.receipt_footer || ''} onChange={e => setBranding({...branding, receipt_footer: e.target.value})} />
                   </div>

                   <button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      Save Changes
                   </button>
                </form>
              </div>
            )}

            {/* --- TAB: BRANCHES --- */}
            {activeTab === "branches" && (
              <div className="p-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-6 pb-2 border-b">
                   <h2 className="text-lg font-bold text-gray-900">Locations</h2>
                   <button onClick={() => setShowBranchModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                      <Plus size={16} /> Add Branch
                   </button>
                </div>

                <div className="grid gap-4">
                   {branches.length === 0 && <p className="text-gray-500 italic">No branches found.</p>}
                   {branches.map((branch: any) => (
                      <div key={branch.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors flex justify-between items-center bg-gray-50/50">
                         <div>
                            <h3 className="font-bold text-gray-900">{branch.name}</h3>
                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                               <MapPin size={14} /> {branch.address}
                            </div>
                         </div>
                         <span className={`px-2 py-1 text-xs rounded-full font-medium border ${
                           branch.location_type === 'Plant' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-green-100 text-green-700 border-green-200'
                         }`}>
                           {branch.location_type}
                         </span>
                      </div>
                   ))}
                </div>
              </div>
            )}

            {/* --- ✅ TAB: DATA & IMPORTS (New) --- */}
            {activeTab === "data" && (
               <div className="p-6 animate-in fade-in duration-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b">Data Management</h2>
                  
                  <div className="space-y-6">
                     
                     {/* Import Card */}
                     <div className="border border-gray-200 rounded-xl p-6 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                           <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                              <UploadCloud size={24} />
                           </div>
                           <div>
                              <h3 className="text-base font-bold text-gray-900">Bulk Customer Import</h3>
                              <p className="text-sm text-gray-600 mt-1 mb-4 leading-relaxed max-w-lg">
                                 Upload multiple customers at once manually. Useful for migrating from an old system 
                                 or adding a list of initial clients.
                              </p>
                              
                              <button 
                                onClick={() => setShowBulkImport(true)}
                                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors font-medium text-sm shadow-sm"
                              >
                                 <Plus size={16} /> Open Import Tool
                              </button>
                           </div>
                        </div>
                     </div>
                     
                     {/* Placeholder for future tools */}
                     {/* <div className="border border-gray-200 rounded-xl p-6 bg-gray-50/50 opacity-60">
                        <div className="flex items-start gap-4">
                           <div className="p-3 bg-gray-200 text-gray-500 rounded-lg">
                              <Database size={24} />
                           </div>
                           <div>
                              <h3 className="text-base font-bold text-gray-700">Export Data (Coming Soon)</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                 Download CSV reports of your sales and customer history.
                              </p>
                           </div>
                        </div>
                     </div> */}

                  </div>
               </div>
            )}

          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Add New Branch</h3>
              <form onSubmit={createBranch} className="space-y-3">
                 <input required type="text" placeholder="Branch Name" className="w-full border p-2 rounded" 
                    value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} />
                 <input required type="text" placeholder="Address" className="w-full border p-2 rounded" 
                    value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} />
                 <input required type="text" placeholder="Phone" className="w-full border p-2 rounded" 
                    value={newBranch.phone} onChange={e => setNewBranch({...newBranch, phone: e.target.value})} />
                 
                 <select className="w-full border p-2 rounded" 
                   value={newBranch.location_type} 
                   onChange={e => setNewBranch({...newBranch, location_type: e.target.value})}
                 >
                   <option value="Drop-off">Drop-off Station</option>
                   <option value="Plant">Processing Plant</option>
                 </select>

                 <div className="flex gap-2 pt-2">
                   <button type="button" onClick={() => setShowBranchModal(false)} className="flex-1 border p-2 rounded hover:bg-gray-50">Cancel</button>
                   <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white p-2 rounded hover:bg-green-700">Create</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* ✅ Bulk Import Component */}
      {showBulkImport && (
        <BulkCustomerImport 
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => setMsg({ type: 'success', text: 'Customers imported successfully!' })}
        />
      )}

    </div>
  );
}