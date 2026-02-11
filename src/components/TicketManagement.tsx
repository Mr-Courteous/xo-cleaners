import React, { useState, useEffect } from 'react';
import { useColors } from '../state/ColorsContext';
import { 
  Search, Package, User, Calendar, MapPin, 
  Eye, Printer, Edit3, 
  Ban, RefreshCcw, RotateCcw, DollarSign, Loader2, Filter, X
} from 'lucide-react';
import axios from 'axios'; 
import baseURL from '../lib/config'; 
import { Ticket, TicketItem } from '../types'; 
import PrintPreviewModal from './PrintPreviewModal';
import renderReceiptHtml from '../lib/receiptTemplate';
import renderPlantReceiptHtml from '../lib/plantReceiptTemplate';
import { renderPickupReceiptHtml } from '../lib/pickupReceiptTemplate';
import { generateTagHtml } from '../lib/tagTemplates'; 

// Define a type for the items being edited
interface EditableItem {
  item_id: number;
  name: string;
  quantity: number;
  item_total: number;
}

export default function TicketManagement() {
  const { colors } = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' as 'success' | 'error' });
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [rackFilter, setRackFilter] = useState('');
  
  // Printing States
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [customerPrintContent, setCustomerPrintContent] = useState('');      
  const [plantPrintContent, setPlantPrintContent] = useState(''); 
  const [tagPrintContent, setTagPrintContent] = useState('');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedItems, setEditedItems] = useState<EditableItem[]>([]);

  // --- Fetch All Tickets on Mount ---
  useEffect(() => {
    fetchAllTickets();
  }, []);

  // --- Apply Filters Whenever Filter State Changes ---
  useEffect(() => {
    applyFilters();
  }, [allTickets, searchQuery, statusFilter, dateFromFilter, dateToFilter, rackFilter]);

  // --- Fetch All Tickets ---
  const fetchAllTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token not found");
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.get(
        `${baseURL}/api/organizations/tickets`,
        { headers }
      );
      setAllTickets(response.data || []);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.detail || 'Failed to load tickets. Please try again.';
      setError(errorMsg);
      setModal({ isOpen: true, title: 'Load Error', message: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- Apply Filters ---
  const applyFilters = () => {
    let result = [...allTickets];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.ticket_number?.toLowerCase().includes(query) ||
        t.customer_name?.toLowerCase().includes(query) ||
        t.customer_phone?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter) {
      result = result.filter(t => t.status === statusFilter);
    }

    // Filter by date range
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      result = result.filter(t => {
        const ticketDate = new Date(t.created_at);
        return ticketDate >= fromDate;
      });
    }

    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(t => {
        const ticketDate = new Date(t.created_at);
        return ticketDate <= toDate;
      });
    }

    // Filter by rack number
    if (rackFilter) {
      result = result.filter(t => String(t.rack_number) === rackFilter);
    }

    setFilteredTickets(result);
  };

  // --- Clear All Filters ---
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
    setDateFromFilter('');
    setDateToFilter('');
    setRackFilter('');
  };

  // --- Search Tickets (Now integrated with filtering) ---
  const searchTickets = async () => {
    applyFilters();
  };

  // --- View Details Modal ---
  const openViewModal = async (ticketId: number) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token not found");
      const response = await axios.get(`${baseURL}/api/organizations/tickets/${ticketId}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      setSelectedTicket(response.data);
      console.log('Selected Ticket Details:', response.data);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.detail || 'Failed to fetch ticket details.';
      setError(errorMsg);
      setModal({ isOpen: true, title: 'Load Error', message: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- Printing Logic (UPDATED FOR CENTERING) ---
    // --- Printing Logic ---
  const handlePrintJob = (htmlContent: string) => {
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    printFrame.contentDocument?.write(`
      <html>
        <head>

          <title>Print</title>

          
          <style>
            @page { size: 55mm auto; margin: 0; }
            @media print {
              html, body { margin: 0; padding: 0; }
              .page-break-receipt { 
                page-break-after: always; 
                break-after: page;
              }
            }
            body { font-family: sans-serif; }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `);
    printFrame.contentDocument?.close();
    printFrame.contentWindow?.focus();
    setTimeout(() => {
        printFrame.contentWindow?.print();
        setTimeout(() => {
            if(document.body.contains(printFrame)) {
                document.body.removeChild(printFrame);
            }
        }, 1000);
    }, 100);
  };

  const openPrintModal = async (ticket: Ticket) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const response = await axios.get(`${baseURL}/api/organizations/tickets/${ticket.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fullTicket: Ticket = response.data; 
      
      // Generate all versions
      const customerHtml = fullTicket.status === 'picked_up' 
        ? renderPickupReceiptHtml(fullTicket) 
        : renderReceiptHtml(fullTicket);
      
      const plantHtml = renderPlantReceiptHtml(fullTicket);
      const tagsHtml = generateTagHtml(fullTicket); 

      setCustomerPrintContent(customerHtml);
      setPlantPrintContent(plantHtml);
      setTagPrintContent(tagsHtml);
      
      setShowPrintPreview(true);
    } catch (error) {
      alert('Failed to fetch ticket for printing.');
    } finally {
      setLoading(false);
    }
  };

  // Specific Print Handlers
  const handlePrintCustomer = () => {
    handlePrintJob(customerPrintContent);
    setShowPrintPreview(false);
  };

  const handlePrintPlant = () => {
    handlePrintJob(plantPrintContent);
    setShowPrintPreview(false);
  };

  const handlePrintTags = () => {
    handlePrintJob(tagPrintContent);
    setShowPrintPreview(false);
  };


  const handlePrintAll = () => {
    const combinedHtml = `
      <div class="page-break-receipt">${customerPrintContent}</div>
      <div class="page-break-receipt">${plantPrintContent}</div>
      <div>${tagPrintContent}</div>
    `;
    handlePrintJob(combinedHtml);
    setShowPrintPreview(false);
  };

  // --- Edit Logic ---
  const openEditModal = async (ticket: Ticket) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const response = await axios.get(`${baseURL}/api/organizations/tickets/${ticket.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fullTicket = response.data;
      setSelectedTicket(fullTicket);
      setEditedItems(fullTicket.items.map((item: TicketItem) => ({
        item_id: item.id, name: item.clothing_name, quantity: item.quantity, item_total: item.item_total
      })));
      setShowEditModal(true);
    } catch (error) {
      alert('Failed to load ticket for editing.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedTicket) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      await axios.put(
        `${baseURL}/api/organizations/tickets/${selectedTicket.id}/edit`,
        { items: editedItems.map(i => ({ item_id: i.item_id, quantity: i.quantity, item_total: i.item_total })) },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      alert('Ticket updated successfully!');
      setShowEditModal(false);
      setSelectedTicket(null);
      fetchAllTickets(); 
    } catch (error: any) {
      alert(`Failed to save: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTION HANDLER (Toggle Void / Refund) ---
  const toggleAction = async (ticket: Ticket, actionType: 'void' | 'refund') => {
    const isVoiding = actionType === 'void' && !ticket.is_void;
    const isUnvoiding = actionType === 'void' && ticket.is_void;
    const isRefunding = actionType === 'refund' && !ticket.is_refunded;
    const isUndoingRefund = actionType === 'refund' && ticket.is_refunded;

    let confirmMsg = "";
    if (isVoiding) confirmMsg = "Are you sure you want to VOID this ticket?";
    if (isUnvoiding) confirmMsg = "Restore this voided ticket to 'Received'?";
    if (isRefunding) confirmMsg = "Mark this ticket as REFUNDED?";
    if (isUndoingRefund) confirmMsg = "Undo REFUND status?";

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      
      const endpoint = actionType === 'void' ? 'void' : 'refund';
      
      const response = await axios.patch(
        `${baseURL}/api/organizations/tickets/${ticket.id}/${endpoint}`, 
        {}, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const { is_void, is_refunded, status, message } = response.data;

      // Update Local State for Both Lists
      setAllTickets(prev => prev.map(t => {
        if (t.id !== ticket.id) return t;
        return { 
            ...t, 
            ...(is_void !== undefined && { is_void }),
            ...(is_refunded !== undefined && { is_refunded }),
            ...(status !== undefined && { status })
        };
      }));

      setFilteredTickets(prev => prev.map(t => {
        if (t.id !== ticket.id) return t;
        return { 
            ...t, 
            ...(is_void !== undefined && { is_void }),
            ...(is_refunded !== undefined && { is_refunded }),
            ...(status !== undefined && { status })
        };
      }));
      
      // Update Modal if open
      if (selectedTicket && selectedTicket.id === ticket.id) {
         setSelectedTicket(prev => prev ? { 
             ...prev, 
             ...(is_void !== undefined && { is_void }),
             ...(is_refunded !== undefined && { is_refunded }),
             ...(status !== undefined && { status })
         } : null);
      }
      
      alert(message);

    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.detail || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchTickets()}
            placeholder="Search by Ticket #, Name, or Phone..."
            className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none"
            style={{ boxShadow: undefined }}
          />
          <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="px-4 py-3 text-white rounded-lg flex items-center gap-2"
              style={{ backgroundColor: colors.primaryColor }}
          >
            <Filter className="h-5 w-5" />
            Filters
          </button>
          <button 
              onClick={fetchAllTickets} 
              disabled={loading} 
              className="px-4 py-3 text-white rounded-lg disabled:bg-gray-400"
              style={{ backgroundColor: colors.secondaryColor }}
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Filters</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={statusFilter || ''}
                  onChange={(e) => setStatusFilter(e.target.value || null)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="received">Received</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="voided">Voided</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input 
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input 
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* Rack Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rack Number</label>
                <input 
                  type="text"
                  value={rackFilter}
                  onChange={(e) => setRackFilter(e.target.value)}
                  placeholder="e.g., A1"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="pt-2 border-t border-gray-200">
              <button 
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && !selectedTicket && !showEditModal && (
        <div className="text-center p-6 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: colors.primaryColor }} />
            Loading...
        </div>
      )}

      {/* Results Summary */}
      {!loading && (
        <div className="mb-4 text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredTickets.length}</span> of <span className="font-semibold">{allTickets.length}</span> tickets
        </div>
      )}

      {/* No Results */}
      {!loading && filteredTickets.length === 0 && (
         <div className="text-center p-6 text-gray-500">
             <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
             <p>{allTickets.length === 0 ? 'No tickets available.' : 'No tickets match your filters.'}</p>
         </div>
      )}

      {/* Ticket List */}
      {!loading && filteredTickets.length > 0 && !selectedTicket && !showEditModal && (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const isVoid = ticket.is_void || false;
            const isRefunded = ticket.is_refunded || false;

            let cardClasses = 'bg-white border-gray-200';
            if (isVoid) {
                cardClasses = 'bg-red-50 border-red-200';
            } else if (isRefunded) {
                cardClasses = 'bg-purple-50 border-purple-200';
            }

            return (
              <div 
                key={ticket.id} 
                className={`border rounded-lg shadow-sm p-5 relative overflow-hidden ${cardClasses}`}
              >
                
                {/* Visual Watermark for Void */}
                {isVoid && (
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Ban size={100} className="text-red-500" />
                  </div>
                )}

                {/* Visual Watermark for Refunded (if not void) */}
                {!isVoid && isRefunded && (
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <DollarSign size={100} className="text-purple-500" />
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold" style={{ color: isVoid ? '#dc2626' : colors.primaryColor, textDecoration: isVoid ? 'line-through' : undefined }}>
                          #{ticket.ticket_number}
                        </span>
                        {isVoid && <span className="px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#dc2626', borderRadius: 6 }}>VOID</span>}
                        {isRefunded && <span className="px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: colors.secondaryColor, borderRadius: 6 }}>REFUNDED</span>}
                    </div>
                    <div className="text-gray-700 mt-2 font-medium">
                        <User className="inline h-4 w-4 mr-2" />{ticket.customer_name}
                    </div>
                    <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Rack: {ticket.rack_number || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-2 md:mt-0 md:text-right">
                    <div>
                        <Calendar className="inline h-4 w-4 mr-2" />
                        Due: {ticket.pickup_date ? new Date(ticket.pickup_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </div>
                    <div className="mt-1">
                        Created: {new Date(ticket.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>
                        Status: <span className="font-medium">{ticket.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-gray-100 mt-4 pt-4 relative z-10">
                    <div className="text-lg font-bold text-gray-800">Total: ${ticket.total_amount.toFixed(2)}</div>
                  <div className="flex space-x-2">
                    <button onClick={() => openViewModal(ticket.id)} className="p-2 text-gray-500" title="View Details">
                        <Eye className="h-5 w-5" style={{ color: colors.primaryColor }} />
                    </button>
                    
                    {!isVoid && (
                      <>
                        <button onClick={() => openPrintModal(ticket)} className="p-2 text-gray-500" title="Print">
                          <Printer className="h-5 w-5" style={{ color: colors.primaryColor }} />
                        </button>
                        <button onClick={() => openEditModal(ticket)} className="p-2 text-gray-500" title="Edit">
                          <Edit3 className="h-5 w-5" style={{ color: colors.secondaryColor }} />
                        </button>
                      </>
                    )}

                    <button 
                      onClick={() => toggleAction(ticket, 'void')} 
                      className={`p-2`} 
                      title={isVoid ? "Unvoid Ticket" : "Void Ticket"}
                      style={isVoid ? { color: colors.secondaryColor, backgroundColor: `${colors.secondaryColor}12`, borderRadius: 6 } : { color: '#6b7280' }}
                    >
                      {isVoid ? <RotateCcw className="h-5 w-5" style={{ color: colors.secondaryColor }} /> : <Ban className="h-5 w-5" />}
                    </button>

                    {!isVoid && (
                        <button 
                          onClick={() => toggleAction(ticket, 'refund')} 
                          className={`p-2`} 
                          title={isRefunded ? "Undo Refund" : "Mark as Refunded"}
                          style={isRefunded ? { color: colors.secondaryColor, backgroundColor: `${colors.secondaryColor}12`, borderRadius: 6 } : { color: '#6b7280' }}
                        >
                          {isRefunded ? <DollarSign className="h-5 w-5" style={{ color: colors.secondaryColor }} /> : <RefreshCcw className="h-5 w-5" />}
                        </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL: View Details --- */}
      {selectedTicket && !showEditModal && !showPrintPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 m-4 relative overflow-y-auto max-h-[90vh]">
                <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-xl font-bold">Ticket #{selectedTicket.ticket_number}</h3>
                    {selectedTicket.is_void && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-sm font-bold">VOID</span>}
                    {selectedTicket.is_refunded && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-sm font-bold">REFUNDED</span>}
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-500 text-sm">Customer</p>
                            <p className="font-semibold">{selectedTicket.customer_name}</p>
                            <p className="text-sm">{selectedTicket.customer_phone}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-sm">Status</p>
                            <p className="font-semibold">{selectedTicket.status.replace('_', ' ').toUpperCase()}</p>
                            <p className="text-sm">Rack: {selectedTicket.rack_number || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left">Item</th>
                                    <th className="px-4 py-2 text-right">Qty</th>
                                    <th className="px-4 py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {selectedTicket.items?.map(i => (
                                    <tr key={i.id}>
                                        <td className="px-4 py-2">{i.clothing_name}</td>
                                        <td className="px-4 py-2 text-right">{i.quantity}</td>
                                        <td className="px-4 py-2 text-right">${i.item_total.toFixed(2)}</td>
                                    </tr>
                                )) || <tr><td colSpan={3} className="px-4 py-2 text-center text-gray-500">No items</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-right w-full">
                            <p className="text-sm text-gray-600">Paid: ${(selectedTicket.paid_amount || 0).toFixed(2)}</p>
                            <p className="text-xl font-bold" style={{ color: colors.primaryColor }}>Total: ${selectedTicket.total_amount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL: Edit Ticket --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4 overflow-y-auto max-h-[90vh]">
                <h3 className="text-xl font-bold mb-4">Edit Quantities / Prices</h3>
                <div className="space-y-3">
                    {editedItems.map((item, idx) => (
                        <div key={item.item_id} className="flex items-center gap-2">
                            <span className="flex-1 font-medium">{item.name}</span>
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Qty</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    className="border rounded px-2 py-1 w-16 text-right" 
                                    value={item.quantity} 
                                    onChange={(e) => {
                                        const newItems = [...editedItems]; 
                                        newItems[idx].quantity = parseInt(e.target.value) || 0; 
                                        setEditedItems(newItems);
                                    }}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Total ($)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="0.01"
                                    className="border rounded px-2 py-1 w-24 text-right" 
                                    value={item.item_total} 
                                    onChange={(e) => {
                                         const newItems = [...editedItems]; 
                                         newItems[idx].item_total = parseFloat(e.target.value) || 0; 
                                         setEditedItems(newItems);
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button 
                        onClick={() => { setShowEditModal(false); setSelectedTicket(null); }} 
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button 
                      onClick={handleSaveEdits} 
                      disabled={loading}
                      className="px-4 py-2 text-white rounded disabled:opacity-50"
                      style={{ backgroundColor: colors.secondaryColor }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL: Print Preview --- */}
      <PrintPreviewModal 
        isOpen={showPrintPreview} 
        onClose={() => setShowPrintPreview(false)} 
        onPrint={() => {}} 
        content={customerPrintContent} 
        hideDefaultButton={true}
        extraActions={
          <>
            <button
              onClick={handlePrintCustomer}
              className="px-4 py-2 text-white rounded flex items-center gap-2 hover:opacity-95"
              style={{ backgroundColor: colors.primaryColor }}
            >
              <Printer size={18} /> Print Customer Only
            </button>

            <button
              onClick={handlePrintPlant}
              className="px-4 py-2 text-white rounded flex items-center gap-2 hover:opacity-95"
              style={{ backgroundColor: colors.secondaryColor }}
            >
              <Printer size={18} /> Print Plant Only
            </button>

            {tagPrintContent && (
              <button
                onClick={handlePrintTags}
                className="px-4 py-2 text-white rounded flex items-center gap-2 hover:opacity-95"
                style={{ backgroundColor: colors.brandColor }}
              >
                <Printer size={18} /> Print Tags Only
              </button>
            )}

            <button
              onClick={handlePrintAll}
              className="px-4 py-2 text-white rounded flex items-center gap-2 hover:opacity-95"
              style={{ backgroundImage: `linear-gradient(to right, ${colors.primaryColor}, ${colors.secondaryColor})` }}
            >
              <Printer size={18} /> Print All
            </button>
          </>
        }
      />

      {/* Error Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className={`text-lg font-bold mb-2 ${modal.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {modal.title}
            </h3>
            <p className="text-gray-600 mb-6">{modal.message}</p>
            <button
              onClick={() => setModal({ ...modal, isOpen: false })}
              className="w-full py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}