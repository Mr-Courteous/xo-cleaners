import React, { useState } from 'react';
import { 
  Search, Package, User, Calendar, MapPin, 
  Eye, Printer, Edit3, 
  Ban, RefreshCcw, RotateCcw, DollarSign, Loader2
} from 'lucide-react';
import axios from 'axios'; 
import baseURL from '../lib/config'; 
import { Ticket, TicketItem } from '../types'; 
import PrintPreviewModal from './PrintPreviewModal';
import renderReceiptHtml from '../lib/receiptTemplate';
import renderPlantReceiptHtml from '../lib/plantReceiptTemplate';
import { renderPickupReceiptHtml } from '../lib/pickupReceiptTemplate';

// Define a type for the items being edited
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
  const [customerPrintContent, setCustomerPrintContent] = useState('');      
  const [plantPrintContent, setPlantPrintContent] = useState(''); 
  const [tagPrintContent, setTagPrintContent] = useState(''); 

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedItems, setEditedItems] = useState<EditableItem[]>([]);

  // --- HELPER: Generate Tag HTML (Same as DropOff) ---
  const generateTagHtml = (ticket: Ticket) => {
    let combinedHtml = '';
    const rawName = ticket.customer_name || ticket.customer_phone || 'Guest';
    const fullName = rawName;
    const ticketId = ticket.ticket_number || '';
    const dateIssued = ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '';
    
    // Ensure items exist
    const items = ticket.items || [];

    items.forEach((item) => {
      const preferences = [];
      if (item.starch_level && item.starch_level !== 'no_starch' && item.starch_level !== 'none') {
        let starchDisplay = item.starch_level;
        if (starchDisplay === 'extra_heavy') starchDisplay = 'Ex. Heavy';
        else if (starchDisplay === 'heavy') starchDisplay = 'Heavy';
        else if (starchDisplay === 'medium') starchDisplay = 'Medium';
        else if (starchDisplay === 'light') starchDisplay = 'Light';
        preferences.push(`${starchDisplay} starch`);
      }
      if (item.crease === 'crease') {
        preferences.push('Crease');
      }
      if (item.alterations) {
        preferences.push(`Alt: ${item.alterations}`);
      }
      if (item.item_instructions) {
         preferences.push(`Note: ${item.item_instructions}`);
      }
      const preferencesText = preferences.join(' / ');
      
      // Loop for quantity to create individual tags
      const qty = item.quantity || 1;
      const tags = Array.from({ length: qty });
      
      const nameLen = fullName.length || 0;
      const nameFontSize = nameLen > 50 ? '9pt' : nameLen > 35 ? '10pt' : '11pt';
      const prefFontSize = '9pt';
      
      const itemTagsHtml = tags.map(() => `
          <div style="
            border: 1.5px solid #000;
            padding: 6px 8px;
            width: 100%;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            font-size: 10pt;
            line-height: 1.1;
            margin-bottom: 8px; 
            page-break-after: always;
            font-family: sans-serif;
          ">
            <div style="font-size: 10pt; font-weight: 700; overflow-wrap: break-word; word-break: break-word;">
              ${ticketId}
            </div>
            <div style="font-size: ${nameFontSize}; font-weight: 700; text-align: right; overflow-wrap: break-word; word-break: break-word;">
              ${fullName}
            </div>

            <div style="font-size: 9pt;">
              Issued: ${dateIssued}
            </div>
            <div style="font-size: ${prefFontSize}; text-align: right; overflow-wrap: break-word; word-break: break-word;">
              ${preferencesText}
            </div>
            
            <div style="grid-column: 1 / span 2; text-align: center; font-size: 11pt; font-weight: 900; padding: 2px 0; border-top: 1px dashed #ccc; margin-top: 4px;">
                ${item.clothing_name}
            </div>
          </div>
      `).join('');
      
      combinedHtml += itemTagsHtml;
    });

    return `
      <div style="display: flex; flex-direction: column; gap: 8px; padding: 6px;">
        ${combinedHtml}
      </div>
    `;
  };

  // --- Search Tickets ---
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
      console.error(error);
      alert('Failed to search tickets.');
    } finally {
      setLoading(false);
    }
  };

  // --- View Details Modal ---
  const openViewModal = async (ticketId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token not found");
      const response = await axios.get(`${baseURL}/api/organizations/tickets/${ticketId}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      setSelectedTicket(response.data);
    } catch (error) {
      alert('Failed to fetch ticket details.');
    } finally {
      setLoading(false);
    }
  };

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
      console.log('Full Ticket for Printing:', fullTicket);
      
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
      searchTickets(); 
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

      // Update Local State for the List
      setTickets(prev => prev.map(t => {
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
      {/* Search Bar */}
      <div className="flex items-center space-x-2 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchTickets()}
          placeholder="Search by Ticket #, Name, or Phone..."
          className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
            onClick={searchTickets} 
            disabled={loading} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* Loading State */}
      {loading && !selectedTicket && !showEditModal && (
        <div className="text-center p-6 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            Loading...
        </div>
      )}

      {/* No Results */}
      {!loading && tickets.length === 0 && searchQuery && (
         <div className="text-center p-6 text-gray-500">
             <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
             <p>No tickets found.</p>
         </div>
      )}

      {/* Ticket List */}
      {!loading && tickets.length > 0 && !selectedTicket && !showEditModal && (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const isVoid = ticket.is_void || ticket.status === 'voided';
            const isRefunded = ticket.is_refunded;

            // Determine card styles based on status
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
                        <span className={`text-xl font-bold ${isVoid ? 'text-red-600 line-through' : 'text-blue-600'}`}>
                            #{ticket.ticket_number}
                        </span>
                        {isVoid && <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded">VOID</span>}
                        {isRefunded && <span className="px-2 py-0.5 text-xs font-bold text-white bg-purple-600 rounded">REFUNDED</span>}
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
                        Due: {ticket.pickup_date ? new Date(ticket.pickup_date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="mt-1">
                        Status: <span className="font-medium">{ticket.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-gray-100 mt-4 pt-4 relative z-10">
                  <div className="text-lg font-bold text-gray-800">Total: ${ticket.total_amount.toFixed(2)}</div>
                  <div className="flex space-x-2">
                    <button onClick={() => openViewModal(ticket.id)} className="p-2 text-gray-500 hover:text-blue-600" title="View Details">
                        <Eye className="h-5 w-5" />
                    </button>
                    
                    {/* Print & Edit (Hide if Void) */}
                    {!isVoid && (
                      <>
                        <button onClick={() => openPrintModal(ticket)} className="p-2 text-gray-500 hover:text-blue-600" title="Print">
                            <Printer className="h-5 w-5" />
                        </button>
                        <button onClick={() => openEditModal(ticket)} className="p-2 text-gray-500 hover:text-green-600" title="Edit">
                            <Edit3 className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {/* Void / Unvoid Toggle Button */}
                    <button 
                        onClick={() => toggleAction(ticket, 'void')} 
                        className={`p-2 ${isVoid ? 'text-green-600 hover:text-green-800 bg-green-50' : 'text-gray-500 hover:text-red-600'}`} 
                        title={isVoid ? "Unvoid Ticket" : "Void Ticket"}
                    >
                        {isVoid ? <RotateCcw className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                    </button>

                    {/* Refund / Undo Refund Toggle Button (Disabled if Void) */}
                    {!isVoid && (
                        <button 
                            onClick={() => toggleAction(ticket, 'refund')} 
                            className={`p-2 ${isRefunded ? 'text-purple-600 hover:text-purple-800 bg-purple-50' : 'text-gray-500 hover:text-purple-600'}`} 
                            title={isRefunded ? "Undo Refund" : "Mark as Refunded"}
                        >
                            {isRefunded ? <DollarSign className="h-5 w-5" /> : <RefreshCcw className="h-5 w-5" />}
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
                                {selectedTicket.items.map(i => (
                                    <tr key={i.id}>
                                        <td className="px-4 py-2">{i.clothing_name}</td>
                                        <td className="px-4 py-2 text-right">{i.quantity}</td>
                                        <td className="px-4 py-2 text-right">${i.item_total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-right w-full">
                            <p className="text-sm text-gray-600">Paid: ${selectedTicket.paid_amount.toFixed(2)}</p>
                            <p className="text-xl font-bold text-blue-600">Total: ${selectedTicket.total_amount.toFixed(2)}</p>
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
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
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
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Printer size={18} /> Customer Only
            </button>
            
            <button 
                onClick={handlePrintPlant} 
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Printer size={18} /> Plant Only
            </button>

            {/* ✅ ADDED TAGS BUTTON */}
            <button 
                onClick={handlePrintTags} 
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 flex items-center gap-2"
            >
              <Printer size={18} /> Tags Only
            </button>

            {/* ✅ ADDED ALL BUTTON */}
            <button 
                onClick={handlePrintAll} 
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
            >
              <Printer size={18} /> Print All
            </button>
          </>
        }
      />
    </div>
  );
}