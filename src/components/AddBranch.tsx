import React, { useState, useEffect } from 'react';
import { Store, MapPin, Loader2, CheckCircle2, AlertCircle, RefreshCw, Lock, Mail } from 'lucide-react';
import baseURL from "../lib/config";
import axios from "axios";

const AddBranch: React.FC = () => {
    const [branchName, setBranchName] = useState('');
    const [branchEmail, setBranchEmail] = useState(''); // New state for email
    const [branchPassword, setBranchPassword] = useState('');
    const [orgType, setOrgType] = useState('drop_off_internal');
    const [isLoading, setIsLoading] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${baseURL}/api/organizations/my-branches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data);
        } catch (err) {
            console.error("Error fetching branches:", err);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleCreateBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMsg(null);

        const payload = {
            name: branchName.trim(),
            industry: "Dry Cleaning",
            org_type: orgType,
            admin_email: branchEmail.trim().toLowerCase(), // Using the user-provided email
            admin_password: branchPassword, 
            admin_first_name: "Branch",
            admin_last_name: "Manager"
        };

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${baseURL}/register/new-organization`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setStatusMsg({ type: 'success', text: `Branch created! They can login with ${branchEmail}` });
                setBranchName('');
                setBranchEmail('');
                setBranchPassword('');
                fetchBranches();
            } else {
                const data = await response.json();
                setStatusMsg({ type: 'error', text: data.detail || "Failed to create branch." });
            }
        } catch (error) {
            setStatusMsg({ type: 'error', text: "Network error. Please check connection." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Store size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Branch Credentials</h2>
                        <p className="text-sm text-gray-500">Set up the login identity for this location.</p>
                    </div>
                </div>

                <form onSubmit={handleCreateBranch} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                        <input
                            type="text"
                            required
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. North Side Hub"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Manager Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={branchEmail}
                                    onChange={(e) => setBranchEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="branch@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Login Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={branchPassword}
                                    onChange={(e) => setBranchPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Set password"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                        <select
                            value={orgType}
                            onChange={(e) => setOrgType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white outline-none"
                        >
                            <option value="drop_off_internal">Drop-off Point</option>
                            <option value="full_store">Full Service Store</option>
                        </select>
                    </div>

                    {statusMsg && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${
                            statusMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                            {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm font-medium">{statusMsg.text}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Create Branch Account"}
                    </button>
                </form>
            </div>

            {/* List Section */}
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-2">Registered Branches ({branches.length})</h3>
                    <button onClick={fetchBranches} className="text-gray-400 hover:text-blue-600"><RefreshCw size={16} /></button>
                </div>
                <div className="grid gap-3">
                    {branches.map((branch: any) => (
                        <div key={branch.id} className="p-4 bg-white border rounded-xl flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <MapPin className="text-blue-500" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{branch.name}</h4>
                                    <p className="text-xs text-gray-500">Login: {branch.owner_email}</p>
                                </div>
                            </div>
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold uppercase">
                                {branch.org_type?.replace('_', ' ')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AddBranch;