import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Package, Clock, CheckCircle, MapPin, Users, FileText, RefreshCw, Tag, 
  AlertCircle, X, Search, Menu 
} from 'lucide-react';
import Header from './Header';
import baseURL from '../lib/config';
import { ColorsScope, useColors } from '../state/ColorsContext';
import DropOff from './DropOff';
import PickUp from './PickUp';
import RackManagement from './RackManagement'; 
import ClothingManagement from './ClothingManagement';

// --- Import components ---
import StatusManagement from './StatusManagement';
import CustomerManagement from './CustomerManagement';
import TicketManagement from './TicketManagement';
import TagManagement from './Tag';
import CustomerDirectory from './CustomerDirectory';

// --- Types ---
interface TicketSummary {
  id: number;
  ticket_number: string;
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  paid_amount: number;
  status: string; 
  rack_number?: string;
  pickup_date?: string;
  created_at: string;
  organization_id: number;
}

interface TicketItemDetail {
  id: number;
  ticket_id: number;
  clothing_type_id: number;
  clothing_name: string;
  quantity: number;
  starch_level: string | null;
  crease: boolean | null;
  alterations: string | null;
  item_instructions: string | null;
  item_total: number;
  plant_price: number;
  margin: number;
  additional_charge: number;
}

interface TicketResponse {
  id: number;
  ticket_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  paid_amount: number;
  status: string;
  rack_number: string | null;
  special_instructions: string | null;
  pickup_date: string | null;
  created_at: string;
  items: TicketItemDetail[];
  organization_id: number;
}

export default function CashierDashboard() {
  const { colors } = useColors();
  
  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drop-off' | 'pick-up' | 'assign-rack' | 'clothing' | 'status' | 'customers' | 'directory' | 'tickets' | 'tags'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Dashboard Stats State ---
  const [stats, setStats] = useState({
    total_tickets: 0,
    pending_pickup: 0,
    in_process: 0,
    occupied_racks: 0,
    available_racks: 0,
  });

  const [tickets, setTickets] = useState<TicketSummary[]>([]);

  // --- Modal State ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<TicketResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // --- Filter State ---
  const [ticketFilter, setTicketFilter] = useState("");
  const [filteredTickets, setFilteredTickets] = useState<TicketSummary[]>([]);

  // --- Refresh State ---
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Data Fetching ---
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token missing");

      const headers = { Authorization: `Bearer ${token}` };

      const [racksResponse, ticketsResponse] = await Promise.all([
        axios.get(`${baseURL}/api/organizations/racks`, { headers }),
        axios.get(`${baseURL}/api/organizations/tickets`, { headers })
      ]);

      const racks = racksResponse.data?.racks || [];
      const occupied = racks.filter((r: any) => r.is_occupied).length;
      const available = racks.length - occupied;

      const ticketsData: TicketSummary[] = ticketsResponse.data || [];
      setTickets(ticketsData); 

      setStats({
        total_tickets: ticketsData.length,
        pending_pickup: ticketsData.filter(t => t.status === 'ready_for_pickup' || t.status === 'ready').length,
        in_process: ticketsData.filter(t => t.status === 'processing' || t.status === 'received').length,
        occupied_racks: occupied,
        available_racks: available,
      });

    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
    setRefreshKey(prevKey => prevKey + 1);
  };

  // --- Filtering Logic ---
  useEffect(() => {
    const lowerCaseFilter = ticketFilter.toLowerCase();
    const filtered = tickets.filter(
      (ticket) =>
        ticket.ticket_number.toLowerCase().includes(lowerCaseFilter) ||
        ticket.customer_name.toLowerCase().includes(lowerCaseFilter)
    );
    setFilteredTickets(filtered);
  }, [ticketFilter, tickets]);

  const handleTicketClick = async (ticketId: number) => {
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    setDetailError(null);
    setSelectedTicketDetails(null);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${baseURL}/api/organizations/tickets/${ticketId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTicketDetails(response.data);
    } catch (err: any) { 
      setDetailError("Failed to load ticket details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // --- STAT CARDS CONFIG ---
  const statCards = [
    { title: 'Total Tickets', value: stats.total_tickets, icon: Package, color: 'var(--primary-color)', bgColor: `${colors.primaryColor}25` },
    { title: 'Ready for Pickup', value: stats.pending_pickup, icon: CheckCircle, color: 'var(--secondary-color)', bgColor: `${colors.secondaryColor}25` },
    { title: 'In Process', value: stats.in_process, icon: Clock, color: '#d97706', bgColor: '#fff7ed' },
    { title: 'Occupied Racks', value: stats.occupied_racks, icon: MapPin, color: '#7c3aed', bgColor: '#f5f3ff' },
    { title: 'Available Racks', value: stats.available_racks, icon: Users, color: '#4b5563', bgColor: '#f9fafb' },
  ];

  // --- DASHBOARD HOME VIEW ---
  const DashboardHome = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">Dashboard Overview</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ backgroundColor: 'var(--primary-color)' }}
            className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto justify-center font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Refresh Data'}
          </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-3 rounded-xl" style={{ backgroundColor: card.bgColor }}>
                  <Icon className="h-6 w-6" style={{ color: card.color }} />
                </div>
                <div className="ml-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{card.title}</p>
                  <p className="text-2xl font-black text-gray-900 leading-none">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Recent Orders</h2>
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search ticket # or name..."
              value={ticketFilter}
              onChange={(e) => setTicketFilter(e.target.value)}
              style={{ '--tw-ring-color': 'var(--primary-color)' } as any}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 outline-none transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-50">
          <table className="min-w-full divide-y divide-gray-50">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket #</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredTickets.length > 0 ? (
                filteredTickets.slice(0, 8).map((ticket) => ( 
                  <tr key={ticket.id} onClick={() => handleTicketClick(ticket.id)} className="cursor-pointer hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black" style={{ color: 'var(--primary-color)' }}>{ticket.ticket_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">{ticket.customer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span 
                        className="px-3 py-1 inline-flex text-[10px] font-black rounded-lg uppercase tracking-widest"
                        style={
                            ticket.status.includes('ready') 
                            ? { backgroundColor: `${colors.secondaryColor}15`, color: 'var(--secondary-color)' }
                            : { backgroundColor: '#f3f4f6', color: '#6b7280' }
                        }
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-black">${ticket.total_amount.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400 italic font-medium">No results found for your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const NavButton = ({ tab, icon: Icon, label }: { tab: string, icon: any, label: string }) => {
    const isActive = activeTab === tab;
    return (
        <button
          onClick={() => handleTabChange(tab)}
          className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all border shadow-sm mb-2 ${
            isActive 
              ? 'bg-white border-transparent' 
              : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-600'
          }`}
          style={isActive ? { color: 'var(--primary-color)' } : {}}
        >
          <Icon className="w-5 h-5 mr-3" style={isActive ? { color: 'var(--primary-color)' } : { color: '#d1d5db' }} />
          {label}
        </button>
    );
  };

  return (
    <ColorsScope>
    <div className="flex h-screen font-sans overflow-hidden transition-colors duration-700" style={{ backgroundColor: `${colors.primaryColor}1F` }}>
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* --- SIDEBAR --- */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-72 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 border-r border-black/5 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: `${colors.primaryColor}10` }} 
      >
        <div className="p-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: 'var(--primary-color)' }}></div>
            <h2 className="text-2xl font-black tracking-tighter" style={{ color: 'var(--primary-color)' }}>CleanPOS</h2>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-2 px-6 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          <NavButton tab="dashboard" icon={FileText} label="Dashboard" />
          <NavButton tab="drop-off" icon={Package} label="Drop Off" />
          <NavButton tab="pick-up" icon={CheckCircle} label="Pick Up" />
          <NavButton tab="tickets" icon={FileText} label="Tickets" />
          <NavButton tab="assign-rack" icon={RefreshCw} label="Assign Rack" />
          <NavButton tab="customers" icon={Users} label="Customers" />

          <div className="pt-8">
            <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Operations</p>
            <NavButton tab="clothing" icon={Tag} label="Clothing Types" />
            <NavButton tab="tags" icon={Tag} label="Tag Management" />
            <NavButton tab="status" icon={Clock} label="Ticket Status" />
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-gray-100 p-3 flex items-center">
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600"><Menu size={24} /></button>
           <span className="font-black text-gray-800 ml-2 tracking-tight">CASHIER DASHBOARD</span>
        </div>

        <Header /> 

        <main className="flex-1 overflow-x-hidden overflow-y-auto relative">
          <div className="max-w-7xl mx-auto p-4 sm:p-8">
            {activeTab === 'dashboard' && !loading && <DashboardHome />}
            {activeTab === 'drop-off' && <DropOff key={refreshKey} />}
            {activeTab === 'pick-up' && <PickUp key={refreshKey} />}
            {activeTab === 'assign-rack' && <RackManagement key={refreshKey} />}
            {activeTab === 'clothing' && <ClothingManagement key={refreshKey} />}
            {activeTab === 'status' && <StatusManagement key={refreshKey} />}
            {activeTab === 'customers' && <CustomerManagement key={refreshKey} />}
            {activeTab === 'tickets' && <TicketManagement key={refreshKey} />}
            {activeTab === 'tags' && <TagManagement key={refreshKey} />}
            {activeTab === 'directory' && <CustomerDirectory key={refreshKey} />}
          </div>
        </main>
      </div>

      {/* --- TICKET DETAIL MODAL --- */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDetailModalOpen(false)}></div>
          <div className="relative transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all w-full max-w-lg max-h-[85vh] flex flex-col border border-gray-100">
            <div className="px-8 pt-8 pb-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Order Details</h3>
                <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X className="h-6 w-6" /></button>
            </div>

            <div className="px-8 py-6 overflow-y-auto flex-1 custom-scrollbar">
              {isDetailLoading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-100" style={{ borderTopColor: 'var(--primary-color)' }}></div></div>
              ) : selectedTicketDetails && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start bg-gray-50 p-6 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ticket ID</p>
                      <p className="text-2xl font-black" style={{ color: 'var(--primary-color)' }}>{selectedTicketDetails.ticket_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                      <p className="font-bold text-gray-900">{selectedTicketDetails.customer_name}</p>
                    </div>
                  </div>

                  <div className="bg-gray-900 p-8 rounded-2xl text-white shadow-xl">
                    <div className="flex justify-between items-end mb-6">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Financial Overview</p>
                      <div className="h-px bg-white/10 flex-1 ml-4 mb-1.5"></div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm"><p className="opacity-60">Bill Total</p><p className="font-bold">${selectedTicketDetails.total_amount.toFixed(2)}</p></div>
                      <div className="flex justify-between text-sm"><p className="opacity-60">Payment Made</p><p className="font-bold text-green-400">${selectedTicketDetails.paid_amount.toFixed(2)}</p></div>
                      <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Amount Remaining</p>
                        <p className="text-3xl font-black text-red-400">${(selectedTicketDetails.total_amount - selectedTicketDetails.paid_amount).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50/50 border-t border-gray-50">
              <button className="w-full py-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-50 active:scale-[0.98] transition-all" onClick={() => setIsDetailModalOpen(false)}>Close Summary</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ColorsScope>
  );
}