import React, { useState, useEffect } from 'react';
import { Search, Package, User, Phone, Calendar, MapPin, Eye, Printer } from 'lucide-react';
import { apiCall } from '../hooks/useApi';
import { Ticket } from '../types';
import PrintPreviewModal from './PrintPreviewModal';

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

  const searchTickets = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const results = await apiCall(`/find-tickets?query=${encodeURIComponent(searchQuery)}`);
      setTickets(results);
    } catch (error) {
      console.error('Failed to search tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentReceiptHtml = (ticketParam?: Ticket) => {
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
          ${cfg.readyDate.enabled ? `<div style="display:flex; justify-content: space-between; margin-bottom:8px;"><div>${cfg.readyDate.label}:</div><div>${now.toLocaleDateString()} ${now.toLocaleTimeString()}</div></div>` : ''}
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
      const ticket = await apiCall(`/tickets/${ticketId}`);
      setSelectedTicket(ticket);
    } catch (error) {
      console.error('Failed to load ticket details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dropped_off': return 'bg-amber-100 text-amber-800';
      case 'in_process': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'picked_up': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'dropped_off': return 'Dropped Off';
      case 'in_process': return 'In Process';
      case 'ready': return 'Ready for Pickup';
      case 'picked_up': return 'Picked Up';
      default: return status;
    }
  };

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
    const readyDate = new Date(ticket.created_at);
    readyDate.setDate(readyDate.getDate() + 2);

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
          <strong>Ready:</strong> <strong>${readyDate.toLocaleDateString()} 05:00 PM</strong>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <div style="display:inline-block; background:#000; color:#fff; padding:10px 18px; border-radius:4px; font-size:24px;">REG/PICKUP</div>
          <div style="margin-top:8px;">Thank You For Your Business</div>
        </div>
      </div>
    `;
  };

  function generatePlantReceiptHtml() {
    if (!selectedTicket) return '';
    const now = new Date();
    const items = selectedTicket.items || [];
    // Plant receipt: show plant_price only, do not fallback to item_total
    const subtotal = items.reduce((sum, item) => {
      const price = typeof item.plant_price === 'number' ? item.plant_price : 0;
      const qty = typeof item.quantity === 'number' ? item.quantity : 0;
      return sum + price * qty;
    }, 0);
    const envCharge = subtotal * 0.047;
    const tax = subtotal * 0.0825;
    const total = subtotal + envCharge + tax;
    const readyDate = new Date(selectedTicket.created_at);
    readyDate.setDate(readyDate.getDate() + 2);
    const cfg = readReceiptConfig();
    return `
      <div style="width: 400px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif; font-size: 16px;">
        <div style="text-align: center;">
          ${cfg.ticketNumber.enabled ? `<div style="font-size:36px;font-weight:700;margin-bottom:20px;"><strong>${selectedTicket.ticket_number ?? ''}</strong></div>` : ''}
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Airport Cleaners</div>
          <div style="font-size: 18px;">12300 Fondren Road, Houston TX 77035</div>
          <div style="font-size: 18px;">(713) 723-5579</div>
        </div>
        ${cfg.readyDate.enabled ? `<div style="display: flex; justify-content: space-between; margin: 20px 0; font-size: 18px;"><div><strong>${new Date().toLocaleDateString()}</strong> <strong>${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</strong></div></div>` : ''}
        <div style="font-size: 20px; margin-bottom: 16px;">
          <div style="font-weight: 500; margin-bottom: 4px;">${selectedTicket.customer_name ?? ''}</div>
          <div style="margin-bottom: 4px;">Phone: ${selectedTicket.customer_phone ?? ''}</div>
          <div>ACCT: ${selectedTicket.customer_id ?? ''}</div>
        </div>
        <div style="margin: 20px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 12px 0;">
          ${items.map((item) => {
            const price = typeof item.plant_price === 'number' ? item.plant_price : 0;
            const qty = typeof item.quantity === 'number' ? item.quantity : 0;
            return `
              <div style=\"margin-bottom: 12px; font-size: 18px;\">
                <div style=\"display: flex; justify-content: space-between;\">
                  <div style=\"font-weight: 700;\">${item.clothing_name ?? ''} x${qty}</div>
                  <div style=\"font-weight: 700;\">$${(price * qty).toFixed(2)}</div>
                </div>
                ${item.starch_level && item.starch_level !== 'no_starch' ? `<div style=\\"color: #444;\\">${item.starch_level} Starch</div>` : ''}
                ${item.crease === 'crease' ? '<div style=\\"color: #444;\\">With Crease</div>' : ''}
              </div>
            `;
          }).join('')}
        </div>
        ${cfg.items.enabled ? `<div style="font-size: 20px; font-weight: 600; margin: 16px 0;">${items.reduce((sum, item) => sum + (typeof item.quantity === 'number' ? item.quantity : 0), 0)} PIECES</div>` : ''}
        <div style="margin: 16px 0; font-size: 18px;">
          ${cfg.subtotal.enabled ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><div><strong>${cfg.subtotal.label}:</strong></div><div><strong>$${subtotal.toFixed(2)}</strong></div></div>` : ''}
          ${cfg.envCharge.enabled ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><div><strong>${cfg.envCharge.label}:</strong></div><div><strong>$${envCharge.toFixed(2)}</strong></div></div>` : ''}
          ${cfg.tax.enabled ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><div><strong>${cfg.tax.label}:</strong></div><div><strong>$${tax.toFixed(2)}</strong></div></div>` : ''}
          ${cfg.total.enabled ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 20px; font-weight: 600;"><div><strong>${cfg.total.label}:</strong></div><div><strong>$${total.toFixed(2)}</strong></div></div>` : ''}
        </div>
        ${cfg.readyDate.enabled ? `<div style="text-align: center; margin: 20px 0; font-size: 20px; font-weight: 500;">Ready: ${readyDate.toLocaleDateString()} 05:00 PM</div>` : ''}
        <div style="text-align: center; margin: 20px 0;">
          <div style="font-size: 28px; font-weight: 600; margin-bottom: 8px;">PLANT RECEIPT</div>
          <div style="font-size: 18px;">For Plant Use Only</div>
        </div>
      </div>
    `;
  }

  // Utility function for formatting date
  function formatDateTime(date: string | number | Date) {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }

  // When ticket is selected, initialize editableItems
  useEffect(() => {
    if (selectedTicket && selectedTicket.items) {
      setEditableItems(selectedTicket.items.map((item: any) => ({
        ...item,
        plant_price: item.plant_price,
        margin: item.margin,
      })));
    }
  }, [selectedTicket]);

  const handleItemChange = (index: number, field: string, value: string) => {
    const updated = [...editableItems];
    updated[index][field] = value;
    setEditableItems(updated);
  };

  const handleSaveEdits = async () => {
    if (selectedTicket) {
      try {
        // Call backend API to update ticket items
        await apiCall(`/tickets/${selectedTicket.id}/update-items`, {
          method: 'POST',
          body: JSON.stringify({ items: editableItems }),
          headers: { 'Content-Type': 'application/json' },
        });
        // Update local state after successful backend update
        selectedTicket.items = editableItems;
        setShowEditModal(false);
      } catch (error) {
        console.error('Failed to update ticket items:', error);
        // Optionally show error to user
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Ticket Management</h2>
        <p className="text-gray-600">Search and view customer tickets</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by ticket number, customer name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchTickets()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={searchTickets}
            disabled={loading || !searchQuery.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      {tickets.length > 0 && !selectedTicket && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Search Results ({tickets.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="font-medium text-lg">#{ticket.ticket_number}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>{getStatusText(ticket.status)}</span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {ticket.customer_name}
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {ticket.customer_phone}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDateTime(ticket.drop_off_date || ticket.created_at)}
                      </div>
                      {ticket.rack_number && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          Rack #{ticket.rack_number}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right mr-4">
                      <div className="text-lg font-bold text-gray-900">${ticket.total_amount.toFixed(2)}</div>
                    </div>
                    <button
                      onClick={() => loadTicketDetails(ticket.id)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedTicket && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Ticket Details</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setPrintContent(generateTicketHtml());
                    setShowPrintPreview(true);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Customer Receipt
                </button>
                <button
                  onClick={() => {
                    setPrintContent(generatePlantReceiptHtml());
                    setShowPrintPreview(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Plant Receipt
                </button>
                {/* Edit Receipt as a styled button beside print buttons */}
                <button
                  onClick={() => setShowEditModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '16px',
                    marginBottom: '0',
                    padding: 0,
                  }}
                >
                  Edit Receipt
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium mb-3">Ticket Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Ticket Number:</strong> #{selectedTicket.ticket_number}</div>
                  <div><strong>Status:</strong> <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTicket.status)}`}>{getStatusText(selectedTicket.status)}</span></div>
                  <div><strong>Drop-off Date:</strong> {formatDateTime(selectedTicket.drop_off_date || selectedTicket.created_at)}</div>
                  {selectedTicket.pickup_date && (<div><strong>Pickup Date:</strong> {formatDateTime(selectedTicket.pickup_date)}</div>)}
                  {selectedTicket.rack_number && (<div><strong>Rack Location:</strong> #{selectedTicket.rack_number}</div>)}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {selectedTicket.customer_name}</div>
                  <div><strong>Phone:</strong> {selectedTicket.customer_phone}</div>
                  {selectedTicket.customer_address && (<div><strong>Address:</strong> {selectedTicket.customer_address}</div>)}
                </div>
              </div>
            </div>
            {selectedTicket.items && selectedTicket.items.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedTicket.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                      <div>
                        <span className="font-medium">{item.clothing_name}</span>
                        <span className="text-gray-600 ml-2">×{item.quantity}</span>
                        <div className="text-sm text-gray-500">
                          {item.starch_level !== 'no_starch' && `${item.starch_level} starch`}
                          {item.starch_level !== 'no_starch' && item.crease === 'crease' && ', '}
                          {item.crease === 'crease' && 'with crease'}
                        </div>
                      </div>
                      <span className="font-medium">${item.item_total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedTicket.special_instructions && (
              <div className="mb-6 p-4 bg-amber-50 rounded-lg">
                <h4 className="font-medium mb-2">Special Instructions</h4>
                <p className="text-gray-700">{selectedTicket.special_instructions}</p>
              </div>
            )}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-2xl font-bold text-blue-600">Total: ${selectedTicket.total_amount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
      {tickets.length === 0 && searchQuery && !loading && (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-500">Try searching with a different ticket number, customer name, or phone number</p>
        </div>
      )}
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onPrint={() => setShowPrintPreview(false)}
        content={printContent}
      />
      {/* Edit/Save button */}
      {selectedTicket && (
        <div>
          {/* Edit Receipt as a styled button */}
          <button
            onClick={() => setShowEditModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '16px',
              marginBottom: '12px',
              padding: 0,
            }}
          >
            Edit Receipt
          </button>
          {/* Edit Modal */}
          {showEditModal && (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}>
              <div className="modal-content" style={{ background: '#fff', padding: 24, borderRadius: 8, maxWidth: 500, margin: '80px auto', position: 'relative' }}>
                <h2>Edit Receipt</h2>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Plant Value</th>
                      <th>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editableItems.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td>{item.description}</td>
                        <td>{item.quantity}</td>
                        <td>
                          <input
                            type="number"
                            value={item.plant_price}
                            onChange={e => handleItemChange(idx, 'plant_price', e.target.value)}
                            style={{ width: 80 }}
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.margin}
                            onChange={e => handleItemChange(idx, 'margin', e.target.value)}
                            style={{ width: 80 }}
                            step="0.01"
                            min="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <button onClick={() => setShowEditModal(false)} style={{ marginRight: 8 }}>Cancel</button>
                  <button onClick={handleSaveEdits}>Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
