import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  LayoutDashboard, Menu, X, LogOut, Package, Clock, Ticket as TicketIcon,
  Users, MapPin, Shirt, Activity, Tag, Settings, BarChart3,
  ArrowLeft, Briefcase
} from "lucide-react";

import Header from "./Header";
import { ColorsScope, useColors } from "../state/ColorsContext";

// --- Component Imports (Assume these are correct) ---
import DropOff from './DropOff';
import PickUp from './PickUp';
import TicketManagement from './TicketManagement';
import CustomerManagement from './CustomerManagement';
import RackManagement from './RackManagement';
import ClothingManagement from './ClothingManagement';
import StatusManagement from './StatusManagement';
import TagManagement from './Tag';
import CustomerDirectory from './CustomerDirectory';
import DashboardAnalytics from './DashboardAnalytics';
import OrganizationSettings from "./OrganizationSettings";
import WorkerManagement from "./WorkerManagement";

interface TokenPayload {
  sub: string;
  organization_name: string;
  role: string;
  org_type: string;
  is_branch: boolean;
  exp: number;
}

export default function StoreOwner() {
  const { colors } = useColors();
  const navigate = useNavigate();
  
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [decodedToken, setDecodedToken] = useState<TokenPayload | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        localStorage.clear();
        navigate("/");
        return;
      }
      setDecodedToken(decoded);
    } catch (error) {
      localStorage.clear();
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Logic to determine if the store is restricted to "Drop Off Only"
  const isDropOffOnly = useMemo(() => {
    if (!decodedToken?.org_type) return false;
    const type = decodedToken.org_type.toLowerCase();
    return type === "drop_off_internal" || type === "drop_off_external";
  }, [decodedToken]);

  // filter menu items based on org_type
  const menuItems = useMemo(() => {
    const allItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Main' },
      { id: 'dropoff', label: 'Drop Off', icon: Package, category: 'Operations' },
      { id: 'pickup', label: 'Pick Up', icon: Clock, category: 'Operations' },
      { id: 'tickets', label: 'Tickets', icon: TicketIcon, category: 'Operations' },
      { id: 'customers', label: 'Customers', icon: Users, category: 'Operations' },
      { id: 'staff', label: 'Staff', icon: Briefcase, category: 'Management' },
      { id: 'racks', label: 'Racks', icon: MapPin, category: 'Management' },
      { id: 'clothing', label: 'Clothing', icon: Shirt, category: 'Management' },
      { id: 'status', label: 'Status', icon: Activity, category: 'Management' },
      { id: 'tags', label: 'Tags', icon: Tag, category: 'Management' },
      { id: 'settings', label: 'Settings', icon: Settings, category: 'System' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'System' },
    ];

    if (isDropOffOnly) {
      // Exclude: racks, pickup, settings, analytics
      const restrictedIds = ['racks', 'pickup', 'settings', 'analytics'];
      return allItems.filter(item => !restrictedIds.includes(item.id));
    }

    return allItems;
  }, [isDropOffOnly]);

  const renderContent = () => {
    // Basic Security: prevent access to restricted views via internal state
    if (isDropOffOnly && ['racks', 'pickup', 'settings', 'analytics'].includes(activeView)) {
      return <DashboardAnalytics />;
    }

    switch (activeView) {
      case 'dashboard': return <DashboardAnalytics />;
      case 'dropoff': return <DropOff />;
      case 'pickup': return <PickUp />;
      case 'tickets': return <TicketManagement />;
      case 'customers': return <CustomerManagement />;
      case 'staff': return <WorkerManagement />;
      case 'racks': return <RackManagement />;
      case 'clothing': return <ClothingManagement />;
      case 'status': return <StatusManagement />;
      case 'tags': return <TagManagement />;
      case 'settings': return <OrganizationSettings />;
      case 'analytics': return <DashboardAnalytics />;
      default: return <div>View Not Found</div>;
    }
  };

  if (!decodedToken) return null;

  return (
    <ColorsScope>
      <div className="flex h-screen font-sans text-gray-900 overflow-hidden" style={{ backgroundColor: `${colors.primaryColor}12` }}>
        
        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 border-r border-black/5 ${isSidebarOpen ? 'w-72' : 'w-20'}`}
          style={{ backgroundColor: `${colors.primaryColor}10` }}
        >
          <div className="h-20 flex items-center px-6 border-b border-black/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-8 rounded-full" style={{ backgroundColor: colors.primaryColor }} />
              {isSidebarOpen && <h2 className="text-2xl font-black tracking-tighter" style={{ color: colors.primaryColor }}>XOCleaners</h2>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {menuItems.map((item, index) => {
              const isActive = activeView === item.id;
              const showCategory = isSidebarOpen && (index === 0 || menuItems[index - 1].category !== item.category);

              return (
                <React.Fragment key={item.id}>
                  {showCategory && (
                    <div className="px-4 mt-6 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      {item.category}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setActiveView(item.id);
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center py-3 rounded-xl font-bold transition-all shadow-sm mb-1.5 
                      ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'}
                      ${isActive ? 'bg-white' : 'bg-white/50 text-gray-400 hover:text-gray-600'}`}
                    style={isActive ? { color: colors.primaryColor } : {}}
                  >
                    <item.icon size={20} className={isSidebarOpen ? 'mr-3' : ''} style={isActive ? { color: colors.primaryColor } : { color: '#d1d5db' }} />
                    {isSidebarOpen && <span>{item.label}</span>}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <div className="p-4 border-t border-black/5">
            <button
              onClick={() => { localStorage.clear(); navigate("/"); }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <LogOut size={20} />
              {isSidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>
          <Header />
          <header className="h-16 bg-white/40 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-8 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all">
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              {activeView !== 'dashboard' && (
                <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 text-sm font-black shadow-sm">
                  <ArrowLeft size={16} /> DASHBOARD
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{decodedToken.org_type.replace(/_/g, ' ')}</p>
                <p className="text-sm font-bold">{decodedToken.organization_name}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg" style={{ backgroundColor: colors.primaryColor }}>
                {decodedToken.organization_name.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </ColorsScope>
  );
}