import { useState } from 'react';
import { Search, Package, Printer, Eye } from 'lucide-react';
import axios from 'axios';
import baseURL from '../lib/config';
import { Ticket } from '../types';
import PrintPreviewModal from './PrintPreviewModal';

// --- CRITICAL FIX: The QZ library is loaded globally via index.html,
// so we must use 'declare const' instead of import to avoid errors.
declare const qz: any; 
// ----------------------------------------------------------------------

// --- PRINTER CONFIGURATION (Update this to your exact printer name) ---
const PRINTER_NAME = 'Epson TM_U220B M188B';
// ----------------------------------------------------------------------

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

/**
 * Converts ticket and item data into a raw ESC/POS byte array (Array<number>).
 * This structure is required by QZ Tray for raw printing and achieving 15mm height/cut.
 */
const generateEscPosCommands = (ticket: Ticket, item: any): Array<number> => {
  // Hex codes for ESC/POS commands (represented as decimal numbers)
  const ESC_INIT = [0x1B, 0x40]; // ESC @: Initialize printer
  const ESC_FONT_STANDARD = [0x1B, 0x21, 0x00]; // ESC ! 0: Select standard font (dotted)
  const CUT_PARTIAL = [0x1D, 0x56, 0x01]; // GS V 1: Partial Cut command
  const LINE_SPACING_DOTS = 30; // 1/6" for TM-U220B (180 dpi) - tune if needed
  const ESC_SET_LINE_SPACING = [0x1B, 0x33, LINE_SPACING_DOTS]; // ESC 3 n
  const ESC_FEED_LINES = (lines: number): Array<number> => [0x1B, 0x64, lines]; // ESC d n
  const TAG_FEED_LINES = 4; // Tune to hit the desired tag height

  // --- Dynamic Data Assembly ---
  const ticketId = (ticket.ticket_number || '').trim().slice(0, 15);
  const rawName = ticket.customer_name || 'Guest';
  // Example formatting: "Franklin, Alfr"
  const customerName = rawName.trim().split(/\s+/).join(', ').slice(0, 20); 
  
  // Date format matching the image: Fri 09-19
  const dateObj = ticket.created_at ? new Date(ticket.created_at) : new Date();
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }); 
  const monthDay = dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }); 
  const dateLine = `${dayName} ${monthDay.replace('/', '-')}`;

  // Preferences Line
  const preferences = [];
  if (item.starch_level && item.starch_level !== 'no_starch' && item.starch_level !== 'none') {
    preferences.push(item.starch_level.replace(/_/g, ' ').toUpperCase());
  }
  if (item.crease === 'crease') {
    preferences.push('CREASE');
  }
  const preferencesText = preferences.join(' / ');
  
  // Combine all secondary details
  const detailsLine = `${dateLine} ${customerName}, ${preferencesText}`.trim().slice(0, 40);


  // Helper to convert string to byte array
  const textToBytes = (text: string): Array<number> => Array.from(new TextEncoder().encode(text));

  // --- Final Command Sequence ---
  let allCommands: Array<number> = [];

  // Loop to print the required quantity of tags for this item
  for (let i = 0; i < item.quantity; i++) {
    const singleTagCommands = [
      ...ESC_INIT,
      ...ESC_SET_LINE_SPACING,
      ...ESC_FONT_STANDARD,

      // Line 1: Ticket ID + Newline (\n)
      ...textToBytes(ticketId + '\n'), 

      // Line 2: Date + Customer Name/Prefs + Newline (\n)
      ...textToBytes(detailsLine + '\n'),
      
      // --- CRITICAL: CONTROLLED FEED FOR TAG HEIGHT ---
      ...ESC_FEED_LINES(TAG_FEED_LINES),

      // --- CRITICAL: CUT COMMAND ---
      ...CUT_PARTIAL,
    ];
    allCommands.push(...singleTagCommands);
  }

  return allCommands;
};

/**
 * Sends the raw ESC/POS byte array to the local printer via QZ Tray.
 */
const printTagEscPos = async (rawBytes: Array<number>) => {
  if (!rawBytes || rawBytes.length === 0) {
    alert("Nothing to print. Please try again.");
    return;
  }

  const shouldDisconnect = !qz.websocket.isActive();

  try {
    if (shouldDisconnect) {
      await qz.websocket.connect();
    }

    const data = [
      { type: 'raw', data: rawBytes } // Send the raw byte array
    ];

    const config = qz.configs.create(PRINTER_NAME);

    await qz.print(config, data);
    
    console.log("ESC/POS tag commands sent to QZ Tray successfully.");

  } catch (error) {
    console.error("QZ Tray Printing Error:", error);
    alert("An error occurred during printing. Ensure QZ Tray is running and the printer name is correct.");
  } finally {
    if (shouldDisconnect && qz.websocket.isActive()) {
      qz.websocket.disconnect();
    }
  }
};


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

      // --- FIX: BATCHING REQUESTS ---
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

  // 🚨 NOTE: This function is only used for the "View Tag" preview modal. 
  // It does NOT handle the actual 15mm ESC/POS printing.
  const generateTagHtml = (ticket: Ticket, item: any) => {
    const readyDate = new Date(ticket.created_at);
    readyDate.setDate(readyDate.getDate() + 2);

    const rawName = ticket.customer_name || ticket.customer_phone || 'Guest';
    const fullName = rawName;
    const ticketId = ticket.ticket_number || '';
    const dateIssued = ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '';

    const preferences = [];
    if (item.starch_level && item.starch_level !== 'no_starch' && item.starch_level !== 'none') {
      preferences.push(`${item.starch_level} starch`);
    }
    if (item.crease === 'crease') {
      preferences.push('Crease');
    }
    const preferencesText = preferences.join(' / ');

    const tags = Array(item.quantity).fill(null);
    const nameLen = fullName.length || 0;
    const nameFontSize = nameLen > 50 ? '9pt' : nameLen > 35 ? '10pt' : '11pt';
    const prefFontSize = '9pt';
    
    return `
      <div style="
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 6px;
        font-family: monospace; /* Simulating dot-matrix font */
      ">
        ${tags.map(() => `
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
                            <span className="font-medium">{item.clothing_name}</span>
                            <span className="text-gray-600 ml-2">×{item.quantity}</span>
                            <div className="text-sm text-gray-500 mt-1">
                              {item.starch_level !== 'no_starch' && `${item.starch_level.replace('_', ' ')} starch`}
                              {item.starch_level !== 'no_starch' && item.crease === 'crease' && ' • '}
                              {item.crease === 'crease' && 'with crease'}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {/* The View button still uses the HTML version for a browser preview */}
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
                            
                            {/* 👈 The Print button now uses the ESC/POS raw printing logic */}
                            <button
                              onClick={async () => {
                                const rawBytes = generateEscPosCommands(ticket, item);
                                await printTagEscPos(rawBytes);
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
