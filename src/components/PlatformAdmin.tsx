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
    EyeOff,
    RefreshCw,
    History,
    Activity,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
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
            const res = await axios.post(`${baseURL}/platform-admin/auth/login`, { email, password });
            
            const { access_token, role } = res.data;

            localStorage.setItem('platformAdminToken', access_token);
            localStorage.setItem('platformAdminRole', role);
            localStorage.setItem('platformAdminEmail', email);

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
    inactive_stores: number;
    total_users: number;
    total_customers: number;
    total_staff: number;
    total_tickets: number;
    total_revenue: number;
    tickets_this_month: number;
    revenue_this_month: number;
}

interface TrendData {
    month: string;
    new_stores: number;
    new_users: number;
    ticket_count: number;
    revenue: number;
}

interface StorePerformance {
    name: string;
    is_active: boolean;
    ticket_count_last_30_days: number;
    revenue_last_30_days: number;
}

interface AuditLog {
    id: number;
    organization_id: number;
    organization_name: string;
    actor_id: number;
    actor_name: string;
    actor_role: string;
    action: string;
    details: any;
    created_at: string;
    ticket_id?: number;
    customer_id?: number;
}

interface AuditSummary {
    org_name: string;
    action: string;
    count: number;
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
    const [activeView, setActiveView] = useState<'dashboard' | 'stores' | 'users' | 'audit-logs'>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Data State
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [stores, setStores] = useState<StoreAnalyticsData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [storePerformance, setStorePerformance] = useState<StorePerformance[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [auditSummary, setAuditSummary] = useState<AuditSummary[]>([]);
    
    // Filters for Audit Logs
    const [auditFilters, setAuditFilters] = useState({
        org_id: '',
        action: '',
        actor_role: '',
        date_from: '',
        date_to: '',
        limit: 100,
        offset: 0
    });
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
    const [selectedStoreAnalytics, setSelectedStoreAnalytics] = useState<{name: string, data: MonthlyMetric[]} | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmittingStore, setIsSubmittingStore] = useState(false);
    const [createStoreError, setCreateStoreError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [isSubmittingUser, setIsSubmittingUser] = useState(false);
    const [createUserError, setCreateUserError] = useState<string | null>(null);
    const [isFetchingStoreUsers, setIsFetchingStoreUsers] = useState(false);
    const [isImpersonating, setIsImpersonating] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<{id: number, name: string, address: string, phone: string} | null>(null);
    const [newStore, setNewStore] = useState({
        name: '', 
        industry: 'Dry Cleaning', 
        org_type: 'full_store',
        address: '', 
        phone: '',
        owner_first_name: '', 
        owner_last_name: '', 
        owner_email: '', 
        owner_password: ''
    });
    const [showOwnerPassword, setShowOwnerPassword] = useState(false);

    const [isStoreUsersModalOpen, setIsStoreUsersModalOpen] = useState(false);
    const [isGlobalUserModalOpen, setIsGlobalUserModalOpen] = useState(false);
    const [currentStoreForUsers, setCurrentStoreForUsers] = useState<StoreAnalyticsData | null>(null);
    const [storeUsers, setStoreUsers] = useState<UserData[]>([]);
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    
    const [newStoreUser, setNewStoreUser] = useState({
        first_name: '', last_name: '', email: '', password: '', role: 'cashier', phone: '', selected_org_id: ''
    });
    const [showNewUserPassword, setShowNewUserPassword] = useState(false);
    
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
        setIsRefreshing(true);
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('platformAdminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (activeView === 'dashboard') {
                const [statsRes, trendsRes, performanceRes] = await Promise.all([
                    axios.get(`${baseURL}/platform-admin/analytics`, config),
                    axios.get(`${baseURL}/platform-admin/analytics/trends/monthly`, config),
                    axios.get(`${baseURL}/platform-admin/analytics/trends/stores`, config)
                ]);
                setStats(statsRes.data);
                setTrends(trendsRes.data);
                setStorePerformance(performanceRes.data);
            } 
            else if (activeView === 'stores') {
                const res = await axios.get(`${baseURL}/platform-admin/stores`, config);
                setStores(res.data);
            } 
            else if (activeView === 'users') {
                const [usersRes, storesRes] = await Promise.all([
                    axios.get(`${baseURL}/platform-admin/users`, config),
                    axios.get(`${baseURL}/platform-admin/stores`, config)
                ]);
                setUsers(usersRes.data.users || usersRes.data);
                setStores(storesRes.data);
            }
            else if (activeView === 'audit-logs') {
                const queryParams = new URLSearchParams(Object.entries(auditFilters).filter(([_, v]) => v !== '')).toString();
                const [logsRes, summaryRes] = await Promise.all([
                    axios.get(`${baseURL}/platform-admin/audit-logs?${queryParams}`, config),
                    axios.get(`${baseURL}/platform-admin/audit-logs/summary`, config)
                ]);
                setAuditLogs(logsRes.data);
                setAuditSummary(summaryRes.data);
            }
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout(); 
            } else {
                setError("Failed to load data.");
            }
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    };

    // --- ACTIONS ---
    
    const openStoreUsersModal = async (store: StoreAnalyticsData) => {
        setCurrentStoreForUsers(store);
        setIsStoreUsersModalOpen(true);
        setIsUserFormOpen(false);
        setIsFetchingStoreUsers(true);
        setStoreUsers([]); 
        try {
            const token = localStorage.getItem('platformAdminToken');
            const res = await axios.get(`${baseURL}/platform-admin/stores/${store.id}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStoreUsers(res.data);
        } catch (err) {
            setError("Failed to fetch store users.");
        } finally {
            setIsFetchingStoreUsers(false);
        }
    };

    const handleCreateStoreUser = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Determine the target org ID
        const targetOrgId = currentStoreForUsers ? currentStoreForUsers.id : newStoreUser.selected_org_id;
        
        if (!targetOrgId) {
            setCreateUserError("Please select a store.");
            return;
        }

        setIsSubmittingUser(true);
        setCreateUserError(null);
        setError(null);

        try {
            const token = localStorage.getItem('platformAdminToken');
            
            const payload = {
                first_name: newStoreUser.first_name,
                last_name: newStoreUser.last_name,
                email: newStoreUser.email,
                password: newStoreUser.password,
                role: newStoreUser.role,
                phone: newStoreUser.phone,
                organization_id: targetOrgId
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            try {
                await axios.post(`${baseURL}/register/staff`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                });
            } finally {
                clearTimeout(timeoutId);
            }
            
            showSuccess(`New ${newStoreUser.role} added successfully.`);
            setNewStoreUser({ first_name: '', last_name: '', email: '', password: '', role: 'cashier', phone: '', selected_org_id: '' });
            setIsUserFormOpen(false);
            setIsGlobalUserModalOpen(false);
            setIsSubmittingUser(false);
            
            // ⚡ Refresh contextually
            if (currentStoreForUsers) {
                // Refresh specific store users list
                setTimeout(async () => {
                    try {
                        const res = await axios.get(`${baseURL}/platform-admin/stores/${currentStoreForUsers.id}/users`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setStoreUsers(res.data);
                    } catch (err) {
                        console.error("Failed to refresh users:", err);
                    }
                }, 500);
            } else if (activeView === 'users') {
                // Refresh global users list
                fetchData();
            }
        } catch (err: any) {
            setIsSubmittingUser(false);
            
            // Handle timeout error
            if (err.code === 'ECONNABORTED') {
                setCreateUserError("Request timed out. The backend may be experiencing issues. Please try again or check the server logs.");
                console.error("User creation timed out after 30 seconds");
                return;
            }
            
            console.error("User creation error:", err.response?.data);
            const errorDetail = err.response?.data?.detail;
            const errorMessage = typeof errorDetail === 'string' ? errorDetail : "Failed to create user.";
            setCreateUserError(errorMessage);
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
        setIsImpersonating(true);
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
            setIsImpersonating(false);
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

    const handleDeleteStore = async (storeId: number) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this store? This action is permanent.");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('platformAdminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // 1. Try safe delete first
            try {
                await axios.delete(`${baseURL}/platform-admin/stores/${storeId}`, config);
                showSuccess("Store deleted successfully.");
                fetchData();
            } catch (err: any) {
                if (err.response?.status === 400 && err.response?.data?.detail?.includes("ticket history")) {
                    // 2. If it has history, ask for forced delete
                    const forceDelete = window.confirm(
                        "This store has ticket history and cannot be safely deleted. " +
                        "DANGER: Do you want to FORCIBLY delete this store and ALL associated data (tickets, users, logs)? " +
                        "This CANNOT be undone."
                    );
                    
                    if (forceDelete) {
                        await axios.delete(`${baseURL}/platform-admin/stores/${storeId}?force=true`, config);
                        showSuccess("Store and all associated data purged.");
                        fetchData();
                    }
                } else {
                    throw err;
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to delete store.");
        }
    };

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingStore(true);
        setCreateStoreError(null);
        setError(null);
        
        // Track when creation started
        (window as any).storeCreationStart = Date.now();

        try {
            const token = localStorage.getItem('platformAdminToken');
            
            // Map the frontend state to the Backend's OrganizationWithAdminCreate schema
            const registrationPayload = {
                name: newStore.name,
                industry: newStore.industry,
                org_type: newStore.org_type,
                admin_first_name: newStore.owner_first_name,
                admin_last_name: newStore.owner_last_name,
                admin_email: newStore.owner_email,
                admin_password: newStore.owner_password,
                parent_org_id: null 
            };

            // ⏱️ Add 30 second timeout for store creation
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            try {
                const response = await axios.post(`${baseURL}/register/new-organization`, registrationPayload, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                    timeout: 30000
                });
                console.log("Store creation response:", response.data);
            } finally {
                clearTimeout(timeoutId);
            }

            showSuccess("Store created successfully! Click 'Refresh List' to see the new store.");
            setIsCreateModalOpen(false);
            setNewStore({ 
                name: '', industry: 'Dry Cleaning', org_type: 'full_store',
                address: '', phone: '', 
                owner_first_name: '', owner_last_name: '', owner_email: '', owner_password: '' 
            });
            setIsSubmittingStore(false);

        } catch (err: any) {
            setIsSubmittingStore(false);
            
            // Handle timeout error
            if (err.code === 'ECONNABORTED') {
                setCreateStoreError("Request timed out after 30 seconds. The store creation may still be processing in the background. Please wait a moment and click 'Refresh List' to check if it was created successfully.");
                console.error("Store creation timed out after 30 seconds");
                return;
            }

            console.error("Store creation error:", err.response?.data);
            const errorDetail = err.response?.data?.detail;
            const errorMessage = typeof errorDetail === 'string' ? errorDetail : "Failed to create store. Please check the details and try again.";
            setCreateStoreError(errorMessage);
        }
    };
    
    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    // --- RENDER HELPERS ---

    const renderUserCreationForm = () => (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100 mb-6 animate-in slide-in-from-top-2">
            <h5 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Add New User</h5>
            
            {createUserError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle size={16} /> {createUserError}
                </div>
            )}

            <form onSubmit={handleCreateStoreUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="First Name" className="border p-2 rounded-lg" value={newStoreUser.first_name} onChange={e => setNewStoreUser({...newStoreUser, first_name: e.target.value})} />
                <input required placeholder="Last Name" className="border p-2 rounded-lg" value={newStoreUser.last_name} onChange={e => setNewStoreUser({...newStoreUser, last_name: e.target.value})} />
                <input required type="email" placeholder="Email" className="border p-2 rounded-lg" value={newStoreUser.email} onChange={e => setNewStoreUser({...newStoreUser, email: e.target.value})} />
                <div className="relative">
                    <input 
                        required 
                        type={showNewUserPassword ? "text" : "password"} 
                        placeholder="Password" 
                        className="border p-2 rounded-lg w-full pr-10" 
                        value={newStoreUser.password} 
                        onChange={e => setNewStoreUser({...newStoreUser, password: e.target.value})} 
                    />
                    <button 
                        type="button"
                        onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition"
                    >
                        {showNewUserPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                <input type="tel" placeholder="Phone (Optional)" className="border p-2 rounded-lg" value={newStoreUser.phone} onChange={e => setNewStoreUser({...newStoreUser, phone: e.target.value})} />
                
                <select className="border p-2 rounded-lg bg-white" value={newStoreUser.role} onChange={e => setNewStoreUser({...newStoreUser, role: e.target.value})}>
                    {/* <option value="store_admin">Store Admin</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="operator">Operator</option> */}
                    <option value="cashier">Cashier</option>
                    {/* <option value="driver">Driver</option> */}
                    <option value="customer">Customer</option>
                </select>

                {!currentStoreForUsers && (
                    <select 
                        required
                        className="border p-2 rounded-lg bg-white md:col-span-2"
                        value={newStoreUser.selected_org_id}
                        onChange={e => setNewStoreUser({...newStoreUser, selected_org_id: e.target.value})}
                    >
                        <option value="">-- Select Store --</option>
                        {stores.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                )}
                
                <div className="md:col-span-2 flex justify-end mt-2">
                    <button type="submit" disabled={isSubmittingUser} className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2 disabled:opacity-70">
                        {isSubmittingUser ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create User'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderDashboard = () => (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Platform Overview</h2>
                <div className="text-xs font-medium text-gray-500 bg-white px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2">
                    <Activity size={14} className="text-blue-500" /> Live Platform Metrics
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <DollarSign size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-blue-100 font-medium text-sm">Total Revenue</p>
                        <h3 className="text-3xl font-bold mt-1">${stats?.total_revenue?.toLocaleString() || '0.00'}</h3>
                        <div className="mt-4 flex items-center gap-1.5 text-xs bg-white/20 w-fit px-2 py-1 rounded-full">
                            <Calendar size={12} /> This Month: ${stats?.revenue_this_month?.toLocaleString() || '0.00'}
                        </div>
                    </div>
                </div>

                <div onClick={() => setActiveView('stores')} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-medium text-sm group-hover:text-blue-600 transition-colors">Stores</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.total_stores || 0}</h3>
                            <div className="mt-3 flex items-center gap-3">
                                <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                                    <CheckCircle size={12} /> {stats?.active_stores || 0} Active
                                </span>
                                <span className="text-xs font-medium text-red-400 flex items-center gap-1">
                                    <AlertCircle size={12} /> {stats?.inactive_stores || 0} Inactive
                                </span>
                            </div>
                        </div>
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-blue-100 transition-colors"><Store size={24} /></div>
                    </div>
                </div>

                <div onClick={() => setActiveView('users')} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-medium text-sm group-hover:text-orange-600 transition-colors">Users</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.total_users || 0}</h3>
                            <div className="mt-3 flex items-center gap-3">
                                <span className="text-xs font-medium text-indigo-600">
                                    {stats?.total_staff || 0} Staff
                                </span>
                                <span className="text-xs font-medium text-orange-500">
                                    {stats?.total_customers || 0} Customers
                                </span>
                            </div>
                        </div>
                        <div className="bg-orange-50 text-orange-600 p-2 rounded-lg group-hover:bg-orange-100 transition-colors"><Users size={24} /></div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-medium text-sm">Tickets</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.total_tickets || 0}</h3>
                            <div className="mt-3 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full w-fit">
                                {stats?.tickets_this_month || 0} New This Month
                            </div>
                        </div>
                        <div className="bg-purple-50 text-purple-600 p-2 rounded-lg"><TrendingUp size={24} /></div>
                    </div>
                </div>
            </div>

            {/* Trends Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Platform Growth Trends */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp size={18} className="text-green-500" /> Platform Growth (12m)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Month</th>
                                    <th className="px-6 py-3 text-center">New Stores</th>
                                    <th className="px-6 py-3 text-center">New Users</th>
                                    <th className="px-6 py-3 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {trends.map((t, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-3 font-medium text-gray-700">{t.month}</td>
                                        <td className="px-6 py-3 text-center text-blue-600 font-bold">{t.new_stores > 0 ? `+${t.new_stores}` : '-'}</td>
                                        <td className="px-6 py-3 text-center text-orange-600 font-bold">{t.new_users > 0 ? `+${t.new_users}` : '-'}</td>
                                        <td className="px-6 py-3 text-right font-mono text-emerald-600 font-bold">${t.revenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {trends.length === 0 && (
                                    <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic">No trend data available.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Store Performance 30d */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Activity size={18} className="text-blue-500" /> Store Activity (30d)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Store Name</th>
                                    <th className="px-6 py-3 text-center">Tickets</th>
                                    <th className="px-6 py-3 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {storePerformance.slice(0, 10).map((s, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-gray-800">{s.name}</div>
                                            {!s.is_active && <span className="text-[10px] text-red-400 font-bold uppercase">Inactive</span>}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.ticket_count_last_30_days > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                {s.ticket_count_last_30_days}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono font-bold text-gray-900">${s.revenue_last_30_days.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {storePerformance.length === 0 && (
                                    <tr><td colSpan={3} className="p-10 text-center text-gray-400 italic">No activity recorded.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStores = () => (
        <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Store Financials & Management</h2>
                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={() => fetchData()}
                        disabled={isRefreshing}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isRefreshing ? (
                            <><Loader2 className="animate-spin" size={18} /> Refreshing...</>
                        ) : (
                            <><RefreshCw size={18} /> Refresh List</>
                        )}
                    </button>
                    <button type="button" onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md">
                        <Plus size={18} /> New Store
                    </button>
                </div>
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
                                            <button onClick={() => handleToggleStatus(store)} className={`p-2 rounded-lg transition ${store.is_active ? 'text-gray-600 bg-gray-50 hover:bg-gray-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`} title={store.is_active ? 'Deactivate' : 'Activate'}><Power size={18} /></button>
                                            <button onClick={() => handleDeleteStore(store.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition" title="Delete Store"><Trash2 size={18} /></button>
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
        <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10">
            <div className="flex justify-between items-center flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">All Platform Users</h2>
                <div className="flex items-center gap-3">
                    <div className="bg-white border rounded-lg flex items-center px-3 py-2">
                        <div className="text-xs text-gray-500 mr-2">Total:</div>
                        <div className="font-bold text-gray-800">{users.length}</div>
                    </div>
                    <button 
                        onClick={() => {
                            setCurrentStoreForUsers(null);
                            setIsUserFormOpen(true);
                            setCreateUserError(null);
                            // If we're not in the modal, we need another way to show the form
                            // I'll repurpose the same modal or add a global one.
                            // For now, let's assume we can open a dedicated modal.
                            setIsGlobalUserModalOpen(true);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-md"
                    >
                        <UserPlus size={18} /> Add User
                    </button>
                </div>
            </div>

            {isGlobalUserModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <UserPlus size={20} className="text-indigo-600" /> Create Platform Worker
                            </h3>
                            <button onClick={() => setIsGlobalUserModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <div className="overflow-y-auto p-6">
                            {renderUserCreationForm()}
                        </div>
                    </div>
                </div>
            )}

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

    const renderAuditLogs = () => (
        <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10">
            <div className="flex justify-between items-center flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Platform Audit Logs</h2>
                    <p className="text-sm text-gray-500 mt-1">Track all administrative and system actions across the platform.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => fetchData()} className="p-2 text-gray-500 hover:bg-white rounded-lg border transition shadow-sm bg-gray-50">
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Audit Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Total Logs</h4>
                    <div className="text-2xl font-bold text-gray-900">{auditLogs.length}</div>
                </div>
                {auditSummary.slice(0, 2).map((s, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Top Activity: {s.action}</h4>
                        <div className="text-2xl font-bold text-indigo-600">{s.count} <span className="text-xs text-gray-400 font-normal">at {s.org_name}</span></div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end flex-shrink-0">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Role</label>
                    <select 
                        className="block w-full border rounded-lg p-2 text-sm bg-gray-50"
                        value={auditFilters.actor_role}
                        onChange={e => setAuditFilters({...auditFilters, actor_role: e.target.value})}
                    >
                        <option value="">All Roles</option>
                        <option value="org_owner">Org Owner</option>
                        <option value="store_admin">Store Admin</option>
                        <option value="cashier">Cashier</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Action</label>
                    <input 
                        placeholder="e.g. login"
                        className="block w-full border rounded-lg p-2 text-sm bg-gray-50"
                        value={auditFilters.action}
                        onChange={e => setAuditFilters({...auditFilters, action: e.target.value})}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">From Date</label>
                    <input 
                        type="date"
                        className="block w-full border rounded-lg p-2 text-sm bg-gray-50"
                        value={auditFilters.date_from}
                        onChange={e => setAuditFilters({...auditFilters, date_from: e.target.value})}
                    />
                </div>
                <button 
                    onClick={() => fetchData()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-md"
                >
                    Apply Filters
                </button>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm text-gray-600 relative">
                        <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 bg-gray-50">Timestamp</th>
                                <th className="p-4 bg-gray-50">Actor</th>
                                <th className="p-4 bg-gray-50">Action</th>
                                <th className="p-4 bg-gray-50">Organization</th>
                                <th className="p-4 bg-gray-50">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {auditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 text-xs whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{new Date(log.created_at).toLocaleDateString()}</div>
                                        <div className="text-gray-400">{new Date(log.created_at).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-gray-900">{log.actor_name}</div>
                                        <div className="text-[10px] uppercase font-bold text-indigo-500">{log.actor_role}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold border border-blue-100">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-700">{log.organization_name}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="max-w-xs truncate text-xs text-gray-500" title={JSON.stringify(log.details)}>
                                            {JSON.stringify(log.details)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {auditLogs.length === 0 && (
                                <tr><td colSpan={5} className="p-20 text-center text-gray-400 italic">No audit logs found for the selected filters.</td></tr>
                            )}
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
                        <button onClick={() => { setActiveView('audit-logs'); setSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeView === 'audit-logs' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}><History size={20} className="mr-3" /> Audit Logs</button>
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
                        
                        {isLoading && !stats && activeView === 'dashboard' ? (
                            <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>
                        ) : (
                            activeView === 'dashboard' ? renderDashboard() : 
                            activeView === 'stores' ? renderStores() : 
                            activeView === 'users' ? renderUsers() : 
                            renderAuditLogs()
                        )}
                    </div>
                </div>
            </main>

            {/* Impersonation Overlay */}
            {isImpersonating && (
                <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
                    <Loader2 className="animate-spin mb-4" size={48} />
                    <h3 className="text-xl font-bold">Securely Redirecting...</h3>
                    <p className="text-slate-400 mt-2 text-sm">Authenticating your administrative access to this store.</p>
                </div>
            )}

            {/* --- MODALS --- */}
            
            {/* 1. Create Store Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0"><h3 className="text-lg font-bold text-gray-800">Create New Store</h3><button onClick={() => { setIsCreateModalOpen(false); setCreateStoreError(null); }}><X size={20} className="text-gray-400" /></button></div>
                        <div className="overflow-y-auto p-6">
                            {createStoreError && (
                                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-start gap-3 animate-in fade-in duration-300">
                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                    <div className="text-sm font-medium">{createStoreError}</div>
                                    <button onClick={() => setCreateStoreError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={16}/></button>
                                </div>
                            )}
                            <form onSubmit={handleCreateStore} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase">Organization Details</h4>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Store Name</label>
                                            <input required type="text" className="w-full border rounded-lg p-2" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} placeholder="Store Name" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Industry</label>
                                            <input required type="text" className="w-full border rounded-lg p-2" value={newStore.industry} onChange={e => setNewStore({...newStore, industry: e.target.value})} placeholder="e.g. Dry Cleaning" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Store Type</label>
                                            <select className="w-full border rounded-lg p-2" value={newStore.org_type} onChange={e => setNewStore({...newStore, org_type: e.target.value})}>
                                                <option value="full_store">Full Store</option>
                                                <option value="smart_locker">Smart Locker</option>
                                                <option value="agent_point">Agent Point</option>
                                                <option value="drop_off_only">Drop-off Only</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase">Owner Credentials</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input required type="text" className="w-full border rounded-lg p-2" value={newStore.owner_first_name} onChange={e => setNewStore({...newStore, owner_first_name: e.target.value})} placeholder="First Name" />
                                            <input required type="text" className="w-full border rounded-lg p-2" value={newStore.owner_last_name} onChange={e => setNewStore({...newStore, owner_last_name: e.target.value})} placeholder="Last Name" />
                                        </div>
                                        <input required type="email" className="w-full border rounded-lg p-2" value={newStore.owner_email} onChange={e => setNewStore({...newStore, owner_email: e.target.value})} placeholder="Email" />
                                        <div className="relative">
                                            <input 
                                                required 
                                                type={showOwnerPassword ? "text" : "password"} 
                                                title="Password must be at least 8 characters" 
                                                minLength={8} 
                                                className="w-full border rounded-lg p-2 pr-10" 
                                                value={newStore.owner_password} 
                                                onChange={e => setNewStore({...newStore, owner_password: e.target.value})} 
                                                placeholder="Password (min 8 chars)" 
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition"
                                            >
                                                {showOwnerPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t flex justify-end gap-3">
                                    <button type="button" disabled={isSubmittingStore} onClick={() => { setIsCreateModalOpen(false); setCreateStoreError(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50">Cancel</button>
                                    <button type="submit" disabled={isSubmittingStore} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all">
                                        {isSubmittingStore ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                {isSubmittingStore && Date.now() - (window as any).storeCreationStart > 10000 ? 
                                                    'Creating store... (This may take up to 30 seconds)' : 
                                                    'Initializing Store...'
                                                }
                                            </>
                                        ) : (
                                            'Initialize Store'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
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
                                <button onClick={() => { setIsUserFormOpen(!isUserFormOpen); setCreateUserError(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${isUserFormOpen ? 'bg-gray-200 text-gray-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                    {isUserFormOpen ? <><X size={16}/> Cancel</> : <><UserPlus size={16}/> Add User</>}
                                </button>
                            </div>
                            {isUserFormOpen && renderUserCreationForm()}

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {isFetchingStoreUsers ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                        <Loader2 className="animate-spin mb-3 text-indigo-600" size={32} />
                                        <p className="text-sm">Fetching store users...</p>
                                    </div>
                                ) : (
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
                                )}
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
                                        {/* <option value="store_admin">Store Admin</option>
                                        <option value="store_manager">Store Manager</option>
                                        <option value="operator">Operator</option> */}
                                        <option value="cashier">Cashier</option>
                                        {/* <option value="driver">Driver</option> */}
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