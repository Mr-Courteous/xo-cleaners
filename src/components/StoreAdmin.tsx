import React, { useMemo } from 'react';
import { Settings, Users, Tag, Clock, FileText, LayoutDashboard, Printer, Gift, MessageSquare, Package, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { useApi } from '../hooks/useApi'; // Assuming this hook exists based on other files

// --- Interface Definitions (Copied from Dashboard.tsx for data usage) ---
interface AdminInfo {
  username: string;
  email: string;
  role: string; // Added role field from Layout.tsx for display
}

interface DashboardStats {
  total_tickets: number;
  pending_pickup: number;
  in_process: number;
  occupied_racks: number;
  available_racks: number;
  admin_info: AdminInfo;
}

// Defining the props
interface StoreAdminProps {
    onBackToHome?: () => void; 
    onLogout?: () => void;
}

// Helper function to capitalize a string (e.g., 'store_owner' -> 'Store Owner')
const formatRole = (role?: string) => {
    if (!role) return 'Unknown Role';
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function StoreAdmin({ onBackToHome, onLogout }: StoreAdminProps) {
  const navigate = useNavigate();

  // 1. Fetch Data using useApi hook
  const { data: stats, loading, error } = useApi<DashboardStats>('/dashboard/stats');

  // 2. Derive Metrics from fetched data or use default values if loading/error
  const metrics = useMemo(() => {
    if (loading) {
      return [
        { title: "Total Tickets", value: "Loading...", icon: LayoutDashboard, color: "gray" },
        { title: "Items In Process", value: "Loading...", icon: Clock, color: "gray" },
        { title: "Available Racks", value: "Loading...", icon: Package, color: "gray" },
      ];
    }
    if (error) {
      return [
        { title: "Total Tickets", value: "Error", icon: LayoutDashboard, color: "red" },
        { title: "Items In Process", value: "Error", icon: Clock, color: "red" },
        { title: "Available Racks", value: "Error", icon: Package, color: "red" },
      ];
    }

    return [
      { 
        title: "Total Tickets", 
        value: stats?.total_tickets ?? 0, 
        icon: LayoutDashboard, 
        color: "blue" 
      },
      { 
        title: "Items In Process", 
        value: stats?.in_process ?? 0, 
        icon: Clock, 
        color: "yellow" 
      },
      { 
        title: "Available Racks", 
        value: stats?.available_racks ?? 0, 
        icon: Package, 
        color: "green" 
      },
    ];
  }, [stats, loading, error]);

  const adminTasks = [
    { title: "Employee Accounts & Roles", icon: Users, description: "Create, deactivate, and assign roles to internal staff.", action: () => navigate('/users'), buttonText: "Manage Employees" },
    { title: "Service Categories & Pricing", icon: Tag, description: "Set up item price lists and manage service categories.", action: () => navigate('/clothing'), buttonText: "Configure Services" },
    { title: "Rack & Location Setup", icon: Package, description: "Define physical racks and manage item storage locations.", action: () => navigate('/racks'), buttonText: "Manage Racks" },
    { title: "Customer Loyalty & Offers", icon: Gift, description: "Manage customer profiles, rewards programs, and seasonal promotions.", action: () => navigate('/customers'), buttonText: "Manage Customers" },
    { title: "Receipt & Tag Configuration", icon: Printer, description: "Customize receipt templates and configure barcode tags.", action: () => navigate('/receipt-config'), buttonText: "Configure Printing" },
    { title: "Operational Hours", icon: Clock, description: "Define store opening hours and peak processing times.", action: () => console.log('Open Hours Modal'), buttonText: "Set Hours" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
        
        {/* 1. Integrated Header Component */}
        <Header onBackToHome={onBackToHome} onLoginClick={onLogout} />

        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 mt-8">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Store Administration Panel</h2>
                    <p className="text-gray-600">Central hub for managing store-specific data, settings, and team access.</p>
                </div>

                {/* Display Admin Info (like in Dashboard.tsx) */}
                {stats?.admin_info && (
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center space-x-3">
                        <User className="h-5 w-5 text-blue-600" />
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-800">{stats.admin_info.username}</p>
                            <p className="text-xs text-gray-500">{stats.admin_info.email}</p>
                            <p className="text-xs font-semibold text-blue-600">{formatRole(stats.admin_info.role)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Metrics Snapshot (Now using fetched/derived data) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                        <div key={metric.title} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                                <p className={`text-3xl font-extrabold mt-1 ${metric.color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>{metric.value}</p>
                            </div>
                            <div className={`p-3 rounded-full bg-${metric.color}-100 text-${metric.color}-600`}>
                                <Icon className="h-6 w-6" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Configuration Grid */}
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Settings className="h-6 w-6 mr-2 text-blue-600" />
                Store Configuration Tasks
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminTasks.map((task) => {
                    const Icon = task.icon;
                    return (
                        <div key={task.title} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col justify-between hover:shadow-lg transition duration-200">
                            <div>
                                <Icon className="h-8 w-8 mb-3 text-blue-600" />
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h4>
                                <p className="text-sm text-gray-500 mb-4">{task.description}</p>
                            </div>
                            <button
                                onClick={task.action}
                                className="w-full text-center bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-md"
                            >
                                {task.buttonText}
                            </button>
                        </div>
                    );
                })}

                {/* Dedicated Reporting Card */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col justify-between hover:shadow-lg transition duration-200 lg:col-span-1">
                    <div>
                        <FileText className="h-8 w-8 mb-3 text-red-600" />
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Reports & Analytics</h4>
                        <p className="text-sm text-gray-500 mb-4">Generate detailed reports on sales, productivity, and inventory turnover.</p>
                    </div>
                    <button
                        onClick={() => console.log('Generate Reports')}
                        className="w-full text-center bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-md"
                    >
                        View Reports Dashboard
                    </button>
                </div>
            </div>
            
        </div>
    </div>
  );
}
