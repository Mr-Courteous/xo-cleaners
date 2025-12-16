import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Clock, 
  CreditCard, 
  User, 
  Gift, 
  LogOut, 
  Menu, 
  X, 
  Plus, 
  MapPin, 
  Star,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

import baseURL from '../lib/config';
import Header from './Header'; // --- Integrated Header ---

// --- TYPES ---
interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  loyalty_points: number;
  referral_code: string;
  marketing_opt_in: boolean;
  is_paused: boolean;
}

interface Ticket {
  id: number;
  ticket_number: string;
  status: string;
  created_at: string;
  pickup_date: string | null;
  total_amount: number;
  paid_amount: number;
  balance: number;
}

// --- SUB-COMPONENTS (Views) ---

// 1. OVERVIEW
const DashboardOverview = ({ profile, tickets, onViewChange }: { profile: UserProfile | null, tickets: Ticket[], onViewChange: (view: string) => void }) => {
  const activeTickets = tickets.filter(t => !['picked_up', 'cancelled', 'refunded'].includes(t.status));
  const recentTicket = tickets[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {profile?.first_name || 'Guest'}!</h2>
        <p className="text-blue-100 mb-6">You have {profile?.loyalty_points || 0} loyalty points available.</p>
        
        <div className="flex gap-3">
          <button onClick={() => onViewChange('pickup')} className="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2">
            <Clock size={18} /> Schedule Pickup
          </button>
          <button onClick={() => onViewChange('orders')} className="bg-blue-500 bg-opacity-30 text-white border border-blue-400 px-4 py-2 rounded-lg font-semibold hover:bg-opacity-40 transition-colors">
            View Active Orders
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">Active Orders</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{activeTickets.length}</h3>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <ShoppingBag size={20} />
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">Loyalty Points</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{profile?.loyalty_points || 0}</h3>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                    <Star size={20} />
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">Account Status</p>
                    <h3 className={`text-xl font-bold mt-1 ${profile?.is_paused ? 'text-amber-600' : 'text-green-600'}`}>
                        {profile?.is_paused ? 'Paused' : 'Active'}
                    </h3>
                </div>
                <div className={`p-2 rounded-lg ${profile?.is_paused ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                    <CheckCircle size={20} />
                </div>
            </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Recent Order</h3>
            <button onClick={() => onViewChange('orders')} className="text-sm text-blue-600 hover:text-blue-700">View All</button>
        </div>
        <div className="p-5">
            {recentTicket ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-full border border-gray-200 shadow-sm">
                            <ShoppingBag size={24} className="text-gray-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Order #{recentTicket.ticket_number}</p>
                            <p className="text-sm text-gray-500">{new Date(recentTicket.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {recentTicket.status.replace('_', ' ')}
                        </span>
                        <p className="text-sm font-semibold mt-1">${recentTicket.total_amount.toFixed(2)}</p>
                    </div>
                </div>
            ) : (
                <p className="text-gray-500 text-center py-4">No recent orders found.</p>
            )}
        </div>
      </div>
    </div>
  );
};

// 2. ORDERS LIST
const MyOrders = ({ tickets }: { tickets: Ticket[] }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">My Orders</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-900 font-medium border-b">
                        <tr>
                            <th className="p-4">Ticket #</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Total</th>
                            <th className="p-4">Balance</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tickets.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-semibold text-gray-900">{t.ticket_number}</td>
                                <td className="p-4">{new Date(t.created_at).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize 
                                        ${t.status === 'ready' ? 'bg-green-100 text-green-700' : 
                                          t.status === 'picked_up' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                                        {t.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-4">${t.total_amount.toFixed(2)}</td>
                                <td className={`p-4 font-medium ${t.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ${t.balance.toFixed(2)}
                                </td>
                                <td className="p-4">
                                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50">
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {tickets.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    No orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// 3. SCHEDULE PICKUP
const SchedulePickup = ({ addresses, onSchedule }: { addresses: any[], onSchedule: (data: any) => Promise<void> }) => {
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSchedule({ 
                pickup_date: date, 
                address_id: addresses[0]?.id || 1, 
                notes 
            });
            setDate('');
            setNotes('');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                    <Clock size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Schedule a Pickup</h2>
                    <p className="text-gray-500 text-sm">We'll come to you based on your preferences.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date & Time</label>
                    <input 
                        type="datetime-local" 
                        required
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Address</label>
                    <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-white">
                        {addresses.length > 0 ? (
                            addresses.map((a: any, i: number) => <option key={i} value={a.id}>{a.street}, {a.city}</option>)
                        ) : (
                            <option value="1">Home (Default)</option>
                        )}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                    <textarea 
                        rows={3}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                        placeholder="Gate code, specific door, etc."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Confirm Pickup Request'}
                </button>
            </form>
        </div>
    );
};

// 4. PROFILE SETTINGS
const ProfileSettings = ({ profile, onUpdate }: { profile: UserProfile, onUpdate: (data: any) => Promise<void> }) => {
    const [formData, setFormData] = useState({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        address: profile.address,
        is_paused: profile.is_paused
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onUpdate(formData);
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input name="first_name" value={formData.first_name} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input name="last_name" value={formData.last_name} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read Only)</label>
                        <input value={profile.email} disabled className="w-full p-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Default Address</label>
                        <input name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <div className="pt-0.5"><AlertCircle className="text-amber-600 w-5 h-5" /></div>
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-amber-800">Vacation Mode</h4>
                        <p className="text-xs text-amber-700 mt-1">Pause your account to stop recurring pickups while you are away.</p>
                    </div>
                    <div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="is_paused" checked={formData.is_paused} onChange={handleChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// --- MAIN COMPONENT ---

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false); // New Auth State
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- SECURITY & DATA FETCHING ---
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. GET CREDENTIALS
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');

      // 2. SECURITY CHECK
      // Check if role includes 'customer' (case insensitive just to be safe)
      if (!token || userRole?.toLowerCase() !== 'customer') {
          console.warn("Unauthorized access attempt or invalid role");
          navigate('/customer-login');
          return;
      }

      // If we pass checks, allow rendering
      setAuthorized(true);

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // 3. PARALLEL DATA FETCH
      const [profileRes, ticketsRes] = await Promise.all([
         axios.get(`${baseURL}/api/customer/profile`, config),
         axios.get(`${baseURL}/api/customer/tickets`, config)
      ]);

      setProfile(profileRes.data);
      setTickets(ticketsRes.data);
    
    } catch (err: any) {
      console.error("Failed to load dashboard data", err);
      
      // 4. HANDLE 401 UNAUTHORIZED (Token Expired)
      if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('role');
          navigate('/customer-login');
      } else {
          setError(err.response?.data?.detail || "Failed to load your profile information.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Initial Load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- HANDLERS ---
  const handleSchedulePickup = async (data: any) => {
    try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        await axios.post(`${baseURL}/api/customer/pickups`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMsg("Pickup scheduled successfully!");
        setActiveTab('dashboard');
        setTimeout(() => setSuccessMsg(null), 3000);
        // Refresh data
        fetchDashboardData();
    } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to schedule pickup");
        setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateProfile = async (data: any) => {
    try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        await axios.patch(`${baseURL}/api/customer/profile`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setProfile({ ...profile!, ...data });
        setSuccessMsg("Profile updated successfully!");
        setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
        setError("Failed to update profile.");
        setTimeout(() => setError(null), 3000);
    }
  };

  // Nav Items Configuration
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'pickup', label: 'Schedule Pickup', icon: Clock },
    { id: 'wallet', label: 'Wallet & Pay', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'rewards', label: 'Rewards', icon: Gift },
  ];

  // Render Content Switch
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview profile={profile} tickets={tickets} onViewChange={setActiveTab} />;
      case 'orders':
        return <MyOrders tickets={tickets} />;
      case 'pickup':
        return <SchedulePickup addresses={profile?.address ? [{id: 1, street: profile.address, city: ''}] : []} onSchedule={handleSchedulePickup} />;
      case 'profile':
        return profile ? <ProfileSettings profile={profile} onUpdate={handleUpdateProfile} /> : null;
      case 'wallet':
        return (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 animate-in zoom-in-95">
                <div className="bg-gray-100 p-4 rounded-full inline-block mb-4"><CreditCard size={32} className="text-gray-400" /></div>
                <h3 className="text-xl font-bold text-gray-900">Wallet</h3>
                <p className="text-gray-500 mt-2">Manage your saved cards and payment history here.</p>
                <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Add Payment Method</button>
            </div>
        );
      case 'rewards':
        return (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 animate-in zoom-in-95">
                <div className="bg-purple-100 p-4 rounded-full inline-block mb-4"><Gift size={32} className="text-purple-500" /></div>
                <h3 className="text-xl font-bold text-gray-900">Referral Rewards</h3>
                <p className="text-gray-500 mt-2">Share your code: <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">{profile?.referral_code || 'LOADING'}</span></p>
                <p className="text-sm text-gray-400 mt-1">Earn points for every friend who joins!</p>
            </div>
        );
      default:
        return <DashboardOverview profile={profile} tickets={tickets} onViewChange={setActiveTab} />;
    }
  };

  // --- RENDERING GUARDS ---
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  if (!authorized) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* 1. TOP HEADER (Replaces old Sidebar Header for Desktop) */}
      <Header /> 

      <div className="flex flex-1 overflow-hidden">
        {/* 2. SIDEBAR - Desktop */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto mt-20 lg:mt-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-full flex flex-col pt-4 lg:pt-6">
            
            {/* Mobile-only Close Button inside sidebar */}
            <div className="px-4 pb-4 lg:hidden flex justify-between items-center">
                <span className="font-bold text-gray-900">Menu</span>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-500">
                    <X size={24} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={20} className={`mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.label}
                    {isActive && <ChevronRight size={16} className="ml-auto text-blue-400" />}
                  </button>
                );
              })}
            </nav>

            {/* User Footer (Optional now since Header has logout, but good for mobile) */}
            <div className="p-4 border-t border-gray-100 lg:hidden">
               <div className="flex items-center p-3 rounded-xl bg-gray-50 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      {profile?.first_name?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-3 overflow-hidden">
                      <p className="text-sm font-medium text-gray-900 truncate">{profile?.first_name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{profile?.email || 'loading...'}</p>
                  </div>
               </div>
            </div>
          </div>
        </aside>

        {/* OVERLAY for Mobile Sidebar */}
        {sidebarOpen && (
          <div 
              className="fixed inset-0 bg-gray-900/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
              onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 3. MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
          {/* Mobile Sub-Header for Menu Toggle */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
              <span className="font-bold text-gray-700 capitalize">{activeTab.replace('-', ' ')}</span>
              <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Menu size={24} />
              </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-5xl mx-auto">
                  
                  {/* Global Messages */}
                  {successMsg && (
                      <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 flex items-center gap-3 animate-in slide-in-from-top-2">
                          <CheckCircle size={20} /> {successMsg}
                      </div>
                  )}
                  {error && (
                      <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-center gap-3 animate-in slide-in-from-top-2">
                          <AlertCircle size={20} /> {error}
                      </div>
                  )}

                  {/* Main View Render */}
                  {renderContent()}
              </div>
          </div>
        </main>
      </div>

    </div>
  );
}