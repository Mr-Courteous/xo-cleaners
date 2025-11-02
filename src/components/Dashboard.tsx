// import React, { useMemo } from 'react';
// import { Package, Clock, CheckCircle, MapPin, Users, User } from 'lucide-react';
// import { useApi } from '../hooks/useApi';
// Imported role-specific components (used as placeholders for other roles)
// import CashierAssociate from './CashierAssociate';
// import DriverAgent from './DriverAgent';
// import StoreAdmin from './StoreAdmin';
import React, { useMemo } from 'react';
import { Package, Clock, CheckCircle, MapPin, Users, User } from 'lucide-react';
import { useApi } from '../hooks/useApi';
// Imported role-specific components (used as placeholders for other roles)
import CashierAssociate from './CashierAssociate';
import DriverAgent from './DriverAgent';
import StoreAdmin from './StoreAdmin';
import StoreManager from './StoreManager';
import StoreOwner from './StoreOwner';
import LaundryStaff from './LaundryStaff';


// --- Interface Definitions ---
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

// Helper function to capitalize a string (e.g., 'store_owner' -> 'Store Owner')
const formatRole = (role?: string) => {
    if (!role) return '';
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}


// 🎯 MODIFIED: ADD onViewChange to props
interface DashboardStatViewProps {
    stats: DashboardStats | undefined;
    loading: boolean;
    onViewChange: (view: string) => void; // 🎯 New required prop
}

const DashboardStatView: React.FC<DashboardStatViewProps> = ({ stats, loading, onViewChange }) => { // 🎯 Destructure onViewChange
    
    // Show loading state if data is not available
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
    
    const statCards = [
        // ... (Stat Card definitions remain the same)
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
        <>
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

            {/* Quick Actions - NOW FUNCTIONAL */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 🎯 Added onClick and cursor-pointer for Drop-Off */}
                    <div 
                        onClick={() => onViewChange('dropoff')}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <h4 className="font-medium text-gray-900">Process New Drop-off</h4>
                        <p className="text-sm text-gray-600">Create a new ticket for customer clothes</p>
                    </div>
                    {/* 🎯 Added onClick and cursor-pointer for Pick Up */}
                    <div 
                        onClick={() => onViewChange('pickup')}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <h4 className="font-medium text-gray-900">Handle Pickup</h4>
                        <p className="text-sm text-gray-600">Search and process customer pickups</p>
                    </div>
                </div>
            </div>
        </>
    );
}

// --- Dashboard Component (The main export) ---

// 🎯 MODIFIED: Accept onViewChange prop
export default function Dashboard({ onViewChange }: { onViewChange: (view: string) => void }) {
  
  // 1. READ ROLE FROM LOCAL STORAGE 
  const userRole = useMemo(() => localStorage.getItem('user_role'), []);

  // 2. API call to fetch general dashboard stats
  const { data: stats, loading } = useApi<DashboardStats>('/dashboard/stats');
  
  // Destructure admin_info for cleaner access
  const admin_info = stats?.admin_info; 

  // --- Role-Based Component Rendering ---
  const renderRoleComponent = (role: string) => {
    // Note: The role components must be updated to accept stats, loading, AND onViewChange
    switch (role.toLowerCase()) {
      case 'admin':
        // 🎯 Pass onViewChange
        return <DashboardStatView stats={stats} loading={loading} onViewChange={onViewChange} />;
      case 'store_owner':
        // 🎯 Pass onViewChange
        return <StoreOwner stats={stats} loading={loading} onViewChange={onViewChange} />;
      case 'store_manager':
        // 🎯 Pass onViewChange
        return <StoreManager stats={stats} loading={loading} onViewChange={onViewChange} />;
      case 'cashier':
        // 🎯 Pass onViewChange (already used in CashierAssociate.tsx)
        return <CashierAssociate onViewChange={onViewChange} stats={stats} loading={loading} />;
      case 'driver_agent':
        // 🎯 Pass onViewChange
        return <DriverAgent stats={stats} loading={loading} onViewChange={onViewChange} />;
      case 'laundry_staff':
        // 🎯 Pass onViewChange
        return <LaundryStaff stats={stats} loading={loading} onViewChange={onViewChange} />;
      case 'store_admin':
        // 🎯 Pass onViewChange
        return <StoreAdmin stats={stats} loading={loading} onViewChange={onViewChange} />;
      default:
        return (
          <div className="text-center p-8 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-red-600">Access Denied</h3>
            <p className="text-gray-600">The role '{formatRole(role)}' does not have a defined dashboard view.</p>
          </div>
        );
    }
  };

  // --- Fallback/Error UI ---
  if (!userRole) {
    return (
      <div className="text-center p-12 bg-white rounded-lg shadow-xl">
        <h3 className="text-2xl font-bold text-red-700">Authentication Error</h3>
        <p className="text-gray-700 mt-4">User role not found in local storage. Please log in again.</p>
      </div>
    );
  }
  
  // --- Standard Dashboard UI with Dynamic Content ---
  return (
    <div>
      {/* Header section with user info */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600">Monitor your dry cleaning operations</p>
        </div>
        
        {/* User Info Display (Uncommented block from your original file) */}
         {admin_info && (
          <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center space-x-3">
            <User className="h-5 w-5 text-blue-600" />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{admin_info.username}</p>
              <p className="text-xs text-gray-500">{admin_info.email}</p>
              {/* Note: Role will show on Layout.tsx header, but if you want it here, ensure admin_info has the role field */}
            </div>
          </div>
        )}
      </div>
      
      {/* 🎯 Main Role-Specific Content */}
      {renderRoleComponent(userRole)}
    </div>
  );
}