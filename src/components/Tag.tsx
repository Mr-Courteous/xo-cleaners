import { useState } from 'react';
import { Search, Package, Printer, Eye } from 'lucide-react';
import axios from 'axios';
import baseURL from '../lib/config';
import { Ticket } from '../types';
import PrintPreviewModal from './PrintPreviewModal';
import { generateTagHtml } from '../lib/tagTemplates';

interface TicketItem {
  id: number;
  ticket_id: number;
  clothing_type_id: number;
  quantity: number;
  starch_level: string;
  crease: string;
  clothing_name: string;
}

interface TicketWithItems extends Ticket {
  items: TicketItem[];
}

export default function Tag(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Array<Ticket & { items?: Array<any> }>>([]);
  const [loading, setLoading] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printContent, setPrintContent] = useState('');

  const searchTickets = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Access token not found');
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(
        `${baseURL}/api/organizations/find-tickets?query=${encodeURIComponent(searchQuery)}`,
        { headers }
      );
      const results = res.data || [];

      // --- BATCHING REQUESTS ---
      const ticketsWithItems: Array<Ticket & { items?: Array<any> }> = [];
      const BATCH_SIZE = 5; 

      for (let i = 0; i < results.length; i += BATCH_SIZE) {
        const batch = results.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.all(
          batch.map(async (ticket: Ticket) => {
            try {
              if ((ticket as any).items && (ticket as any).items.length > 0) {
                 return ticket;
              }

              const td = await axios.get(`${baseURL}/api/organizations/tickets/${ticket.id}`, { headers });
              const ticketDetails = td.data || {};
              return { ...ticket, items: ticketDetails.items || [] };
            } catch (error) {
              console.error(`Failed to fetch items for ticket ${ticket.id}:`, error);
              return { ...ticket, items: [] };
            }
          })
        );
        
        ticketsWithItems.push(...batchResults);
      }
      // -----------------------------

      setTickets(ticketsWithItems);
    } catch (error) {
      console.error('Failed to search tickets:', error);
      const message = (error as any).response?.data?.detail || (error as Error).message || 'Failed to search tickets.';
      alert(message);
    } finally {
      setLoading(false);
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

  // --- PRINT UTILITY (Centered 55mm) ---
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
  // -------------------------------------

  const openTagPreview = (ticket: Ticket, item: any) => {
    const singleItemTicket = { ...ticket, items: [item] };
    setPrintContent(generateTagHtml(singleItemTicket));
    setShowPrintPreview(true);
  };

  const handlePrintSingleTag = (ticket: Ticket, item: any) => {
    const singleItemTicket = { ...ticket, items: [item] };
    const html = generateTagHtml(singleItemTicket);
    handlePrintJob(html);
  };

  const handlePrintAllTags = (ticket: Ticket) => {
    const html = generateTagHtml(ticket);
    if (!html) {
      alert('No tags available to print for this ticket.');
      return;
    }
    handlePrintJob(html);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Tag Management</h2>
        <p className="text-gray-600">Search tickets and print tags</p>
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

      {tickets.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Search Results ({tickets.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <span className="font-medium text-lg">#{ticket.ticket_number}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="mb-4">
                      <span className="text-gray-700 text-lg">{ticket.customer_phone}</span>
                      <span className="text-gray-500 ml-2">•</span>
                      <span className="text-gray-500 ml-2">{ticket.customer_address}</span>
                    </div>
                    <div className="space-y-3">
                      {ticket.items?.map((item, index) => (
                        <div key={index} className="group flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div>
                            <span className="text-gray-600 ml-2">×{item.quantity}</span>
                            <div className="text-sm text-gray-500 mt-1">
                              {item.starch_level !== 'no_starch' && `${item.starch_level.replace('_', ' ')} starch`}
                              {item.starch_level !== 'no_starch' && item.crease === 'crease' && ' • '}
                              {item.crease === 'crease' && 'with crease'}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openTagPreview(ticket, item)}
                              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Tag
                            </button>
                            
                            <button
                              onClick={() => handlePrintSingleTag(ticket, item)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print Tag
                            </button>
                            
                            <button
                              onClick={() => handlePrintAllTags(ticket)}
                              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center"
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print All
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

      {/* --- MODAL UPDATED TO HIDE DEFAULT AND USE CUSTOM BUTTON --- */}
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onPrint={() => {}} // Empty because we are hiding the default button
        content={printContent}
        hideDefaultButton={true} // Hides the double-firing button
        extraActions={(
          <button 
            onClick={() => handlePrintJob(printContent)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Printer size={18} /> Print Tag
          </button>
        )}
      />
    </div>
  );
}