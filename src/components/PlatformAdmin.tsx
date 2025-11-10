import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Settings, LineChart, X, Edit3, Trash2, LogOut, RefreshCw
} from 'lucide-react';
import Header from './Header';
import baseUrl from '../lib/config';

interface PlatformAdminProps {
    onBackToHome?: () => void;
}

interface AdminLoginForm {
    email: string;
    password: string;
}

export default function PlatformAdmin({ onBackToHome }: PlatformAdminProps) {
    const [loggedIn, setLoggedIn] = useState(false);
    const [admin, setAdmin] = useState<{ email: string; role: string } | null>(null);
    const [loginForm, setLoginForm] = useState<AdminLoginForm>({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [stats, setStats] = useState({
        totalStores: 0,
        activeUsers: 0,
        ytdRevenue: '0',
        openSupportTickets: 0,
    });

    const [orgList, setOrgList] = useState<any[]>([]);
    const [userList, setUserList] = useState<any[]>([]);
    const [modalType, setModalType] = useState<'orgs' | 'users' | null>(null);

    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [refreshing, setRefreshing] = useState(false);

    // Logout handler (kept for error handling)
    const handleLogout = useCallback(() => {
        localStorage.removeItem('platformAdminToken');
        localStorage.removeItem('platformAdminRole');
        localStorage.removeItem('platformAdminEmail');
        setAdmin(null);
        setLoggedIn(false);
        setError('Session expired or unauthorized. Please log in again.');
    }, []);

    // Restore login state if token exists
    useEffect(() => {
        const token = localStorage.getItem('platformAdminToken');
        const role = localStorage.getItem('platformAdminRole');
        const email = localStorage.getItem('platformAdminEmail');
        if (token && role && email) {
            setAdmin({ email, role });
            setLoggedIn(true);
        }
    }, []);

    // Fetch platform data (orgs + users)
    const fetchPlatformData = useCallback(async () => {
        const token = localStorage.getItem('platformAdminToken');
        if (!token) return;

        try {
            setRefreshing(true);
            const [orgRes, userRes] = await Promise.all([
                axios.get(`${baseUrl}/organizations/all`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${baseUrl}/all-users`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setStats({
                totalStores: orgRes.data.total_organizations || 0,
                activeUsers: userRes.data.total_users || 0,
                ytdRevenue: '1.2M',
                openSupportTickets: 45,
            });

            setOrgList(orgRes.data.organizations || []);
            setUserList(userRes.data.users || []);
        } catch (err: any) {
            console.error('Error fetching platform stats:', err);
            if (err.response && err.response.status === 401) handleLogout();
        } finally {
            setRefreshing(false);
        }
    }, [handleLogout]);

    useEffect(() => {
        if (loggedIn) fetchPlatformData();
    }, [loggedIn, fetchPlatformData]);

    // Login handler
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${baseUrl}/token/admin-login`, loginForm);
            const { access_token, admin_role, email } = res.data;

            localStorage.setItem('platformAdminToken', access_token);
            localStorage.setItem('userRole', admin_role);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('platformAdminRole', admin_role);

            setAdmin({ email, role: admin_role });
            setLoggedIn(true);
            setLoginForm({ email: '', password: '' });
            setError('');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Login failed. Check credentials.');
            handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (type: 'orgs' | 'users') => setModalType(type);
    const handleCloseModal = () => {
        setModalType(null);
        setEditingItemId(null);
    };

    const startEdit = (item: any) => {
        setEditingItemId(item.id);
        setEditForm({ ...item });
    };

    const cancelEdit = () => setEditingItemId(null);

    const saveEdit = async (id: number) => {
        const token = localStorage.getItem('platformAdminToken');
        const url =
            modalType === 'users'
                ? `${baseUrl}/users/${id}`
                : `${baseUrl}/organizations/${id}`;

        try {
            await axios.put(url, editForm, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (modalType === 'users') {
                setUserList((prev) => prev.map((u) => (u.id === id ? { ...u, ...editForm } : u)));
            } else {
                setOrgList((prev) => prev.map((o) => (o.id === id ? { ...o, ...editForm } : o)));
            }

            setEditingItemId(null);
        } catch (err: any) {
            console.error('Error saving changes:', err);
            if (err.response && err.response.status === 401) handleLogout();
        }
    };

    const deleteItem = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;

        const token = localStorage.getItem('platformAdminToken');
        const url =
            modalType === 'users'
                ? `${baseUrl}/users/${id}`
                : `${baseUrl}/organizations/${id}`;

        try {
            await axios.delete(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (modalType === 'users') {
                setUserList((prev) => prev.filter((u) => u.id !== id));
            } else {
                setOrgList((prev) => prev.filter((o) => o.id !== id));
            }
        } catch (err: any) {
            console.error('Error deleting record:', err);
            if (err.response && err.response.status === 401) handleLogout();
        }
    };

    // ===== MAIN RENDER =====
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header onBackToHome={onBackToHome} />

            {!loggedIn ? (
                // ===== LOGIN SCREEN =====
                <div className="flex-grow flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Admin Login</h2>
                        {error && <p className="text-red-600 mb-4 font-medium p-2 bg-red-50 rounded-lg">{error}</p>}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input
                                type="email"
                                placeholder="Email"
                                value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                // ===== MAIN DASHBOARD =====
                <>
                    <div className="max-w-screen-xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-4xl font-extrabold text-gray-900">Platform Admin Portal</h2>
                            {/* Logout button removed from here */}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                                <h3 className="text-xl font-semibold mb-4 flex items-center">
                                    <Settings className="h-5 w-5 mr-2 text-blue-600" /> Global Configuration
                                </h3>
                                <p className="text-gray-600">Manage global pricing, templates, and organization settings.</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                                <h3 className="text-xl font-semibold mb-4 flex items-center">
                                    <LineChart className="h-5 w-5 mr-2 text-purple-600" /> Platform Monitoring
                                </h3>
                                <ul className="text-sm space-y-2">
                                    <li
                                        onClick={() => handleOpenModal('orgs')}
                                        className="flex justify-between py-1 border-b cursor-pointer hover:bg-gray-100 rounded px-2 -mx-2 transition-colors"
                                    >
                                        <span>Total Stores:</span> <span className="font-bold">{stats.totalStores}</span>
                                    </li>
                                    <li
                                        onClick={() => handleOpenModal('users')}
                                        className="flex justify-between py-1 border-b cursor-pointer hover:bg-gray-100 rounded px-2 -mx-2 transition-colors"
                                    >
                                        <span>Active Users:</span> <span className="font-bold">{stats.activeUsers}</span>
                                    </li>
                                    <li className="flex justify-between py-1 border-b text-gray-500">
                                        <span>YTD Revenue:</span> <span className="font-bold">{stats.ytdRevenue}</span>
                                    </li>
                                    <li className="flex justify-between py-1 text-gray-500">
                                        <span>Open Tickets:</span> <span className="font-bold">{stats.openSupportTickets}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* ===== MODAL ===== */}
                    {modalType && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
                                <button
                                    onClick={handleCloseModal}
                                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>

                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold">
                                        {modalType === 'orgs' ? 'All Organizations' : 'All Users'}
                                    </h3>
                                    <button
                                        onClick={fetchPlatformData}
                                        disabled={refreshing}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-60"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                        {refreshing ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-200 text-sm">
                                        <thead className="bg-gray-100 sticky top-0">
                                            <tr>
                                                {modalType === 'orgs' ? (
                                                    <>
                                                        <th className="px-3 py-3 text-left font-semibold">Name</th>
                                                        <th className="px-3 py-3 text-left font-semibold">Industry</th>
                                                        <th className="px-3 py-3 text-left font-semibold">Created</th>
                                                        <th className="px-3 py-3 text-left font-semibold">Actions</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="px-3 py-3 text-left font-semibold">First Name</th>
                                                        <th className="px-3 py-3 text-left font-semibold">Last Name</th>
                                                        <th className="px-3 py-3 text-left font-semibold">Email</th>
                                                        <th className="px-3 py-3 text-left font-semibold">Role</th>
                                                        <th className="px-3 py-3 text-left font-semibold">Actions</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(modalType === 'orgs' ? orgList : userList).map((item) => (
                                                <tr key={item.id} className="border-t hover:bg-gray-50">
                                                    {editingItemId === item.id ? (
                                                        <>
                                                            {modalType === 'orgs' ? (
                                                                <>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.name || ''}
                                                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                                            className="border px-2 py-1 rounded w-full"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.industry || ''}
                                                                            onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                                                                            className="border px-2 py-1 rounded w-full"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2 text-gray-500">
                                                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.first_name || ''}
                                                                            onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                                                            className="border px-2 py-1 rounded w-full"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.last_name || ''}
                                                                            onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                                                            className="border px-2 py-1 rounded w-full"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="email"
                                                                            value={editForm.email || ''}
                                                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                                            className="border px-2 py-1 rounded w-full"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.role || ''}
                                                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                                            className="border px-2 py-1 rounded w-full"
                                                                        />
                                                                    </td>
                                                                </>
                                                            )}
                                                            <td className="px-3 py-2 flex gap-2">
                                                                <button
                                                                    onClick={() => saveEdit(item.id)}
                                                                    className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors text-xs"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={cancelEdit}
                                                                    className="bg-gray-300 px-2 py-1 rounded hover:bg-gray-400 transition-colors text-xs"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {modalType === 'orgs' ? (
                                                                <>
                                                                    <td className="px-3 py-2 font-medium">{item.name}</td>
                                                                    <td className="px-3 py-2 text-gray-600">{item.industry}</td>
                                                                    <td className="px-3 py-2 text-gray-500">
                                                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td className="px-3 py-2 font-medium">{item.first_name}</td>
                                                                    <td className="px-3 py-2 font-medium">{item.last_name}</td>
                                                                    <td className="px-3 py-2 text-gray-600">{item.email}</td>
                                                                    <td className="px-3 py-2 text-sm text-blue-600 font-semibold">{item.role}</td>
                                                                </>
                                                            )}
                                                            <td className="px-3 py-2 flex gap-2">
                                                                <button
                                                                    onClick={() => startEdit(item)}
                                                                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 flex items-center gap-1 text-xs"
                                                                >
                                                                    <Edit3 className="w-3 h-3" /> Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteItem(item.id)}
                                                                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center gap-1 text-xs"
                                                                >
                                                                    <Trash2 className="w-3 h-3" /> Delete
                                                                </button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}