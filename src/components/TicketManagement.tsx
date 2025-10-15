import React, { useState, useEffect } from 'react';
import { Search, Package, User, Phone, Calendar, MapPin, Eye, Printer, Edit3 } from 'lucide-react';
import { apiCall } from '../hooks/useApi';
import { Ticket } from '../types';
import PrintPreviewModal from './PrintPreviewModal';

// Assuming the Ticket type (from '../types') now includes:
// Ticket.pickup_date (string)
// Ticket.items[].plant_price (number)
// Ticket.items[].margin (number)

export default function TicketManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printContent, setPrintContent] = useState('');

  // Receipt config read from localStorage (platform admin can edit via ReceiptConfig UI)
  const RECEIPT_STORAGE_KEY = 'receipt_elements_v1';
  type ReceiptElements = {
    ticketNumber: { enabled: boolean; label: string };
    readyDate: { enabled: boolean; label: string };
    items: { enabled: boolean; label: string };
    subtotal: { enabled: boolean; label: string };
    envCharge: { enabled: boolean; label: string };
    tax: { enabled: boolean; label: string };
    total: { enabled: boolean; label: string };
    paid: { enabled: boolean; label: string };
    balance: { enabled: boolean; label: string };
  };
  const DEFAULT_RECEIPT_CONFIG: ReceiptElements = {
    ticketNumber: { enabled: true, label: 'Ticket Number' },
    readyDate: { enabled: true, label: 'Ready Date/Time' },
    items: { enabled: true, label: 'Items' },
    subtotal: { enabled: true, label: 'SubTotal' },
    envCharge: { enabled: true, label: 'Env Charge' },
    tax: { enabled: true, label: 'Tax' },
    total: { enabled: true, label: 'Total' },
    paid: { enabled: true, label: 'Paid Amount' },
    balance: { enabled: true, label: 'Balance' },
  };

  const readReceiptConfig = (): ReceiptElements => {
    try {
      const raw = localStorage.getItem(RECEIPT_STORAGE_KEY);
      if (!raw) return DEFAULT_RECEIPT_CONFIG;
      return JSON.parse(raw) as ReceiptElements;
    } catch (e) {
      return DEFAULT_RECEIPT_CONFIG;
    }
  };

  // Add state for modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editableItems, setEditableItems] = useState<any[]>([]);

  // Function to initialize the editing modal state
  const handleEditClick = () => {
    if (selectedTicket && selectedTicket.items) {
      // Map the ticket items to editable state, adding a description field for display
      setEditableItems(selectedTicket.items.map(item => ({
        ...item,
        description: item.clothing_name // Use clothing_name for display in the modal table
      })));
      setShowEditModal(true);
    }
  };

  // Function to handle changes in item properties (plant_price, margin)
  const handleItemChange = (index: number, field: string, value: string | number) => {
    setEditableItems(prev => {
      const newItems = [...prev];
      // Convert to number for price/margin fields
      const parsedValue = (field === 'plant_price' || field === 'margin' || field === 'item_total' || field === 'quantity') 
        ? parseFloat(String(value) || '0') 
        : value;
        
      newItems[index] = {
        ...newItems[index],
        [field]: parsedValue
      };
      return newItems;
    });
  };

  // Function to save the edited items to the backend
  const handleSaveEdits = async () => {
    if (!selectedTicket) return;
    setLoading(true);
    try {
      // The backend expects an array of TicketItem objects
      const itemsToUpdate = editableItems.map(item => ({
        clothing_type_id: item.clothing_type_id,
        quantity: item.quantity,
        starch_level: item.starch_level,
        crease: item.crease,
        item_total: item.item_total, 
        plant_price: item.plant_price, // Sending the updated plant price
        margin: item.margin,           // Sending the updated margin
      }));

      const updatedTicket = await apiCall(`/tickets/${selectedTicket.id}/items`, {
        method: 'PUT',
        body: JSON.stringify(itemsToUpdate),
      });

      // Update the selected ticket with fresh data and close modal
      setSelectedTicket(updatedTicket);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to save ticket edits:', error);
      alert('Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const searchTickets = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      // NOTE: This call should return an array of tickets, potentially from a list endpoint
      const results = await apiCall(`/api/tickets?query=${encodeURIComponent(searchQuery)}`); // Assuming a search endpoint exists
      setTickets(results);
    } catch (error) {
      console.error('Failed to search tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentReceiptHtml = (ticketParam?: Ticket) => {
    // ... (No changes needed here, focuses on customer price)
    const ticket = ticketParam || selectedTicket;
    if (!ticket) return '';
    const cfg = readReceiptConfig();
    const now = new Date();
    const items = ticket.items || [];
    const subtotal = items.reduce((sum, item) => sum + (typeof item.item_total === 'number' ? item.item_total : 0), 0);
    const envCharge = subtotal * 0.047;
    const tax = subtotal * 0.0825;
    const total = subtotal + envCharge + tax;
    const paid = ticket.paid_amount || 0;
    const balance = total - paid;

    return `
      <div style="width: 400px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif; font-size: 16px;">
        <div style="text-align: center;">
          ${cfg.ticketNumber.enabled ? `<div style="font-size: 36px; font-weight: 700; margin-bottom: 12px;">${cfg.ticketNumber.label ? `<strong>${ticket.ticket_number ?? ''}</strong>` : (ticket.ticket_number ?? '')}</div>` : ''}
          <div style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">PAYMENT RECEIPT</div>
          <div style="font-size: 18px;">${ticket.customer_name ?? ''}</div>
        </div>
        <div style="margin: 16px 0; font-size: 16px;">
          ${cfg.readyDate.enabled ? `<div style="display:flex; justify-content: space-between; margin-bottom:8px;"><div>${cfg.readyDate.label}:</div><div>${new Date(ticket.pickup_date || now).toLocaleDateString()} ${new Date(ticket.pickup_date || now).toLocaleTimeString()}</div></div>` : ''}
          ${cfg.subtotal.enabled ? `<div style="display:flex; justify-content: space-between; margin-bottom:8px;"><div>${cfg.subtotal.label}:</div><div>$${subtotal.toFixed(2)}</div></div>` : ''}
          ${cfg.envCharge.enabled ? `<div style="display:flex; justify-content: space-between; margin-bottom:8px;"><div>${cfg.envCharge.label}:</div><div>$${envCharge.toFixed(2)}</div></div>` : ''}
          ${cfg.tax.enabled ? `<div style="display:flex; justify-content: space-between; margin-bottom:8px;"><div>${cfg.tax.label}:</div><div>$${tax.toFixed(2)}</div></div>` : ''}
          ${cfg.total.enabled ? `<div style="display:flex; justify-content: space-between; margin-bottom:8px; font-weight:600;"><div>${cfg.total.label}:</div><div>$${total.toFixed(2)}</div></div>` : ''}
          ${cfg.paid.enabled ? `<div style="display:flex; justify-content: space-between; margin-bottom:8px;"><div>${cfg.paid.label}:</div><div>$${paid.toFixed(2)}</div></div>` : ''}
          ${cfg.balance.enabled ? `<div style="display:flex; justify-content: space-between; font-weight:600;"><div>${cfg.balance.label}:</div><div>$${balance.toFixed(2)}</div></div>` : ''}
        </div>
        <div style="text-align:center; margin-top:18px; font-size:14px;">Thank you for your payment</div>
      </div>
    `;
  };

  const loadTicketDetails = async (ticketId: number) => {
    try {
      const ticket = await apiCall(`/api/tickets/${ticketId}`);
      setSelectedTicket(ticket);
    } catch (error) {
      console.error('Failed to load ticket details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Ready': return 'bg-green-100 text-green-800';
      case 'Picked Up': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Pending': return 'Dropped Off';
      case 'Processing': return 'In Process';
      case 'Ready': return 'Ready for Pickup';
      case 'Picked Up': return 'Picked Up';
      default: return status;
    }
  };

  // 1. Update to use ticket.pickup_date
  const generateTicketHtml = (ticketParam?: Ticket) => {
    const ticket = ticketParam || selectedTicket;
    if (!ticket) return '';
    const now = new Date();
    const items = ticket.items || [];

    const subtotal = items.reduce((sum, item) => {
      const line = typeof item.item_total === 'number' ? item.item_total : 0;
      return sum + line;
    }, 0);
    const envCharge = subtotal * 0.047;
    const tax = subtotal * 0.0825;
    const total = subtotal + envCharge + tax;

    // Use pickup_date from the ticket object
    const pickupDate = ticket.pickup_date ? new Date(ticket.pickup_date) : null;
    const readyDateText = pickupDate 
      ? `${pickupDate.toLocaleDateString()} ${pickupDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` 
      : 'TBD';

    return `
      <div style="width: 400px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif; font-size: 16px;">
        <div style="text-align: center;">
          <div style="font-size: 36px; font-weight: 600; margin-bottom: 20px;"><strong>${ticket.ticket_number ?? ''}</strong></div>
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Airport Cleaners</div>
          <div style="font-size: 18px;">12300 Fondren Road, Houston TX 77035</div>
          <div style="font-size: 18px;">(713) 723-5579</div>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 20px 0; font-size: 18px;">
          <div><strong>${now.toLocaleDateString()}</strong> <strong>${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</strong></div>
        </div>
        <div style="font-size: 20px; margin-bottom: 16px;">
          <div style="font-weight: 500; margin-bottom: 4px;">${ticket.customer_name ?? ''}</div>
          <div style="margin-bottom: 4px;">Phone: ${ticket.customer_phone ?? ''}</div>
          <div>ACCT: ${ticket.customer_id ?? ''}</div>
        </div>
        <div style="margin: 20px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 12px 0;">
          ${items.map((item) => {
            const qty = typeof item.quantity === 'number' ? item.quantity : 0;
            const line = typeof item.item_total === 'number' ? item.item_total : 0;
            return `
              <div style="margin-bottom: 12px; font-size: 18px;">
                <div style="display: flex; justify-content: space-between;">
                  <div style="font-weight: 500;">${item.clothing_name ?? ''} x${qty}</div>
                  <div style="font-weight: 500;">$${line.toFixed(2)}</div>
                </div>
                ${item.starch_level && item.starch_level !== 'no_starch' ? `<div style="color: #444;">${item.starch_level} Starch</div>` : ''}
                ${item.crease === 'crease' ? '<div style="color: #444;">With Crease</div>' : ''}
              </div>
            `;
          }).join('')}
        </div>
        <div style="font-size: 20px; font-weight: 600; margin: 16px 0;">
          ${items.reduce((sum, item) => sum + (typeof item.quantity === 'number' ? item.quantity : 0), 0)} PIECES
        </div>
        <div style="margin: 16px 0; font-size: 18px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div><strong>SubTotal:</strong></div>
            <div><strong>$${subtotal.toFixed(2)}</strong></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div><strong>Env Charge:</strong></div>
            <div><strong>$${envCharge.toFixed(2)}</strong></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div><strong>Tax:</strong></div>
            <div><strong>$${tax.toFixed(2)}</strong></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 20px; font-weight: 600;">
            <div><strong>Total:</strong></div>
            <div><strong>$${total.toFixed(2)}</strong></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div><strong>Paid Amount:</strong></div>
            <div><strong>$${(ticket.paid_amount || 0).toFixed(2)}</strong></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div><strong>Balance:</strong></div>
            <div><strong>$${(total - (ticket.paid_amount || 0)).toFixed(2)}</strong></div>
          </div>
        </div>
        <div style="text-align: center; margin: 20px 0; font-size: 20px; font-weight: 500;">
          <strong>Ready:</strong> <strong>${readyDateText}</strong>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <div style="display:inline-block; background:#000; color:#fff; padding:10px 18px; border-radius:4px; font-size:24px;">REG/PICKUP</div>
          <div style="margin-top:8px;">Thank You For Your Business</div>
        </div>
      </div>
    `;
  };

  // 2. Complete function to use plant_price/margin
  function generatePlantReceiptHtml() {
    if (!selectedTicket) return '';
    const now = new Date();
    const items = selectedTicket.items || [];
    
    // Plant receipt: Calculate total cost based on plant_price (cost to the shop)
    const plantSubtotal = items.reduce((sum, item) => {
      const price = typeof item.plant_price === 'number' ? item.plant_price : 0;
      const qty = typeof item.quantity === 'number' ? item.quantity : 0;
      return sum + price * qty;
    }, 0);
    
    // Plant receipt calculation
    const marginTotal = items.reduce((sum, item) => {
        const margin = typeof item.margin === 'number' ? item.margin : 0;
        const qty = typeof item.quantity === 'number' ? item.quantity : 0;
        return sum + margin * qty;
    }, 0);
    
    const totalRevenue = plantSubtotal + marginTotal;

    const pickupDate = selectedTicket.pickup_date ? new Date(selectedTicket.pickup_date) : null;
    const readyDateText = pickupDate
      ? pickupDate.toLocaleString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
      : 'TBD';
      
    const cfg = readReceiptConfig(); 
    return `
      <div style="width:380px;margin:0 auto;font-family: 'Courier New', Courier, monospace;color:#111;font-size:13px;">
        <div style="text-align:center;">
          ${cfg.ticketNumber.enabled ? `<div style="font-size:16px;font-weight:800;">Airport Cleaners (PLANT COPY)</div><div style="font-size:14px;">12300 Fondren Road, Houston TX 77035</div><div style="margin-top:6px;">(713) 723-5579</div><div style="margin-top:8px;font-weight:900;font-size:16px;">Ticket Number: ${selectedTicket.ticket_number ?? ''}</div>` : ''}
        </div>
        ${cfg.readyDate.enabled ? `<div style="margin:6px 0;font-size:12px;">Order Date: ${new Date(selectedTicket.created_at || Date.now()).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</div>` : ''}
        ${cfg.readyDate.enabled ? `<div style="margin:6px 0;font-size:13px;font-weight:900;text-align:center;">Pickup Date: ${readyDateText}</div>` : ''}
        <div style="margin:8px 0;text-align:center;">****************************************</div>
        <div style="margin-bottom: 8px;">Customer: ${selectedTicket.customer_name ?? ''} | Phone: ${selectedTicket.customer_phone ?? ''}</div>
        <div style="margin:8px 0;text-align:center;">--- ITEM COSTS ---</div>
        <div>
          ${items.map((item) => { 
            const price = typeof item.plant_price === 'number' ? item.plant_price : 0;
            const margin = typeof item.margin === 'number' ? item.margin : 0;
            const qty = typeof item.quantity === 'number' ? item.quantity : 0;
            const lineCost = price * qty;
            const lineMargin = margin * qty;
            return `
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                <div style="width: 50%;">${item.clothing_name ?? ''} x${qty}</div>
                <div style="width: 25%; text-align: right;">Cost: $${lineCost.toFixed(2)}</div>
                <div style="width: 25%; text-align: right;">Margin: $${lineMargin.toFixed(2)}</div>
              </div>
              ${item.starch_level && item.starch_level !== 'no_starch' ? `<div style="color: #444; margin-left: 10px;">- ${item.starch_level} Starch</div>` : ''}
              ${item.crease === 'crease' ? '<div style="color: #444; margin-left: 10px;">- With Crease</div>' : ''}
            `;
          }).join('')}
        </div>
        <div style="margin:8px 0;border-top:1px dashed #000;padding-top:8px;">
          <div style="display:flex; justify-content: space-between; font-weight:900;">
            <div>Total Plant Cost:</div>
            <div>$${plantSubtotal.toFixed(2)}</div>
          </div>
          <div style="display:flex; justify-content: space-between; font-weight:900; margin-top:4px;">
            <div>Total Margin:</div>
            <div>$${marginTotal.toFixed(2)}</div>
          </div>
          <div style="display:flex; justify-content: space-between; font-weight:900; margin-top:8px; border-top:1px dashed #000; padding-top:4px;">
            <div>Total Revenue:</div>
            <div>$${totalRevenue.toFixed(2)}</div>
          </div>
        </div>
        <div style="margin-top:10px;text-align:center;font-weight:900;">${selectedTicket.special_instructions || 'NO SPECIAL INSTRUCTIONS'}</div>
        <div style="margin-top:10px;text-align:center;">*** END OF PLANT TICKET ***</div>
      </div>
    `;
  }
  
  // Helper to trigger plant print
  const handlePlantPrint = () => {
    const plantHtml = generatePlantReceiptHtml();
    setPrintContent(plantHtml);
    setShowPrintPreview(true);
    
    // Logic to print 2 copies in a new window
    try {
        const w = window.open('', '_blank');
        if (w) {
            w.document.write(plantHtml + plantHtml);
            w.document.close();
            w.focus();
            w.print();
            setTimeout(() => { try { w.close(); } catch (e) {} }, 500);
        }
    } catch (e) { console.error('Failed to open/print plant copy:', e); }
  }


  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Ticket Management</h1>

      {/* Search Bar */}
      <div className="flex space-x-2 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Ticket #, Customer Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') searchTickets(); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={searchTickets}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Ticket List */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rack</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.length === 0 && !loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No tickets found.</td></tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.ticket_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ticket.customer_name}</div>
                    <div className="text-sm text-gray-500">{ticket.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ticket.total_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.rack_number || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => loadTicketDetails(ticket.id)}
                      className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Details Modal/Panel */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-8 transform transition-all">
            
            <div className="flex justify-between items-start border-b pb-4 mb-6">
              <h2 className="text-3xl font-extrabold text-gray-900">Ticket #{selectedTicket.ticket_number}</h2>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
              >&times;</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              {/* Left Column: Customer & Ticket Info */}
              <div>
                <h3 className="text-xl font-semibold mb-3 border-b pb-2 text-blue-600">Customer Details</h3>
                <div className="space-y-3 text-lg">
                  <div className="flex items-center space-x-3 text-gray-800">
                    <User size={20} className="text-blue-500" />
                    <span>{selectedTicket.customer_name} (ID: {selectedTicket.customer_id})</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Phone size={20} className="text-blue-500" />
                    <span>{selectedTicket.customer_phone}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <MapPin size={20} className="text-blue-500" />
                    <span>{selectedTicket.customer_address || 'Address Not Provided'}</span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mt-6 mb-3 border-b pb-2 text-blue-600">Ticket Details</h3>
                <div className="space-y-3 text-lg">
                    <div className="flex items-center space-x-3 text-gray-800">
                        <Package size={20} className="text-green-500" />
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                            {getStatusText(selectedTicket.status)}
                        </span>
                    </div>
                    {/* NEW DETAIL: Pickup Date */}
                    {selectedTicket.pickup_date && (
                        <div className="flex items-center space-x-3 text-gray-800">
                            <Calendar size={20} className="text-green-500" />
                            <span>**Ready Date:** {new Date(selectedTicket.pickup_date).toLocaleDateString()}</span>
                        </div>
                    )}
                    <div className="flex items-center space-x-3 text-gray-800">
                        <span className="font-semibold">Rack:</span>
                        <span className={`font-mono px-3 py-1 text-sm rounded-md ${selectedTicket.rack_number ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-500'}`}>
                            {selectedTicket.rack_display}
                        </span>
                    </div>
                    <p className="pt-4 text-gray-700 italic border-t mt-4">
                        **Instructions:** {selectedTicket.special_instructions || 'None'}
                    </p>
                </div>
              </div>

              {/* Right Column: Items and Totals */}
              <div>
                <h3 className="text-xl font-semibold mb-3 border-b pb-2 text-blue-600 flex justify-between items-center">
                    <span>Order Items ({selectedTicket.items?.length || 0})</span>
                    <button 
                        onClick={handleEditClick}
                        className="text-sm font-normal text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                    >
                        <Edit3 size={16} />
                        <span>Edit Costs</span>
                    </button>
                </h3>
                
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {selectedTicket.items?.map((item, index) => (
                    <li key={index} className="border-b pb-2">
                      <div className="flex justify-between text-lg font-medium text-gray-800">
                        <span>{item.clothing_name} x {item.quantity}</span>
                        <span>${item.item_total.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                          {item.starch_level && item.starch_level !== 'no_starch' && `Starch: ${item.starch_level}`}
                          {item.starch_level && item.starch_level !== 'no_starch' && item.crease === 'crease' && ' | '}
                          {item.crease === 'crease' && 'Crease: Yes'}
                          {/* Displaying plant_price and margin for internal users */}
                          <span className="ml-4 text-xs text-red-500"> (Cost: ${item.plant_price.toFixed(2)}, Margin: ${item.margin.toFixed(2)}) </span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-4 border-t border-gray-300 space-y-2 text-lg">
                    <div className="flex justify-between font-medium">
                        <span>Total Amount:</span>
                        <span>${selectedTicket.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                        <span>Paid Amount:</span>
                        <span>${selectedTicket.paid_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold text-red-600 pt-2 border-t mt-2">
                        <span>Balance Due:</span>
                        <span>${(selectedTicket.total_amount - selectedTicket.paid_amount).toFixed(2)}</span>
                    </div>
                </div>
              </div>
            </div>

            {/* Print/Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
              <button 
                onClick={() => { 
                  setPrintContent(generateTicketHtml()); 
                  setShowPrintPreview(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Printer size={18} />
                <span>Print Customer Receipt</span>
              </button>
              <button 
                onClick={handlePlantPrint}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Printer size={18} />
                <span>Print Plant Copy (x2)</span>
              </button>
            </div>
          </div>
          
          {/* Edit Items Modal (Modal JSX is simplified here but corresponds to the structure in the file snippet) */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl w-full max-w-2xl p-6">
                <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Edit Item Costs (Ticket #{selectedTicket.ticket_number})</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Plant Cost</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {editableItems.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-2 text-sm">{item.description}</td>
                        <td className="py-2 text-sm">{item.quantity}</td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={item.plant_price}
                            onChange={e => handleItemChange(idx, 'plant_price', e.target.value)}
                            style={{ width: 80 }}
                            step="0.01"
                            min="0"
                            className="border rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={item.margin}
                            onChange={e => handleItemChange(idx, 'margin', e.target.value)}
                            style={{ width: 80 }}
                            step="0.01"
                            min="0"
                            className="border rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <button 
                    onClick={() => setShowEditModal(false)} 
                    style={{ marginRight: 8 }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >Cancel</button>
                  <button 
                    onClick={handleSaveEdits}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onPrint={() => setShowPrintPreview(false)}
        content={printContent}
        extraActions={null} // Handled print actions directly on the main modal
      />
    </div>
  );
}