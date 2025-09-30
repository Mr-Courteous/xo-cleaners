import { useState } from 'react';
import { Search, Package, Printer, Eye } from 'lucide-react';
import { apiCall } from '../hooks/useApi';
import { Ticket } from '../types';
import PrintPreviewModal from './PrintPreviewModal';

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
      const results = await apiCall(`/find-tickets?query=${encodeURIComponent(searchQuery)}`);
      
      // Fetch full ticket details including items
      const ticketsWithItems = await Promise.all(
        results.map(async (ticket: Ticket) => {
          try {
            // Use ticket ID to get full details including items, same as other components
            const ticketDetails = await apiCall(`/tickets/${ticket.id}`);
            return { ...ticket, items: ticketDetails.items || [] };
          } catch (error) {
            console.error(`Failed to fetch items for ticket ${ticket.id}:`, error);
            return { ...ticket, items: [] };
          }
        })
      );
      
      setTickets(ticketsWithItems);
    } catch (error) {
      console.error('Failed to search tickets:', error);
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

    const generateTagHtml = (ticket: Ticket, item: any) => {
    const readyDate = new Date(ticket.created_at);
    readyDate.setDate(readyDate.getDate() + 2);

    // Format the customer name
    const nameParts = ticket.customer_phone.split(' ');
    const formattedName = `${nameParts[nameParts.length - 1]}, ${nameParts[0][0]}`;
    const ticketLast4 = ticket.ticket_number.slice(-4);

    // Format starch level and crease
    const preferences = [];
    if (item.starch_level && item.starch_level !== 'no_starch') {
      preferences.push(`${item.starch_level} startch`);
    }
    if (item.crease === 'crease') {
      preferences.push('Crease');
    }
    const preferencesText = preferences.join(' / ');


    // Create an array with length equal to the quantity
    const tags = Array(item.quantity).fill(null);
    
    return `
      <div style="
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        padding: 20px;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        ${tags.map(() => `
          <div style="
            border: 2px solid #000;
            padding: 20px;
            width: 350px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            font-size: 24px;
            line-height: 1.2;
          ">
            <!-- Row 1 -->
            <div style="font-size: 28px; font-weight: 500;">
              1 - ${ticketLast4}
            </div>
            <div style="font-size: 28px; font-weight: 600; text-align: right;">
              ${formattedName}
            </div>
            
            <!-- Row 2 -->
            <div style="font-size: 24px;">
              Ready: ${readyDate.toLocaleDateString()}
            </div>
            <div style="font-size: 24px; text-align: right;">
              ${preferencesText}
            </div>
          </div>
        `).join('')}
      </div>
    `;
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
              <div
                key={ticket.id}
                className="p-6"
              >
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
                            <span className="font-medium">{item.clothing_name}</span>
                            <span className="text-gray-600 ml-2">×{item.quantity}</span>
                            <div className="text-sm text-gray-500 mt-1">
                              {item.starch_level !== 'no_starch' && `${item.starch_level.replace('_', ' ')} starch`}
                              {item.starch_level !== 'no_starch' && item.crease === 'crease' && ' • '}
                              {item.crease === 'crease' && 'with crease'}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setPrintContent(generateTagHtml(ticket, item));
                                setShowPrintPreview(true);
                              }}
                              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Tag
                            </button>
                            <button
                              onClick={() => {
                                setPrintContent(generateTagHtml(ticket, item));
                                setShowPrintPreview(true);
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print Tag
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

      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onPrint={() => setShowPrintPreview(false)}
        content={printContent}
      />
    </div>
  );
}
