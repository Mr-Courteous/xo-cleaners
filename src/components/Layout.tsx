import React from 'react';
import { Home, Users, Shirt, Package, BarChart3, Settings, Plus, Search, Clock, Tag as TagIcon, User } from 'lucide-react';
// 1. Import useApi hook
import { useApi } from '../hooks/useApi';

// Define types based on the confirmed /dashboard/stats response
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
  admin_info: AdminInfo; // Field confirmed by backend code
}

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => void;
  username?: string; 
}

export default function Layout({ children, currentView, onViewChange, onLogout, username: propUsername }: LayoutProps) {
  // 2. Fetch data from the confirmed endpoint
  const { data: stats, loading: adminLoading } = useApi<DashboardStats>('/dashboard/stats'); 
  
  // 3. Destructure and extract admin_info
  const adminInfo = stats?.admin_info;
  
  const displayUsername = adminInfo?.username || propUsername;
  const displayEmail = adminInfo?.email;

  console.log(displayEmail, displayUsername);
  
  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'dropoff', label: 'Drop Off', icon: Plus },
    { id: 'pickup', label: 'Pick Up', icon: Package },
  ];

  const managementNavItems = [
    { id: 'tickets', label: 'Tickets', icon: Search },
    { id: 'status', label: 'Status', icon: Clock },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'racks', label: 'Racks', icon: BarChart3 },
    { id: 'receipt-config', label: 'Receipt Config', icon: Settings },
    { id: 'clothing', label: 'Clothing Items', icon: Settings },
    { id: 'tags', label: 'Tags', icon: TagIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* LOGO SECTION */}
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shirt className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">XoCleaners</h1>
                <p className="text-sm text-gray-500">Dry Cleaning Management</p>
              </div>
            </div>

            {/* MAIN NAV BUTTONS */}
            <div className="flex items-center space-x-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentView === item.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* USER + LOGOUT */}
            <div className="flex items-center space-x-4">
              {/* User Info Display */}
              {adminLoading && (
                 <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-md animate-pulse">
                    <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
                    <div className="h-4 w-20 bg-gray-300 rounded"></div>
                 </div>
              )}
              
              {/* Display fetched info (username and email) or propUsername if available */}
              {!adminLoading && (displayUsername || displayEmail) && (
                <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center space-x-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">{displayUsername}</p>
                    {/* Display email only if fetched */}
                    {displayEmail && <p className="text-xs text-gray-500">{displayEmail}</p>}
                  </div>
                </div>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MANAGEMENT NAV */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-1 py-4">
            <span className="text-sm text-gray-500 mr-4">Management:</span>
            {managementNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}