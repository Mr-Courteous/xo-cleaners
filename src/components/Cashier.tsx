import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, Clock, CheckCircle, MapPin, Users, CreditCard, FileText, RefreshCw, Tag, 
  Mail, User, DollarSign, AlertCircle 
} from 'lucide-react';
import Header from './Header';
import baseURL from '../lib/config';
import DropOff from './DropOff';
import PickUp from './PickUp';

export default function CashierDashboard() {
  const [currentView, setCurrentView] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Dynamic stats from backend ---
  const [stats, setStats] = useState({
    total_tickets: 0,
    pending_pickup: 0,
    in_process: 0,
    occupied_racks: 0,
    available_racks: 0,
  });

  // --- Fetch racks for the logged-in organization ---
  useEffect(() => {
    const fetchRacks = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("accessToken");
        const organizationId = localStorage.getItem("organizationId");

        if (!token) throw new Error("Access token missing");
        if (!organizationId) throw new Error("Organization ID missing");

        const response = await axios.get(
          `${baseURL}/api/organizations/${organizationId}/racks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const racks = response.data?.racks || [];
        const occupied = racks.filter((r: any) => r.is_occupied).length;
        const available = racks.length - occupied;

        setStats(prev => ({
          ...prev,
          occupied_racks: occupied,
          available_racks: available,
        }));
      } catch (err: any) {
        console.error("Error fetching racks:", err);
        setError(err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRacks();
  }, []);

  const statCards = [
    { title: 'Total Tickets', value: stats.total_tickets, icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Ready for Pickup', value: stats.pending_pickup, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'In Process', value: stats.in_process, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { title: 'Occupied Racks', value: stats.occupied_racks, icon: MapPin, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Available Racks', value: stats.available_racks, icon: Users, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  ];

  const features = [
    { id: 'new-customer', title: 'Create Customer Profile', icon: User },
    { id: 'collect-payment', title: 'Collect/Process Payment', icon: CreditCard },
    { id: 'void-ticket', title: 'Void Ticket', icon: RefreshCw },
    { id: 'refund', title: 'Process Refund', icon: DollarSign },
    { id: 'apply-promo', title: 'Apply Promo/Discount', icon: Tag },
    { id: 'order-history', title: 'Search/View Order History', icon: FileText },
    { id: 'reprint-receipt', title: 'Reprint/Email Receipt', icon: Mail },
    { id: 'update-contact', title: 'Update Customer Details', icon: User },
    { id: 'transfer-ticket', title: 'Transfer Ticket to Another Store', icon: MapPin },
    { id: 'missed-pickups', title: 'Manage Missed Pickups/Reschedules', icon: Clock },
    { id: 'complaints', title: 'Log Complaints/Resolutions', icon: AlertCircle },
    { id: 'notifications', title: 'Send Notifications/Reminders', icon: Mail },
    { id: 'petty-cash', title: 'Manage Petty Cash/End-of-Day', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* --- View Buttons --- */}
        <div className="flex space-x-4 mb-4">
          {['overview', 'dropoff', 'pickup'].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-4 py-2 rounded-md font-medium ${
                currentView === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        {/* --- Loading & Error States --- */}
        {loading && <p className="text-gray-500">Loading rack data...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {/* --- Overview --- */}
        {!loading && currentView === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className={`${card.bgColor} p-3 rounded-lg`}>
                        <Icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    onClick={() => setCurrentView(feature.id)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
                  >
                    <Icon className="h-6 w-6 text-blue-600" />
                    <span className="font-medium text-gray-900">{feature.title}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* --- Drop-off --- */}
        {currentView === 'dropoff' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <DropOff />
          </div>
        )}

        {/* --- Pick-up --- */}
        {currentView === 'pickup' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <PickUp />
          </div>
        )}
      </div>
    </div>
  );
}
