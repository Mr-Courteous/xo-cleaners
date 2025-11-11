import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import axios from 'axios';
import { 
  Package, Clock, CheckCircle, MapPin, Users, CreditCard, FileText, RefreshCw, Tag, 
  Mail, User, DollarSign, AlertCircle, X, 
  Search 
} from 'lucide-react';
import Header from './Header';
import baseURL from '../lib/config';
import DropOff from './DropOff';
import PickUp from './PickUp';
import RackManagement from './RackManagement'; 
import ClothingManagement from './ClothingManagement';

// --- Import the new components ---
import StatusManagement from './StatusManagement';
import CustomerManagement from './CustomerManagement';
// import UsersManagement from './UsersManagement'; // --- REMOVED ---
import TicketManagement from './TicketManagement'; // --- NEW ---
import TagManagement from './Tag'; // <-- ADDED THIS IMPORT


// --- (Existing) Type for the summary list ---
interface TicketSummary {
// ... (interface unchanged)
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

// --- (Existing) Type for an item *within* the full ticket response
interface TicketItemDetail {
// ... (interface unchanged)
  id: number;
  ticket_id: number;
  clothing_type_id: number;
  clothing_name: string;
  quantity: number;
  starch_level: string | null;
  crease: boolean | null;
  item_total: number;
  plant_price: number;
  margin: number;
  additional_charge: number;
}

// --- (Existing) Type for the full ticket response
interface TicketResponse {
// ... (interface unchanged)
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
  items: TicketItemDetail[]; // The full item list
  organization_id: number;
}


export default function CashierDashboard() {
  const [currentView, setCurrentView] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true); // For initial page load
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
// ... (state unchanged)
    total_tickets: 0,
    pending_pickup: 0,
    in_process: 0,
    occupied_racks: 0,
    available_racks: 0,
  });

  const [tickets, setTickets] = useState<TicketSummary[]>([]);

  // --- (Existing) STATE FOR TICKET DETAIL MODAL ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<TicketResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // --- (Existing) STATE FOR FILTERING TICKETS ---
  const [ticketFilter, setTicketFilter] = useState("");
  const [filteredTickets, setFilteredTickets] = useState<TicketSummary[]>([]);

  // --- NEW: State for refreshing ---
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);


  // --- REFACTORED: Data Fetching moved to useCallback ---
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true); // Show refresh state
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token missing");

      const headers = { Authorization: `Bearer ${token}` };

      const [racksResponse, ticketsResponse] = await Promise.all([
        axios.get(`${baseURL}/api/organizations/racks`, { headers }),
        axios.get(`${baseURL}/api/organizations/tickets`, { headers })
      ]);

      // --- Process Racks ---
      const racks = racksResponse.data?.racks || [];
      console.log(racks)
      const occupied = racks.filter((r: any) => r.is_occupied).length;
      const available = racks.length - occupied;

      // --- Process Tickets ---
      const ticketsData: TicketSummary[] = ticketsResponse.data || [];
      setTickets(ticketsData); 

      const total_tickets = ticketsData.length;
      const pending_pickup = ticketsData.filter(
        (t) => t.status === 'ready_for_pickup' // <-- Adjust this status string if needed
      ).length;
      const in_process = ticketsData.filter(
        (t) => t.status === 'processing' // <-- Adjust this status string if needed
      ).length;
      
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
      setLoading(false); // Hide initial load spinner
      setIsRefreshing(false); // Hide refresh button spinner
    }
  }, []); // Empty dependency array means this function is stable

  // --- (Modified) Data Fetching Effect ---
  useEffect(() => {
    setLoading(true); // Set initial loading
    fetchDashboardData();
  }, [fetchDashboardData]); // Runs on mount (and if fetchDashboardData ever changed, which it won't)

  // --- NEW: Refresh Handler ---
  const handleRefresh = () => {
    // 1. Call the main fetch function to refresh stats and tickets
    fetchDashboardData();
    // 2. Increment key to force-remount child components (DropOff, PickUp, etc.)
    setRefreshKey(prevKey => prevKey + 1);
  };

  // --- (Existing) EFFECT FOR FILTERING TICKETS ---
  useEffect(() => {
    const lowerCaseFilter = ticketFilter.toLowerCase();
    const filtered = tickets.filter(
      (ticket) =>
        ticket.ticket_number.toLowerCase().includes(lowerCaseFilter) ||
        ticket.customer_name.toLowerCase().includes(lowerCaseFilter)
    );
    setFilteredTickets(filtered);
  }, [ticketFilter, tickets]); // Re-run when filter or tickets change

  // --- (Existing) Function to fetch and display single ticket details
  const handleTicketClick = async (ticketId: number) => {
// ... (function unchanged)
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    setDetailError(null);
    setSelectedTicketDetails(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token missing");

      const response = await axios.get(
        `${baseURL}/api/organizations/tickets/${ticketId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSelectedTicketDetails(response.data);

    } catch (err: any) { 
      console.error("Error fetching ticket details:", err);
      setDetailError(err.response?.data?.detail || "Failed to load ticket details.");
    } finally {
      setIsDetailLoading(false);
    }
  };


  const statCards = [
// ... (array unchanged)
    { title: 'Total Tickets', value: stats.total_tickets, icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Ready for Pickup', value: stats.pending_pickup, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'In Process', value: stats.in_process, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { title: 'Occupied Racks', value: stats.occupied_racks, icon: MapPin, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Available Racks', value: stats.available_racks, icon: Users, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  ];

  const features = [
// ... (array unchanged)
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
        
        {/* --- NEW: Title and Refresh Button --- */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Cashier Dashboard</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* --- View Buttons --- */}
        {/* --- CHANGED --- Swapped 'users' for 'tickets' */}
        <div className="flex flex-wrap gap-4 mb-4">
          {[
            'overview', 'dropoff', 'pickup', 'clothing', 'assign rack', 
            'status', 'customers', 'tickets', 'tag' // <-- ADDED 'tag'
          ].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-4 py-2 rounded-md font-medium capitalize ${ 
                currentView === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {view}
            </button>
          ))}
        </div>

        {/* --- Loading & Error States --- */}
        {loading && <p className="text-gray-500">Loading dashboard data...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {/* --- Overview --- */}
        {!loading && currentView === 'overview' && (
          <>
            {/* --- Stat Cards --- */}
            {/* ... (unchanged) ... */}
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

            {/* --- Features --- */}
            {/* ... (unchanged) ... */}
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

            {/* --- Recent Tickets --- */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
              {/* --- (Existing) flex container for title and search */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Tickets</h2>
                {/* --- (Existing) search bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter by ticket # or name..."
                    value={ticketFilter}
                    onChange={(e) => setTicketFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* --- (Existing) max-h-96 and overflow-y-auto for scrolling */}
              <div className="overflow-x-auto overflow-y-auto max-h-96 relative">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* --- (Existing) Use filteredTickets.length */}
                    {filteredTickets.length > 0 ? (
                      // --- (Existing) Map over filteredTickets
                      filteredTickets.slice(0, 10).map((ticket) => ( 
                        <tr 
                          key={ticket.id} 
                          onClick={() => handleTicketClick(ticket.id)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{ticket.ticket_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.customer_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              ticket.status === 'ready_for_pickup' ? 'bg-green-100 text-green-800' :
                              ticket.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {ticket.status}
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
                          {/* --- (Existing) Show dynamic message */}
                          {ticketFilter ? "No tickets match your filter." : "No tickets found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* --- Drop-off --- */}
        {/* --- MODIFIED: Added key --- */}
        {currentView === 'dropoff' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <DropOff key={refreshKey} />
          </div>
        )}

        {/* --- Pick-up --- */}
        {/* --- MODIFIED: Added key --- */}
        {currentView === 'pickup' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <PickUp key={refreshKey} />
          </div>
        )}

        {/* --- (Existing) Render RackManagement component --- */}
        {/* --- MODIFIED: Added key --- */}
        {currentView === 'assign rack' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <RackManagement key={refreshKey} />
          </div>
        )}

        {/* --- (Existing) Clothing Management (Cashier add/edit) --- */}
        {/* --- MODIFIED: Added key --- */}
        {currentView === 'clothing' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <ClothingManagement key={refreshKey} />
          </div>
        )}

        {/* --- Render StatusManagement component --- */}
        {/* --- MODIFIED: Added key --- */}
        {currentView === 'status' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <StatusManagement key={refreshKey} />
          </div>
        )}

        {/* --- Render CustomerManagement component --- */}
        {/* --- MODIFIED: Added key --- */}
        {currentView === 'customers' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <CustomerManagement key={refreshKey} />
          </div>
        )}

        {/* --- REMOVED --- UsersManagement component
        {currentView === 'users' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <UsersManagement />
          </div>
        )}
        */}

        {/* --- NEW --- Render TicketManagement component */}
        {/* --- MODIFIED: Added key --- */}
        {currentView === 'tickets' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <TicketManagement key={refreshKey} />
          </div>
        )}

        {/* --- NEW --- Render TagManagement component */}
        {/* --- MODIFIED: Added key --- */}
        {currentView === 'tag' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <TagManagement key={refreshKey} />
          </div>
        )}

      </div>

      {/* --- Ticket Detail Modal --- */}
      {/* ... (modal JSX is unchanged) ... */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Ticket Details
                </h2>
                <button 
                  onClick={() => setIsDetailModalOpen(false)} 
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="pt-6">
                {isDetailLoading && <p className="text-gray-600 text-center">Loading details...</p>}
                
                {detailError && <p className="text-red-600 text-center">{detailError}</p>}

                {selectedTicketDetails && (
                  <div className="space-y-6">
                    
                    {/* Customer & Ticket Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Ticket #</p>
                        <p className="text-lg font-semibold text-blue-600">{selectedTicketDetails.ticket_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Customer</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedTicketDetails.customer_name}</p>
                        <p className="text-sm text-gray-600">{selectedTicketDetails.customer_phone}</p>
                      </div>
                    </div>

                    {/* Status & Dates */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedTicketDetails.status === 'ready_for_pickup' ? 'bg-green-100 text-green-800' :
                          selectedTicketDetails.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedTicketDetails.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Rack</p>
                        <p className="text-gray-900">{selectedTicketDetails.rack_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pickup By</p>
                        <p className="text-gray-900">{selectedTicketDetails.pickup_date ? new Date(selectedTicketDetails.pickup_date).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                    
                    {/* Items Table */}
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Items</h3>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedTicketDetails.items.map(item => (
                              <tr key={item.id}>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.clothing_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{item.quantity}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {item.starch_level && item.starch_level !== 'none' ? `Starch: ${item.starch_level}` : ''}
                                  {item.crease ? ' (Crease)' : ''}
                                TAMBAHAN KETERANGAN
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right">${item.item_total.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Financials & Instructions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                      <div>
                        {selectedTicketDetails.special_instructions && (
                          <>
                            <p className="text-sm font-medium text-gray-500">Special Instructions</p>
                            <p className="text-sm text-gray-800 p-3 bg-gray-50 rounded-md mt-1">{selectedTicketDetails.special_instructions}</p>
                          </>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-500">Subtotal</p>
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
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
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
      )}

    </div>
  );
}