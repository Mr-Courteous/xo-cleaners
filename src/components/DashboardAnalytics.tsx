import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  Calendar, 
  ShoppingBag, 
  CheckCircle, 
  Users, 
  TrendingUp,
  Package,
  Clock
} from 'lucide-react';
import baseURL from '../lib/config'; // Adjust path if needed

// Interface matching the Python response model
interface DashboardMetrics {
  today_sales: number;
  month_sales: number;
  active_tickets: number;
  ready_tickets: number;
  picked_up_today: number;
  total_customers: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export default function DashboardAnalytics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/organizations/analytics/dashboard`, getAuthHeaders());
      setMetrics(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load dashboard data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>{error}</p>
        <button onClick={fetchAnalytics} className="mt-4 text-blue-600 underline">Try Again</button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b pb-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Store Overview</h2>
          <p className="text-gray-500 mt-1">Real-time metrics for your business</p>
        </div>
        <button 
          onClick={fetchAnalytics} 
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Top Row: Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Sales */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2 opacity-90">
                <div className="p-2 bg-white/20 rounded-lg"><DollarSign size={20} /></div>
                <span className="font-medium">Today's Revenue</span>
              </div>
              <div className="text-4xl font-bold">
                ${metrics?.today_sales.toFixed(2)}
              </div>
              <div className="mt-2 text-blue-100 text-sm">
                Generated today so far
              </div>
           </div>
           <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
        </div>

        {/* Month Sales */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2 text-gray-500">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Calendar size={20} /></div>
                <span className="font-medium">This Month</span>
              </div>
              <div className="text-4xl font-bold text-gray-800">
                ${metrics?.month_sales.toFixed(2)}
              </div>
              <div className="mt-2 text-green-600 text-sm font-medium flex items-center">
                 <TrendingUp size={14} className="mr-1" /> Month to date revenue
              </div>
           </div>
        </div>
      </div>

      {/* Middle Row: Ticket Operations */}
      <h3 className="text-lg font-bold text-gray-700 mt-8 mb-4">Operations</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Tickets */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
                <ShoppingBag size={20} />
              </div>
              <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-600">Active</span>
           </div>
           <div className="text-3xl font-bold text-gray-900">{metrics?.active_tickets}</div>
           <div className="text-sm text-gray-500 mt-1">Tickets in progress</div>
        </div>

        {/* Ready for Pickup */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Package size={20} />
              </div>
              <span className="text-xs font-bold bg-green-100 px-2 py-1 rounded-full text-green-700">Ready</span>
           </div>
           <div className="text-3xl font-bold text-gray-900">{metrics?.ready_tickets}</div>
           <div className="text-sm text-gray-500 mt-1">Waiting on rack</div>
        </div>

        {/* Picked Up Today */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <CheckCircle size={20} />
              </div>
              <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-600">Today</span>
           </div>
           <div className="text-3xl font-bold text-gray-900">{metrics?.picked_up_today}</div>
           <div className="text-sm text-gray-500 mt-1">Completed pick ups</div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                <Users size={20} />
              </div>
           </div>
           <div className="text-3xl font-bold text-gray-900">{metrics?.total_customers}</div>
           <div className="text-sm text-gray-500 mt-1">Total customer base</div>
        </div>
      </div>
    </div>
  );
}