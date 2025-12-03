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
  AlertCircle
} from "lucide-react";
import baseURL from "../lib/config"; // Adjust path to your config
import Header from "./Header"; // Adjust path to your Header

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
    location_type: "Drop-off", // or 'Plant'
    is_plant: false
  });

  // --- Payment State ---
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState({
    Cash: true,
    Card: true,
    PayPal: false,
    Loyalty: false
  });

  // --- Tag State ---
  const [tagConfig, setTagConfig] = useState({
    tag_type: "Heat Press",
    start_sequence: 1000,
    printer_name: ""
  });

  // ================= Initial Data Fetching =================
  useEffect(() => {
    fetchBranding();
    fetchBranches();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchBranding = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/settings/branding`, getAuthHeader());
      if (res.data && Object.keys(res.data).length > 0) {
        setBranding(res.data);
      }
    } catch (err) {
      console.error("No branding found or error fetching");
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/settings/branches`, getAuthHeader());
      setBranches(res.data);
      if (res.data.length > 0) setSelectedBranchId(res.data[0].id);
    } catch (err) {
      console.error("Error fetching branches");
    }
  };

  // ================= Save Handlers =================

  // 1. Save Branding
  const saveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await axios.put(`${baseURL}/api/settings/branding`, branding, getAuthHeader());
      setMsg({ type: 'success', text: "Branding updated successfully!" });
    } catch (err: any) {
      setMsg({ type: 'error', text: "Failed to update branding." });
    } finally {
      setLoading(false);
    }
  };

  // 2. Create Branch
  const createBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...newBranch,
        is_plant: newBranch.location_type === "Plant"
      };
      await axios.post(`${baseURL}/api/settings/branches`, payload, getAuthHeader());
      setMsg({ type: 'success', text: "Branch created successfully!" });
      setShowBranchModal(false);
      fetchBranches(); // Refresh list
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.detail || "Failed to create branch." });
    } finally {
      setLoading(false);
    }
  };

  // 3. Save Payments
  const savePayments = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      await axios.put(`${baseURL}/api/settings/payments/config`, {
        branch_id: selectedBranchId,
        methods: paymentMethods
      }, getAuthHeader());
      setMsg({ type: 'success', text: "Payment methods updated for this branch." });
    } catch (err: any) {
      setMsg({ type: 'error', text: "Failed to update payments." });
    } finally {
      setLoading(false);
    }
  };

  // 4. Save Tags
  const saveTags = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${baseURL}/api/settings/tags/config`, tagConfig, getAuthHeader());
      setMsg({ type: 'success', text: "Tag configuration saved." });
    } catch (err: any) {
      setMsg({ type: 'error', text: "Failed to update tag config." });
    } finally {
      setLoading(false);
    }
  };

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Header />

      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex-grow">
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Organization Settings</h1>
          <p className="text-gray-500">Manage your branding, locations, and system preferences.</p>
        </div>

        {/* Global Message Alert */}
        {msg && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {msg.text}
          </div>
        )}

        {/* --- TABS NAVIGATION --- */}
        <div className="flex flex-wrap border-b border-gray-200 mb-8 bg-white rounded-t-xl shadow-sm overflow-hidden">
          {[
            { id: "branding", label: "Branding", icon: Settings },
            { id: "branches", label: "Locations", icon: MapPin },
            { id: "payments", label: "Payments", icon: CreditCard },
            { id: "tags", label: "Tags & Printers", icon: Tag },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMsg(null); }}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- TAB CONTENT AREA --- */}
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 p-8 min-h-[400px]">
          
          {/* 1. BRANDING TAB */}
          {activeTab === "branding" && (
            <form onSubmit={saveBranding} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="h-10 w-14 rounded cursor-pointer" 
                      value={branding.primary_color}
                      onChange={(e) => setBranding({...branding, primary_color: e.target.value})}
                    />
                    <span className="text-gray-500 font-mono text-sm">{branding.primary_color}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="h-10 w-14 rounded cursor-pointer" 
                       value={branding.secondary_color}
                       onChange={(e) => setBranding({...branding, secondary_color: e.target.value})}
                    />
                    <span className="text-gray-500 font-mono text-sm">{branding.secondary_color}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input type="text" className="w-full border rounded-lg px-4 py-2" placeholder="https://example.com/logo.png" 
                   value={branding.logo_url || ""}
                   onChange={(e) => setBranding({...branding, logo_url: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Header</label>
                <textarea rows={3} className="w-full border rounded-lg px-4 py-2" placeholder="Welcome to XO Cleaners..." 
                   value={branding.receipt_header || ""}
                   onChange={(e) => setBranding({...branding, receipt_header: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer</label>
                <textarea rows={3} className="w-full border rounded-lg px-4 py-2" placeholder="Thank you for your business!" 
                   value={branding.receipt_footer || ""}
                   onChange={(e) => setBranding({...branding, receipt_footer: e.target.value})}
                />
              </div>

              <button disabled={loading} type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} Save Branding
              </button>
            </form>
          )}

          {/* 2. LOCATIONS TAB */}
          {activeTab === "branches" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Branch Management</h3>
                <button onClick={() => setShowBranchModal(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  <Plus size={18} /> Add Branch
                </button>
              </div>

              <div className="overflow-hidden border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {branches.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No branches found.</td></tr>
                    ) : (
                      branches.map((b) => (
                        <tr key={b.id}>
                          <td className="px-6 py-4 font-medium">{b.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${b.location_type === 'Plant' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {b.location_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{b.phone}</td>
                          <td className="px-6 py-4 text-gray-500 text-sm">{b.address}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PAYMENTS TAB */}
          {activeTab === "payments" && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Payment Methods Configuration</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Branch to Configure</label>
                <select 
                  className="w-full border rounded-lg px-4 py-2"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  <option value="" disabled>-- Select a Branch --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.location_type})</option>
                  ))}
                </select>
              </div>

              {selectedBranchId && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                  <p className="font-medium text-gray-800 mb-2">Accepted Payment Methods</p>
                  
                  {Object.keys(paymentMethods).map((method) => (
                    <label key={method} className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="h-5 w-5 text-indigo-600 rounded"
                        checked={(paymentMethods as any)[method]}
                        onChange={(e) => setPaymentMethods({...paymentMethods, [method]: e.target.checked})}
                      />
                      <span className="text-gray-700">{method}</span>
                    </label>
                  ))}

                  <div className="pt-4">
                    <button onClick={savePayments} disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                      {loading ? "Saving..." : "Save Configuration"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. TAGS TAB */}
          {activeTab === "tags" && (
            <form onSubmit={saveTags} className="max-w-2xl space-y-6">
              <h3 className="text-lg font-semibold">Tagging System Configuration</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag Type</label>
                <select 
                  className="w-full border rounded-lg px-4 py-2"
                  value={tagConfig.tag_type}
                  onChange={(e) => setTagConfig({...tagConfig, tag_type: e.target.value})}
                >
                  <option value="Heat Press">Heat Press Tags</option>
                  <option value="Paper">Paper Tags (Stapled)</option>
                  <option value="Internal">Internal / Handwritten</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                   Heat press requires compatible hardware. Paper tags are standard for Dry Cleaning.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Sequence Number</label>
                <input 
                  type="number" 
                  className="w-full border rounded-lg px-4 py-2"
                  value={tagConfig.start_sequence}
                  onChange={(e) => setTagConfig({...tagConfig, start_sequence: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Printer Name / IP</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="e.g., 192.168.1.50 or 'Epson-TM-U220'"
                  value={tagConfig.printer_name}
                  onChange={(e) => setTagConfig({...tagConfig, printer_name: e.target.value})}
                />
              </div>

              <button disabled={loading} type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} Save Tag Config
              </button>
            </form>
          )}

        </div>
      </div>

      {/* --- ADD BRANCH MODAL --- */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add New Branch</h2>
            <form onSubmit={createBranch} className="space-y-4">
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

    </div>
  );
}