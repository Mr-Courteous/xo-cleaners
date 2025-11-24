import React, { useState, useEffect } from 'react';
import { Search, Package, User, Phone, Calendar, MapPin, Eye, Printer, Edit3 } from 'lucide-react';
import axios from 'axios'; 
import baseURL from '../lib/config'; 
import { Ticket, TicketItem } from '../types'; 
import PrintPreviewModal from './PrintPreviewModal';
import renderReceiptHtml from '../lib/receiptTemplate';
// Import the plant receipt template generator
import renderPlantReceiptHtml from '../lib/plantReceiptTemplate';

// NEW: Define a type for the items being edited
interface EditableItem {
  item_id: number;
  name: string;
  quantity: number;
  item_total: number;
}

export default function TicketManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Printing States
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printContent, setPrintContent] = useState('');      // Customer Receipt
  const [plantPrintContent, setPlantPrintContent] = useState(''); // Plant Receipt

  // State for Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedItems, setEditedItems] = useState<EditableItem[]>([]);

  // --- (Existing) searchTickets ---
  const searchTickets = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token not found");
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.get(
        `${baseURL}/api/organizations/find-tickets?query=${encodeURIComponent(searchQuery)}`,
        { headers }
      );
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to search tickets:', error);
      alert('Failed to search tickets.');
    } finally {
      setLoading(false);
    }
  };

  // --- (Existing) openViewModal ---
  const openViewModal = async (ticketId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token not found");
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.get(
        `${baseURL}/api/organizations/tickets/${ticketId}`,
        { headers }
      );
      setSelectedTicket(response.data);
      console.log('Fetched ticket details:', response.data);
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      alert('Failed to fetch ticket details.');
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: Handle Specialized Print Job ---
  // This handles creating the iframe, styles, and page breaks
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
              /* Force a real page break */
              .page-break { 
                page-break-before: always; 
                break-before: page;
                display: block; 
                height: 0; 
                overflow: hidden;
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

  // --- UPDATED: openPrintModal ---
  const openPrintModal = async (ticket: Ticket) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token not found");
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch the full ticket details to ensure we have items
      const response = await axios.get(
        `${baseURL}/api/organizations/tickets/${ticket.id}`,
        { headers }
      );
      const fullTicket: Ticket = response.data; 

      // 1. Generate Customer Receipt HTML
      const customerHtml = renderReceiptHtml(fullTicket);
      // 2. Generate Plant Receipt HTML
      const plantHtml = renderPlantReceiptHtml(fullTicket);

      setPrintContent(customerHtml);
      setPlantPrintContent(plantHtml);
      setShowPrintPreview(true);

    } catch (error) {
      console.error('Failed to fetch ticket for printing:', error);
      alert('Failed to fetch ticket details for printing.');
    } finally {
      setLoading(false);
    }
  };

  // --- (Existing) openEditModal ---
  const openEditModal = (ticket: Ticket) => {
    const fetchAndOpen = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const headers = { 'Authorization': `Bearer ${token}` };
        const response = await axios.get(`${baseURL}/api/organizations/tickets/${ticket.id}`, { headers });
        const fullTicket: Ticket = response.data;
        
        setSelectedTicket(fullTicket);
        setEditedItems(fullTicket.items.map((item: TicketItem) => ({
          item_id: item.id,
          name: item.clothing_name,
          quantity: item.quantity,
          item_total: item.item_total,
        })));
        setShowEditModal(true);
      } catch (error) {
        alert('Failed to load ticket for editing.');
      } finally {
        setLoading(false);
      }
    };
    fetchAndOpen();
  };

  // --- (Existing) handleEditChange ---
  const handleEditChange = (index: number, field: 'quantity' | 'item_total', value: string) => {
    const newItems = [...editedItems];
    const numericValue = field === 'quantity' ? parseInt(value) : parseFloat(value);
    
    if (isNaN(numericValue)) return;

    newItems[index] = { ...newItems[index], [field]: numericValue };
    setEditedItems(newItems);
  };

  // --- (Existing) handleSaveEdits ---
  const handleSaveEdits = async () => {
    if (!selectedTicket) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token not found");
      const headers = { 'Authorization': `Bearer ${token}` };

      const body = {
        items: editedItems.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
          item_total: item.item_total,
        })),
      };

      const response = await axios.put(
        `${baseURL}/api/organizations/tickets/${selectedTicket.id}/edit`,
        body,
        { headers }
      );

      const updatedTicket: Ticket = response.data;
      
      setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      
      setShowEditModal(false);
      setSelectedTicket(null);
      alert('Ticket updated successfully!');

    } catch (error: any) {
      console.error('Failed to save edits:', error);
      alert(`Failed to save edits: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchTickets()}
          placeholder="Search by Ticket #, Customer Name, or Phone..."
          className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={searchTickets}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* Loading & Results */}
      {loading && !selectedTicket && !showEditModal && (
        <div className="text-center p-6 text-gray-500">
          <p>Loading...</p>
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="text-center p-6 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No tickets found. Try another search.</p>
        </div>
      )}

      {/* Ticket List */}
      {!loading && tickets.length > 0 && !selectedTicket && !showEditModal && (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <span className="text-xl font-bold text-blue-600">#{ticket.ticket_number}</span>
                  <div className="flex items-center text-gray-700 mt-2">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">{ticket.customer_name}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Rack: {ticket.rack_number || 'N/A'}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-4 md:mt-0 md:text-right">
                  <div className="flex items-center justify-end">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Pickup By: {ticket.pickup_date ? new Date(ticket.pickup_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="mt-1">
                    Status: 
                    <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      ticket.status === 'ready_for_pickup' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-gray-100 mt-4 pt-4">
                <div className="text-lg font-bold text-gray-800">
                  Total: ${ticket.total_amount.toFixed(2)}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openViewModal(ticket.id)}
                    className="p-2 text-gray-500 hover:text-blue-600"
                    title="View Details"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openPrintModal(ticket)}
                    className="p-2 text-gray-500 hover:text-blue-600"
                    title="Print Receipt"
                  >
                    <Printer className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(ticket)}
                    className="p-2 text-gray-500 hover:text-green-600"
                    title="Edit Ticket"
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* View Details Modal */}
      {selectedTicket && !showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-xl font-semibold">Ticket #{selectedTicket.ticket_number}</h3>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-6">
              {/* Customer, Status, Financials */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-500">Customer</h4>
                  <p className="text-lg font-semibold">{selectedTicket.customer_name}</p>
                  <p className="text-gray-600">{selectedTicket.customer_phone}</p>
                </div>
                <div className="text-right">
                  <h4 className="font-medium text-gray-500">Status</h4>
                  <p className="text-lg font-semibold">{selectedTicket.status}</p>
                  <p className="text-gray-600">Rack: {selectedTicket.rack_number || 'N/A'}</p>
                </div>
              </div>
              
              {/* Items */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Items</h4>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {selectedTicket.items.map((item: TicketItem) => (
                    <div key={item.id} className="flex justify-between p-3 border-b last:border-b-0">
                      <div>
                        <span className="font-medium">{item.clothing_name}</span>
                        <span className="text-gray-600 ml-2">×{item.quantity}</span>
                      </div>
                      <span className="font-medium">${item.item_total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-2xl font-bold text-blue-600">
                  Total: ${selectedTicket.total_amount.toFixed(2)}
                </div>
                <div className="text-right">
                  <p>Paid: ${selectedTicket.paid_amount.toFixed(2)}</p>
                  <p className="font-bold">Balance: ${(selectedTicket.total_amount - selectedTicket.paid_amount).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-xl font-semibold">Edit Ticket #{selectedTicket.ticket_number}</h3>
              <button onClick={() => { setShowEditModal(false); setSelectedTicket(null); }} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Item</th>
                    <th className="text-right p-2">Quantity</th>
                    <th className="text-right p-2">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {editedItems.map((item, index) => (
                    <tr key={item.item_id}>
                      <td className="p-2">{item.name}</td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleEditChange(index, 'quantity', e.target.value)}
                          min="1"
                          className="border rounded px-2 py-1 text-sm w-20 text-right focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={item.item_total}
                          onChange={(e) => handleEditChange(index, 'item_total', e.target.value)}
                          step="0.01"
                          min="0"
                          className="border rounded px-2 py-1 text-sm w-24 text-right focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <button 
                  onClick={() => { setShowEditModal(false); setSelectedTicket(null); }}
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
        </div>
      )}

      {/* --- MODIFIED: Print Preview Modal with Custom Buttons --- */}
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onPrint={() => {}} // No-op because we use the custom buttons below
        content={printContent} // Displays Customer Receipt in Preview
        hideDefaultButton={true} // Hides the standard print button
        extraActions={(
          <>
            {/* Button 1: Print Customer + PageBreak + Plant */}
            <button
              onClick={() => {
                const combinedHtml = `
                    ${printContent}
                    <div class="page-break"></div>
                    ${plantPrintContent}
                `;
                handlePrintJob(combinedHtml);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
            >
              <Printer size={18} />
              Print Receipts (All)
            </button>

            {/* Button 2: Print Plant Receipt Only */}
            <button
              onClick={() => {
                handlePrintJob(plantPrintContent);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Printer size={18} />
              Print Plant Only
            </button>
          </>
        )}
      />
    </div>
  );
}