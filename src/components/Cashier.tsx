import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Package, Clock, CheckCircle, MapPin, Users, CreditCard, FileText, RefreshCw, Tag, 
  Mail, User, DollarSign, AlertCircle, X, 
  Search, BookUser, Menu 
} from 'lucide-react';
import Header from './Header';
import baseURL from '../lib/config';
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

      // Process Racks
      const racks = racksResponse.data?.racks || [];
      const occupied = racks.filter((r: any) => r.is_occupied).length;
      const available = racks.length - occupied;

      // Process Tickets
      const ticketsData: TicketSummary[] = ticketsResponse.data || [];
      setTickets(ticketsData); 

      const total_tickets = ticketsData.length;
      const pending_pickup = ticketsData.filter(t => t.status === 'ready_for_pickup' || t.status === 'ready').length;
      const in_process = ticketsData.filter(t => t.status === 'processing' || t.status === 'received').length;
      
      setStats({
        total_tickets,
        pending_pickup,
        in_process,
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

  // --- Ticket Detail Handler ---
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
      console.log("Ticket Details Response:", response.data);
      setSelectedTicketDetails(response.data);
    } catch (err: any) { 
      console.error("Error fetching ticket details:", err);
      setDetailError(err.response?.data?.detail || "Failed to load ticket details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // --- Sidebar Helper ---
  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // --- STAT CARDS CONFIG ---
  const statCards = [
    { title: 'Total Tickets', value: stats.total_tickets, icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Ready for Pickup', value: stats.pending_pickup, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'In Process', value: stats.in_process, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { title: 'Occupied Racks', value: stats.occupied_racks, icon: MapPin, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Available Racks', value: stats.available_racks, icon: Users, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  ];

  // --- DASHBOARD HOME VIEW ---
  const DashboardHome = () => (
    <div className="space-y-6">
      
      {/* Header with Refresh Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Cashier Dashboard 

[Image of responsive web design layout]
</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
      </div>

      {/* 1. Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
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

      {/* 2. Recent Tickets Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Tickets</h2>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search ticket # or name..."
              value={ticketFilter}
              onChange={(e) => setTicketFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.length > 0 ? (
                filteredTickets.slice(0, 10).map((ticket) => ( 
                  <tr 
                    key={ticket.id} 
                    onClick={() => handleTicketClick(ticket.id)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{ticket.ticket_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.customer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ticket.status === 'ready_for_pickup' || ticket.status === 'ready' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ticket.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.pickup_date ? new Date(ticket.pickup_date).toLocaleDateString() : 'N_A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    {ticketFilter ? "No tickets match your filter." : "No tickets found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // --- NAVIGATION BUTTON HELPER ---
  const NavButton = ({ tab, icon: Icon, label }: { tab: string, icon: any, label: string }) => (
    <button
      onClick={() => handleTabChange(tab)}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        activeTab === tab ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* --- MOBILE OVERLAY --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* --- SIDEBAR --- */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">CleanPOS</h2>
            <p className="text-xs text-gray-500">Cashier / Admin</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-4 px-4 space-y-2 overflow-y-auto flex-1">
          <NavButton tab="dashboard" icon={FileText} label="Dashboard" />
          <NavButton tab="drop-off" icon={Package} label="Drop Off" />
          <NavButton tab="pick-up" icon={CheckCircle} label="Pick Up" />
          <NavButton tab="tickets" icon={FileText} label="Tickets" />
          <NavButton tab="assign-rack" icon={RefreshCw} label="Assign Rack" />
          <NavButton tab="directory" icon={BookUser} label="Directory" />
          <NavButton tab="customers" icon={Users} label="Customers (Edit)" />

          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Management
            </p>
            <NavButton tab="clothing" icon={Tag} label="Clothing Types" />
            <NavButton tab="tags" icon={Tag} label="Tag Management" />
            <NavButton tab="status" icon={Clock} label="Ticket Status" />
          </div>
        </nav>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        
        {/* --- MOBILE MENU TRIGGER --- */}
        <div className="md:hidden bg-white border-b border-gray-200 p-2 flex items-center">
           <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="p-2 rounded-md hover:bg-gray-100 text-gray-600 flex items-center gap-2"
           >
             <Menu size={24} />
             <span className="font-semibold text-sm">Menu</span>
           </button>
        </div>

        {/* --- GLOBAL HEADER --- */}
        <Header /> 

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 relative">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            
            {/* Error/Loading for Dashboard Data */}
            {loading && activeTab === 'dashboard' && <p className="text-gray-500">Loading dashboard data...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {/* --- Views --- */}
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

      {/* --- TICKET DETAIL MODAL (UPDATED FOR ROBUST DISPLAY) --- */}
      {isDetailModalOpen && (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          
          {/* Background Backdrop */}
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsDetailModalOpen(false)}></div>

          {/* Modal Container */}
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              
              {/* Modal Panel */}
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg max-h-[90vh] flex flex-col">
                
                {/* Modal Header */}
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Ticket Details
                    </h3>
                    <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 overflow-y-auto flex-1">
                  {isDetailLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : detailError ? (
                    <div className="text-center p-4">
                      <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                      <p className="text-red-600 font-medium">Error loading ticket</p>
                      <p className="text-gray-500 text-sm mt-1">{detailError}</p>
                    </div>
                  ) : !selectedTicketDetails ? (
                    <div className="text-center text-gray-500">No details found.</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Header Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Ticket #:</span>
                          <span className="ml-2 font-medium">{selectedTicketDetails.ticket_number}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-2 font-medium">{new Date(selectedTicketDetails.created_at).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Customer:</span>
                          <span className="ml-2 font-medium">{selectedTicketDetails.customer_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <span className="ml-2 font-medium">{selectedTicketDetails.customer_phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${selectedTicketDetails.status === 'ready_for_pickup' || selectedTicketDetails.status === 'ready' ? 'bg-green-100 text-green-800' : 
                              selectedTicketDetails.status === 'picked_up' ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'}`}>
                            {selectedTicketDetails.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Rack:</span>
                          <span className="ml-2 font-medium">{selectedTicketDetails.rack_number || 'Unassigned'}</span>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="mt-4 border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedTicketDetails.items?.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  <div>{item.clothing_name}</div>
                                  <div className="text-xs text-gray-500">
                                    {item.starch_level && item.starch_level !== 'none' && (
                                        <div className="text-xs">Starch: {item.starch_level}</div>
                                    )}
                                    {item.crease && (
                                        <div className="text-xs">Crease: Yes</div>
                                    )}
                                    {item.alterations && (
                                        <div className="text-xs font-bold text-black">Alt: {item.alterations}</div>
                                    )}
                                    {item.additional_charge > 0 && (
                                        <div className="text-xs font-bold text-black">Add'l: ${Number(item.additional_charge).toFixed(2)}</div>
                                    )}
                                    {item.item_instructions && (
                                        <div className="text-xs italic text-gray-500">Note: {item.item_instructions}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900 text-center">{item.quantity}</td>
                                <td className="px-3 py-2 text-sm text-gray-900 text-right">${item.item_total.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Special Instructions */}
                      {selectedTicketDetails.special_instructions && (
                        <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800">
                          <strong>Note:</strong> {selectedTicketDetails.special_instructions}
                        </div>
                      )}

                      {/* Financials */}
                      <div className="border-t pt-3 mt-4">
                        <div className="flex flex-col space-y-1 text-right">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-500">Total Amount</p>
                            <p className="text-sm font-medium text-gray-900">${selectedTicketDetails.total_amount.toFixed(2)}</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-500">Paid Amount</p>
                            <p className="text-sm font-medium text-gray-900">${selectedTicketDetails.paid_amount.toFixed(2)}</p>
                          </div>
                          <div className="flex justify-between border-t pt-2 mt-2">
                            <p className="text-lg font-semibold text-gray-900">Balance Due</p>
                            <p className="text-lg font-semibold text-red-600">
                              ${(selectedTicketDetails.total_amount - selectedTicketDetails.paid_amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t flex justify-end flex-shrink-0">
                  <button
                    type="button"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}