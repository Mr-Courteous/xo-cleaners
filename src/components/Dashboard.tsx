import React from 'react';
import { Package, Clock, CheckCircle, MapPin, Users, User } from 'lucide-react';
import { useApi } from '../hooks/useApi';

// ⚠️ ASSUMED: Define or import the DashboardStats type from '../types'.
// Ensure this type reflects the backend change to include admin_info.
// Example content for '../types.ts':
/*
interface AdminInfo {
  username: string;
  email: string;
}
export interface DashboardStats {
  total_tickets: number;
  pending_pickup: number;
  in_process: number;
  occupied_racks: number;
  available_racks: number;
  admin_info: AdminInfo; // 🎯 New field
}
*/
interface AdminInfo {
  username: string;
  email: string;
}

interface DashboardStats {
  total_tickets: number;
  pending_pickup: number;
  in_process: number;
  occupied_racks: number;
  available_racks: number;
  admin_info: AdminInfo;
}

export default function Dashboard() {
  // 🎯 Single API call to fetch both stats and user info
  const { data: stats, loading } = useApi<DashboardStats>('/dashboard/stats');
  
  if (loading || !stats) { 
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  // Destructure admin_info for cleaner access
  const { admin_info } = stats; 

  const statCards = [
    {
      title: 'Total Tickets',
      value: stats.total_tickets,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Ready for Pickup',
      value: stats.pending_pickup,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'In Process',
      value: stats.in_process,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Occupied Racks',
      value: stats.occupied_racks,
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Available Racks',
      value: stats.available_racks,
      icon: Users,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  return (
    <div>
      {/* Header section with user info */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600">Monitor your dry cleaning operations</p>
        </div>
        
        {/* 🎯 User Info Display */}
        {/* {admin_info && (
          <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center space-x-3">
            <User className="h-5 w-5 text-blue-600" />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{admin_info.username}</p>
              <p className="text-xs text-gray-500">{admin_info.email}</p>
            </div>
          </div>
        )} */}
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
      
      {/* Quick Actions */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-gray-900">Process New Drop-off</h4>
            <p className="text-sm text-gray-600">Create a new ticket for customer clothes</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-gray-900">Handle Pickup</h4>
            <p className="text-sm text-gray-600">Search and process customer pickups</p>
          </div>
        </div>
      </div>
    </div>
  );
}