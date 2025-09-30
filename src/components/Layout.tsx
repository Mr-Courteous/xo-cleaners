import React from 'react';
import { Home, Users, Shirt, Package, BarChart3, Settings, Plus, Search, Clock, Tag as TagIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'dropoff', label: 'Drop Off', icon: Plus },
    { id: 'pickup', label: 'Pick Up', icon: Package },
  ];

  const managementNavItems = [
    { id: 'tickets', label: 'Tickets', icon: Search },
    { id: 'status', label: 'Status', icon: Clock },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'racks', label: 'Racks', icon: BarChart3 },
    { id: 'clothing', label: 'Clothing Items', icon: Settings },
    { id: 'tags', label: 'Tags', icon: TagIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Shirt className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">XoCleaners</h1>
                  <p className="text-sm text-gray-500">Dry Cleaning Management</p>
                </div>
              </div>
            </div>
            
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
          </div>
        </div>
      </header>

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
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}