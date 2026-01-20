import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    Users,
    DollarSign,
    Shield,       
    Power,       
    Menu,
    X,
    Plus,
    LogOut,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    MapPin,
    Loader2,
    Trash2,
    Mail,
    Edit3,
    BarChart3,
    Phone,
    UserPlus,
    Lock,
    Home,
    Eye,
    EyeOff
} from 'lucide-react';
import Header from './Header';
import baseURL from '../lib/config';

// ==========================================
// 1. LOGIN COMPONENT
// ==========================================
interface AdminLoginProps {
    onLoginSuccess: () => void;
}

function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${baseURL}/token/admin-login`, { email, password });
            
            const { access_token, admin_role, email: adminEmail } = res.data;

            localStorage.setItem('platformAdminToken', access_token);
            localStorage.setItem('platformAdminRole', admin_role);
            localStorage.setItem('platformAdminEmail', adminEmail);

            onLoginSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Login failed. Check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-grow flex items-center justify-center p-4 min-h-full">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 my-auto">
                <div className="text-center mb-8">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Platform Admin</h2>
                    <p className="text-gray-500 text-sm">Restricted Access Portal</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="admin@xocleaners.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" strokeWidth={2.5} />
                                ) : (
                                    <Eye className="h-5 w-5" strokeWidth={2.5} />
                                )}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Lock size={18} /> Secure Login</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ==========================================
// 2. DASHBOARD COMPONENT
// ==========================================

interface PlatformStats {
    total_stores: number;
    active_stores: number;
    total_users: number;
    total_tickets: number;
    total_revenue: number;
}

interface StoreAnalyticsData {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    owner_email: string | null;
    is_active: boolean;
    ticket_count: number;
    total_revenue: number;
}

interface MonthlyMetric {
    month: string;
    tickets: number;
    revenue: number;
}

interface UserData {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    phone?: string;
    organization_id: number;
    organization_name?: string;
    joined_at: string;
    is_deactivated?: boolean;
}

// Updated Props Interface
interface AdminDashboardProps {
    onLogout: () => void;
    onBackToHome: () => void;
}

function AdminDashboard({ onLogout, onBackToHome }: AdminDashboardProps) {
    const navigate = useNavigate();

    // --- STATE ---
    const [activeView, setActiveView] = useState<'dashboard' | 'stores' | 'users'>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Data State
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [stores, setStores] = useState<StoreAnalyticsData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    
    // --- MODAL STATES ---
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
    const [selectedStoreAnalytics, setSelectedStoreAnalytics] = useState<{name: string, data: MonthlyMetric[]} | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<{id: number, name: string, address: string, phone: string} | null>(null);
    const [newStore, setNewStore] = useState({
        name: '', address: '', phone: '',
        owner_first_name: '', owner_last_name: '', owner_email: '', owner_password: ''
    });

    const [isStoreUsersModalOpen, setIsStoreUsersModalOpen] = useState(false);
    const [currentStoreForUsers, setCurrentStoreForUsers] = useState<StoreAnalyticsData | null>(null);
    const [storeUsers, setStoreUsers] = useState<UserData[]>([]);
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    
    const [newStoreUser, setNewStoreUser] = useState({
        first_name: '', last_name: '', email: '', password: '', role: 'cashier', phone: ''
    });
    
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [editUserForm, setEditUserForm] = useState({ first_name: '', last_name: '', email: '', role: '', phone: '' });

    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // --- FETCH DATA ---
    useEffect(() => {
        fetchData();
    }, [activeView]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('platformAdminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (activeView === 'dashboard') {
                const res = await axios.get(`${baseURL}/platform-admin/analytics`, config);
                setStats(res.data);
            } 
            else if (activeView === 'stores') {
                const res = await axios.get(`${baseURL}/platform-admin/analytics/revenue-by-store`, config);
                setStores(res.data);
            } 
            else if (activeView === 'users') {
                const res = await axios.get(`${baseURL}/platform-admin/users`, config).catch(() => {
                    return axios.get(`${baseURL}/all-users`, config);
                });
                setUsers(res.data.users || res.data);
            }
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout(); 
            } else {
                setError("Failed to load data.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --- ACTIONS ---
    
    const openStoreUsersModal = async (store: StoreAnalyticsData) => {
        setCurrentStoreForUsers(store);
        setIsStoreUsersModalOpen(true);
        setIsUserFormOpen(false);
        try {
            const token = localStorage.getItem('platformAdminToken');
            const res = await axios.get(`${baseURL}/platform-admin/stores/${store.id}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStoreUsers(res.data);
        } catch (err) {
            setError("Failed to fetch store users.");
        }
    };

    const handleCreateStoreUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentStoreForUsers) return;
        try {
            const token = localStorage.getItem('platformAdminToken');
            await axios.post(`${baseURL}/platform-admin/stores/${currentStoreForUsers.id}/users`, newStoreUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            showSuccess(`New ${newStoreUser.role} added.`);
            setNewStoreUser({ first_name: '', last_name: '', email: '', password: '', role: 'cashier', phone: '' });
            setIsUserFormOpen(false);
            
            const res = await axios.get(`${baseURL}/platform-admin/stores/${currentStoreForUsers.id}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStoreUsers(res.data);

        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to create user.");
        }
    };

    const handleDeleteStoreUser = async (userId: number) => {
        if (!window.confirm("Are you sure you want to deactivate this user?")) return;
        try {
            const token = localStorage.getItem('platformAdminToken');
            await axios.delete(`${baseURL}/platform-admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStoreUsers(prev => prev.map(u => u.id === userId ? { ...u, is_deactivated: true } : u));
            showSuccess("User deactivated.");
        } catch (err) {
            setError("Failed to deactivate user.");
        }
    };

    const openEditUserModal = (user: UserData) => {
        setEditingUser(user);
        setEditUserForm({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role, 
            phone: user.phone || ''
        });
        setIsEditUserModalOpen(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            const token = localStorage.getItem('platformAdminToken');
            
            const payload: any = { ...editUserForm };

            // IMPORTANT: Remove 'org_owner' role from payload to avoid 422 error from strict backend enum
            if (payload.role === 'org_owner') {
                delete payload.role;
            }

            await axios.put(`${baseURL}/platform-admin/users/${editingUser.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            showSuccess("User details updated.");
            setIsEditUserModalOpen(false);
            
            if (isStoreUsersModalOpen && currentStoreForUsers) {
                const res = await axios.get(`${baseURL}/platform-admin/stores/${currentStoreForUsers.id}/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStoreUsers(res.data);
            }
            if (activeView === 'users') fetchData();

        } catch (err: any) {
            console.error("Update error:", err.response?.data);
            setError(err.response?.data?.detail || "Failed to update user. Check inputs.");
        }
    };

    const handleViewAnalytics = async (store: StoreAnalyticsData) => {
        try {
            const token = localStorage.getItem('platformAdminToken');
            const res = await axios.get(`${baseURL}/platform-admin/stores/${store.id}/analytics/monthly`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedStoreAnalytics({ name: store.name, data: res.data });
            setIsAnalyticsModalOpen(true);
        } catch (err) {
            setError("Failed to load store analytics.");
        }
    };

    const openEditModal = (store: StoreAnalyticsData) => {
        setEditingStore({
            id: store.id,
            name: store.name,
            address: store.address || '',
            phone: store.phone || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStore) return;
        try {
            const token = localStorage.getItem('platformAdminToken');
            await axios.put(`${baseURL}/platform-admin/stores/${editingStore.id}`, 
                { name: editingStore.name, address: editingStore.address, phone: editingStore.phone }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showSuccess("Store details updated.");
            setIsEditModalOpen(false);
            setEditingStore(null);
            if (activeView === 'stores') fetchData();
        } catch (err) {
            setError("Failed to update store details.");
        }
    };

    const handleImpersonate = async (storeId: number) => {
        if (!window.confirm("Log in as this Store Owner?")) return;
        try {
            const token = localStorage.getItem('platformAdminToken');
            const res = await axios.post(`${baseURL}/platform-admin/impersonate/${storeId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.setItem('accessToken', res.data.access_token);
            localStorage.setItem('userRole', res.data.redirect_role);
            navigate('/org'); 
        } catch (err: any) {
            setError("Impersonation failed");
        }
    };

    const handleToggleStatus = async (store: StoreAnalyticsData) => {
        const newStatus = !store.is_active;
        try {
            const token = localStorage.getItem('platformAdminToken');
            await axios.patch(`${baseURL}/platform-admin/stores/${store.id}/status`, 
                { is_active: newStatus }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStores(prev => prev.map(s => s.id === store.id ? { ...s, is_active: newStatus } : s));
            showSuccess(`Store ${newStatus ? 'Activated' : 'Deactivated'}.`);
        } catch (err) {
            setError("Failed to update status");
        }
    };

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('platformAdminToken');
            await axios.post(`${baseURL}/platform-admin/stores`, newStore, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess("Store created successfully!");
            setIsCreateModalOpen(false);
            setNewStore({ name: '', address: '', phone: '', owner_first_name: '', owner_last_name: '', owner_email: '', owner_password: '' });
            if (activeView === 'stores') fetchData();
        } catch (err) {
            setError("Failed to create store");
        }
    };
    
    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    // --- RENDER HELPERS ---
    const renderDashboard = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-gray-800">Platform Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-green-100 font-medium text-sm">Total Revenue</p>
                            <h3 className="text-3xl font-bold mt-1">${stats?.total_revenue?.toLocaleString() || '0.00'}</h3>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg"><DollarSign size={24} /></div>
                    </div>
                </div>
                <div onClick={() => setActiveView('stores')} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-medium text-sm group-hover:text-blue-600 transition-colors">Active Stores</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.active_stores || 0}</h3>
                        </div>
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-blue-100 transition-colors"><Store size={24} /></div>
                    </div>
                </div>
                <div onClick={() => setActiveView('users')} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-medium text-sm group-hover:text-orange-600 transition-colors">Total Users</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.total_users || 0}</h3>
                        </div>
                        <div className="bg-orange-50 text-orange-600 p-2 rounded-lg group-hover:bg-orange-100 transition-colors"><Users size={24} /></div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-medium text-sm">Total Tickets</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.total_tickets || 0}</h3>
                        </div>
                        <div className="bg-purple-50 text-purple-600 p-2 rounded-lg"><TrendingUp size={24} /></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStores = () => (
        <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Store Financials & Management</h2>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md">
                    <Plus size={18} /> New Store
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm text-gray-600 relative">
                        <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                            <tr><th className="p-4 bg-gray-50">Store Name</th><th className="p-4 bg-gray-50">Owner Contact</th><th className="p-4 bg-gray-50">Total Revenue</th><th className="p-4 bg-gray-50 text-center">Status</th><th className="p-4 bg-gray-50 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stores.map((store) => (
                                <tr key={store.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4"><div className="font-semibold text-gray-900">{store.name}</div><div className="flex items-center gap-1 text-gray-500 mt-1 text-xs"><MapPin size={12} /> {store.address || 'N/A'}</div></td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">{(store.owner_email || store.name || '?').charAt(0).toUpperCase()}</div>
                                            <div className="flex flex-col"><span className="text-gray-900 font-medium">{store.owner_email || store.phone || <span className="text-red-400 italic text-xs">No Contact Info</span>}</span>{store.owner_email && store.phone && (<span className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} /> {store.phone}</span>)}</div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono font-medium text-green-700">${store.total_revenue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}</td>
                                    <td className="p-4 text-center"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{store.is_active ? 'Active' : 'Inactive'}</span></td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openStoreUsersModal(store)} className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition" title="Manage Users"><Users size={18} /></button>
                                            <button onClick={() => handleViewAnalytics(store)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition" title="View Analytics"><BarChart3 size={18} /></button>
                                            <button onClick={() => openEditModal(store)} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition" title="Edit Store"><Edit3 size={18} /></button>
                                            <button onClick={() => handleImpersonate(store.id)} disabled={!store.owner_email} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition" title="Impersonate"><Shield size={18} /></button>
                                            <button onClick={() => handleToggleStatus(store)} className={`p-2 rounded-lg transition ${store.is_active ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`} title="Toggle Status"><Power size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
            <div className="flex justify-between items-center flex-shrink-0"><h2 className="text-2xl font-bold text-gray-800">All Platform Users</h2><div className="bg-white border rounded-lg flex items-center px-3 py-2"><div className="text-xs text-gray-500 mr-2">Total:</div><div className="font-bold text-gray-800">{users.length}</div></div></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm text-gray-600 relative">
                        <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 bg-gray-50">User</th>
                                <th className="p-4 bg-gray-50">Role</th>
                                <th className="p-4 bg-gray-50">Organization</th>
                                <th className="p-4 bg-gray-50">Joined</th>
                                <th className="p-4 bg-gray-50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4"><div className="font-semibold text-gray-900">{user.first_name} {user.last_name}</div><div className="flex items-center gap-1 text-xs text-gray-500"><Mail size={12} /> {user.email}</div></td>
                                    <td className="p-4"><span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 capitalize border border-gray-200">{user.role}</span></td>
                                    
                                    {/* UPDATED COLUMN: SHOW ORGANIZATION NAME */}
                                    <td className="p-4 text-gray-500">
                                        {user.organization_name ? (
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{user.organization_name}</span>
                                                <span className="text-xs text-gray-400">ID: {user.organization_id}</span>
                                            </div>
                                        ) : (
                                            user.organization_id ? 
                                            <span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">#{user.organization_id}</span> 
                                            : 
                                            <span className="text-xs italic text-gray-400">N/A</span>
                                        )}
                                    </td>
                                    
                                    <td className="p-4 text-gray-500">{user.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'N/A'}</td>
                                    <td className="p-4 text-right flex justify-end gap-2"><button onClick={() => openEditUserModal(user)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition"><Edit3 size={16} /></button><button onClick={() => handleDeleteStoreUser(user.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-1 overflow-hidden">
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto mt-20 lg:mt-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-slate-800"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Shield className="text-indigo-400" /> Platform Admin</h2><p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">God Mode Access</p></div>
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        <button onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard size={20} className="mr-3" /> Dashboard</button>
                        <button onClick={() => { setActiveView('stores'); setSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeView === 'stores' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}><Store size={20} className="mr-3" /> All Stores</button>
                        <button onClick={() => { setActiveView('users'); setSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeView === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}><Users size={20} className="mr-3" /> All Users</button>
                    </nav>
                    
                    {/* Fixed Sidebar Footer with Logout AND Back to Home */}
                    <div className="p-4 border-t border-slate-800 space-y-2">
                         <button onClick={onBackToHome} className="w-full flex items-center text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-lg transition text-sm">
                            <Home size={18} className="mr-3" /> Website
                        </button>
                        <button onClick={onLogout} className="w-full flex items-center text-red-400 hover:bg-red-900/20 px-4 py-3 rounded-lg transition text-sm">
                            <LogOut size={18} className="mr-3" /> Logout
                        </button>
                    </div>
                </div>
            </aside>
            {sidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
            
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50 relative h-full">
                <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between"><span className="font-bold text-gray-800 capitalize">{activeView}</span><button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Menu size={24} /></button></div>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-8 h-full">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">
                        {error && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-center gap-3 flex-shrink-0"><AlertCircle size={20} /> {error} <button onClick={() => setError(null)} className="ml-auto"><X size={18}/></button></div>}
                        {successMsg && <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 flex items-center gap-3 flex-shrink-0"><CheckCircle size={20} /> {successMsg}</div>}
                        
                        {isLoading && !stats ? (
                            <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>
                        ) : (
                            activeView === 'dashboard' ? renderDashboard() : activeView === 'stores' ? renderStores() : renderUsers()
                        )}
                    </div>
                </div>
            </main>

            {/* --- MODALS --- */}
            
            {/* 1. Create Store Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0"><h3 className="text-lg font-bold text-gray-800">Create New Store</h3><button onClick={() => setIsCreateModalOpen(false)}><X size={20} className="text-gray-400" /></button></div>
                        <div className="overflow-y-auto p-6"><form onSubmit={handleCreateStore} className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-4"><h4 className="text-xs font-bold text-gray-500 uppercase">Store Details</h4><input required type="text" className="w-full border rounded-lg p-2" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} placeholder="Store Name" /><input type="text" className="w-full border rounded-lg p-2" value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} placeholder="Address" /><input type="tel" className="w-full border rounded-lg p-2" value={newStore.phone} onChange={e => setNewStore({...newStore, phone: e.target.value})} placeholder="Phone" /></div><div className="space-y-4"><h4 className="text-xs font-bold text-gray-500 uppercase">Owner Credentials</h4><input required type="text" className="w-full border rounded-lg p-2" value={newStore.owner_first_name} onChange={e => setNewStore({...newStore, owner_first_name: e.target.value})} placeholder="First Name" /><input required type="text" className="w-full border rounded-lg p-2" value={newStore.owner_last_name} onChange={e => setNewStore({...newStore, owner_last_name: e.target.value})} placeholder="Last Name" /><input required type="email" className="w-full border rounded-lg p-2" value={newStore.owner_email} onChange={e => setNewStore({...newStore, owner_email: e.target.value})} placeholder="Email" /><input required type="password" className="w-full border rounded-lg p-2" value={newStore.owner_password} onChange={e => setNewStore({...newStore, owner_password: e.target.value})} placeholder="Password" /></div></div><div className="pt-4 border-t flex justify-end gap-3"><button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button></div></form></div>
                    </div>
                </div>
            )}

            {/* 2. Edit Store Modal */}
            {isEditModalOpen && editingStore && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"><div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0"><h3 className="text-lg font-bold text-gray-800">Edit Store</h3><button onClick={() => setIsEditModalOpen(false)}><X size={20} className="text-gray-400" /></button></div><div className="overflow-y-auto p-6"><form onSubmit={handleUpdateStore} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label><input required type="text" className="w-full border rounded-lg p-2" value={editingStore.name} onChange={e => setEditingStore({...editingStore, name: e.target.value})} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" className="w-full border rounded-lg p-2" value={editingStore.address} onChange={e => setEditingStore({...editingStore, address: e.target.value})} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" className="w-full border rounded-lg p-2" value={editingStore.phone} onChange={e => setEditingStore({...editingStore, phone: e.target.value})} /></div><div className="pt-4 border-t flex justify-end gap-3"><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button></div></form></div></div></div>)}
            
            {/* 3. Analytics Modal */}
            {isAnalyticsModalOpen && selectedStoreAnalytics && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[80vh] flex flex-col"><div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0"><h3 className="text-lg font-bold text-gray-800">Analytics: {selectedStoreAnalytics.name}</h3><button onClick={() => setIsAnalyticsModalOpen(false)}><X size={20} className="text-gray-400" /></button></div><div className="p-6 overflow-y-auto flex-1"><table className="w-full text-left text-sm text-gray-600"><thead className="bg-gray-50 text-gray-900 font-medium sticky top-0 z-10"><tr><th className="p-3 bg-gray-50">Month</th><th className="p-3 bg-gray-50 text-center">Ticket Volume</th><th className="p-3 bg-gray-50 text-right">Revenue</th></tr></thead><tbody className="divide-y divide-gray-100">{selectedStoreAnalytics.data.map((item, i) => (<tr key={i} className="hover:bg-gray-50"><td className="p-3 font-medium">{item.month}</td><td className="p-3 text-center">{item.tickets}</td><td className="p-3 text-right font-mono font-bold text-green-700">${item.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>))}{selectedStoreAnalytics.data.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-400">No data available yet.</td></tr>}</tbody></table></div></div></div>)}
            
            {/* 4. Store Users & Add User Modal */}
            {isStoreUsersModalOpen && currentStoreForUsers && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Users size={20} className="text-indigo-600" /> Users: {currentStoreForUsers.name}
                            </h3>
                            <button onClick={() => setIsStoreUsersModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            <div className="mb-6 flex justify-between items-center">
                                <h4 className="text-gray-600 font-medium">Active Staff & Customers</h4>
                                <button onClick={() => setIsUserFormOpen(!isUserFormOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${isUserFormOpen ? 'bg-gray-200 text-gray-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                    {isUserFormOpen ? <><X size={16}/> Cancel</> : <><UserPlus size={16}/> Add User</>}
                                </button>
                            </div>
                            
                            {isUserFormOpen && (
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100 mb-6 animate-in slide-in-from-top-2">
                                    <h5 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Add New User</h5>
                                    <form onSubmit={handleCreateStoreUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input required placeholder="First Name" className="border p-2 rounded-lg" value={newStoreUser.first_name} onChange={e => setNewStoreUser({...newStoreUser, first_name: e.target.value})} />
                                        <input required placeholder="Last Name" className="border p-2 rounded-lg" value={newStoreUser.last_name} onChange={e => setNewStoreUser({...newStoreUser, last_name: e.target.value})} />
                                        <input required type="email" placeholder="Email" className="border p-2 rounded-lg" value={newStoreUser.email} onChange={e => setNewStoreUser({...newStoreUser, email: e.target.value})} />
                                        <input required type="password" placeholder="Password" className="border p-2 rounded-lg" value={newStoreUser.password} onChange={e => setNewStoreUser({...newStoreUser, password: e.target.value})} />
                                        <input type="tel" placeholder="Phone (Optional)" className="border p-2 rounded-lg" value={newStoreUser.phone} onChange={e => setNewStoreUser({...newStoreUser, phone: e.target.value})} />
                                        
                                        <select className="border p-2 rounded-lg bg-white" value={newStoreUser.role} onChange={e => setNewStoreUser({...newStoreUser, role: e.target.value})}>
                                            <option value="store_admin">Store Admin</option>
                                            <option value="store_manager">Store Manager</option>
                                            <option value="operator">Operator</option>
                                            <option value="cashier">Cashier</option>
                                            <option value="driver">Driver</option>
                                            <option value="customer">Customer</option>
                                        </select>
                                        
                                        <div className="md:col-span-2 flex justify-end mt-2">
                                            <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 shadow-md">Create User</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-200">
                                        <tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Contact</th><th className="p-3 text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {storeUsers.map((u) => (
                                            <tr key={u.id} className={`${u.is_deactivated ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'} transition`}>
                                                <td className="p-3 font-medium text-gray-900">{u.first_name} {u.last_name}</td>
                                                <td className="p-3"><span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 border border-gray-200 capitalize">{u.role}</span></td>
                                                <td className="p-3 text-xs">{u.email}<br/><span className="text-gray-400">{u.phone}</span></td>
                                                <td className="p-3 text-right flex justify-end gap-2">
                                                    <button onClick={() => openEditUserModal(u)} className="text-blue-600 bg-blue-50 p-1.5 rounded hover:bg-blue-100"><Edit3 size={14}/></button>
                                                    {!u.is_deactivated && <button onClick={() => handleDeleteStoreUser(u.id)} className="text-red-600 bg-red-50 p-1.5 rounded hover:bg-red-100"><Trash2 size={14}/></button>}
                                                </td>
                                            </tr>
                                        ))}
                                        {storeUsers.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">No users found for this store.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Edit User Modal */}
            {isEditUserModalOpen && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Edit User</h3>
                            <button onClick={() => setIsEditUserModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label><input className="w-full border p-2 rounded-lg" value={editUserForm.first_name} onChange={e => setEditUserForm({...editUserForm, first_name: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label><input className="w-full border p-2 rounded-lg" value={editUserForm.last_name} onChange={e => setEditUserForm({...editUserForm, last_name: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label><input className="w-full border p-2 rounded-lg" value={editUserForm.email} onChange={e => setEditUserForm({...editUserForm, email: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label><input className="w-full border p-2 rounded-lg" value={editUserForm.phone} onChange={e => setEditUserForm({...editUserForm, phone: e.target.value})} /></div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                                {editUserForm.role === 'org_owner' ? (
                                    <div className="w-full border p-2 rounded-lg bg-gray-100 text-gray-500 italic flex justify-between items-center">
                                        <span>Org Owner (Cannot Change)</span>
                                        <Shield size={14} />
                                    </div>
                                ) : (
                                    <select className="w-full border p-2 rounded-lg bg-white" value={editUserForm.role} onChange={e => setEditUserForm({...editUserForm, role: e.target.value})}>
                                        <option value="store_admin">Store Admin</option>
                                        <option value="store_manager">Store Manager</option>
                                        <option value="operator">Operator</option>
                                        <option value="cashier">Cashier</option>
                                        <option value="driver">Driver</option>
                                        <option value="customer">Customer</option>
                                    </select>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsEditUserModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// 3. MAIN COMPONENT (WRAPPER & DEFAULT EXPORT)
// ==========================================

interface PlatformAdminProps {
    onBackToHome: () => void;
}

export default function PlatformAdmin({ onBackToHome }: PlatformAdminProps) {
    const [loggedIn, setLoggedIn] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);

    const checkAuth = useCallback(() => {
        const token = localStorage.getItem('platformAdminToken');
        if (token) {
            setLoggedIn(true);
        } else {
            setLoggedIn(false);
        }
        setIsVerifying(false);
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const handleLoginSuccess = () => {
        setLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('platformAdminToken');
        localStorage.removeItem('platformAdminRole');
        localStorage.removeItem('platformAdminEmail');
        setLoggedIn(false);
    };

    if (isVerifying) {
        return (
            <div className="flex flex-col h-screen overflow-hidden">
                <Header onBackToHome={onBackToHome} />
                <div className="flex-grow flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
            {/* Header is now moved outside the conditional so it renders for both views */}
            <Header onBackToHome={onBackToHome} />

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {!loggedIn ? (
                    <div className="flex-1 overflow-y-auto flex flex-col">
                        <AdminLogin onLoginSuccess={handleLoginSuccess} />
                    </div>
                ) : (
                    // We pass both logout and onBackToHome so the dashboard can use them
                    <AdminDashboard onLogout={handleLogout} onBackToHome={onBackToHome} />
                )}
            </div>
        </div>
    );
}