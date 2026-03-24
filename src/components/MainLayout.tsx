import React, { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  LayoutDashboard, Package, Clock, Ticket as TicketIcon,
  Users, MapPin, Shirt, Activity, Tag, Settings, BarChart3, Truck,
  Briefcase, Send, LogOut, Menu, ChevronLeft
} from "lucide-react";
import { ColorsScope, useColors } from "../state/ColorsContext";
import { useSidebar } from "../state/SidebarContext";
import Footer from "./Footer";

interface TokenPayload {
  sub: string;
  organization_name: string;
  role: string;
  org_type: string;
  is_branch: boolean;
  exp: number;
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { colors } = useColors();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [decodedToken, setDecodedToken] = React.useState<TokenPayload | null>(null);

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
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDropOffOnly = useMemo(() => {
    if (!decodedToken?.org_type) return false;
    const type = decodedToken.org_type.toLowerCase();
    return type === "drop_off_internal" || type === "drop_off_external";
  }, [decodedToken]);

  const menuItems = useMemo(() => {
    const allItems = [
      { id: 'dashboard', path: '/org', label: 'Dashboard', icon: LayoutDashboard, category: 'Main' },
      { id: 'dropoff', path: '/dropoff', label: 'Drop Off', icon: Package, category: 'Operations' },
      { id: 'pickup', path: '/pickup', label: 'Pick Up', icon: Clock, category: 'Operations' },
      { id: 'tickets', path: '/tickets', label: 'Tickets', icon: TicketIcon, category: 'Operations' },
      { id: 'batchtransfer', path: '/batchtransfer', label: 'Outgoing Transfers', icon: Send, category: 'Operations' },
      { id: 'transfers', path: '/transfers', label: 'Incoming Transfers', icon: Truck, category: 'Operations' },
      { id: 'customers', path: '/customers', label: 'Customers', icon: Users, category: 'Operations' },
      { id: 'staff', path: '/staff', label: 'Staff', icon: Briefcase, category: 'Management' },
      { id: 'racks', path: '/racks', label: 'Racks', icon: MapPin, category: 'Management' },
      { id: 'clothing', path: '/clothing', label: 'Clothing', icon: Shirt, category: 'Management' },
      { id: 'status', path: '/status', label: 'Status', icon: Activity, category: 'Management' },
      { id: 'tags', path: '/tags', label: 'Tags', icon: Tag, category: 'Management' },
      { id: 'settings', path: '/org-settings', label: 'Settings', icon: Settings, category: 'System' },
      { id: 'analytics', path: '/analytics', label: 'Analytics', icon: BarChart3, category: 'System' },
    ];

    if (isDropOffOnly) {
      const restrictedIds = ['racks', 'pickup', 'settings', 'analytics', 'transfers'];
      return allItems.filter(item => !restrictedIds.includes(item.id));
    }
    return allItems;
  }, [isDropOffOnly]);

  if (!decodedToken) return null;

  return (
    <ColorsScope>
      <div className="flex h-screen font-sans text-gray-900 overflow-hidden" style={{ backgroundColor: `${colors.primaryColor}12` }}>

        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 border-r border-black/5 ${isSidebarOpen ? 'w-72' : 'w-20'}`}
          style={{ backgroundColor: `${colors.primaryColor}10` }}
        >
          <div className={`h-20 flex items-center border-b border-black/5 ${isSidebarOpen ? 'px-6 justify-between' : 'justify-center'}`}>
            {isSidebarOpen ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-8 rounded-full" style={{ backgroundColor: colors.primaryColor }} />
                  <h2 className="text-2xl font-black tracking-tighter" style={{ color: colors.primaryColor }}>XOCleaners</h2>
                </div>
                <button 
                  onClick={toggleSidebar}
                  className="p-1.5 hover:bg-black/10 rounded-lg transition-colors text-gray-500"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft size={20} />
                </button>
              </>
            ) : (
              <button 
                onClick={toggleSidebar}
                className="p-3 hover:bg-black/10 rounded-xl transition-colors"
                style={{ color: colors.primaryColor }}
                title="Expand Sidebar"
              >
                <Menu size={24} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
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
                      navigate(item.path);
                      if (isMobile) {
                        // Sidebar will be manually toggled by user
                      }
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

        {/* MAIN CONTENT AREA */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>
          <main className="flex-1 overflow-y-auto p-2">
            <div>
              {children}
            </div>
          </main>

          {!location.pathname.includes('/dropoff') && <Footer />}
        </div>

      </div>
    </ColorsScope>
  );
}
