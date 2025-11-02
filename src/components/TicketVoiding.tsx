import React, { useState, useCallback } from 'react';
import { Search, Trash2, XCircle, CheckCircle, Package, User, Phone, Calendar } from 'lucide-react';
import { apiCall } from '../hooks/useApi';

// Assuming the Ticket type (from '../types') is available globally, 
// and includes 'ticket_number', 'customer_name', 'status', 'is_void'.
interface Ticket {
  ticket_number: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total_amount: number;
  drop_off_date: string;
  is_void: boolean; // Must exist after the schema change
}

// Define props for the component (optional: add a success handler)
interface TicketVoidingProps {
    onVoidSuccess?: () => void;
}


export default function TicketVoiding({ onVoidSuccess }: TicketVoidingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- API CALL: SEARCH TICKETS ---
  const handleSearch = useCallback(async () => {
    if (searchQuery.length < 3) {
      setError('Please enter at least 3 characters for the search.');
      setTickets([]);
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // NOTE: Assuming your backend has a GET /search/tickets?query= route
      const result = await apiCall(`/api/tickets?query=${encodeURIComponent(searchQuery)}`, { method: 'GET' });
      // IMPORTANT: If you want to show *all* tickets (including voided ones) 
      // to display their void status, remove the filter below.
      // I've removed the filter here so you can see the voided status badge.
      setTickets(result); 
    } catch (err: any) {
      setError(`Search failed: ${err.message || 'Unknown error'}`);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);


  // --- API CALL: VOID TICKET ---
  const handleVoidTicket = useCallback(async (ticketNumber: string) => {
    if (!window.confirm(`Are you sure you want to VOID ticket ${ticketNumber}? This action is irreversible.`)) {
        return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 🎯 FIX: Changed the endpoint from /status to /void
      const response = await apiCall(`/api/tickets/${ticketNumber}/void`, { 
        method: 'PUT',
        body: JSON.stringify({ is_void: true }),
      });

      if (response.success) {
        // Update the local state to reflect the void status change instead of removing it
        setTickets(prev => 
            prev.map(t => 
                t.ticket_number === ticketNumber ? { ...t, is_void: true } : t
            )
        );
        alert(`Ticket ${ticketNumber} successfully VOIDED.`);
        onVoidSuccess?.(); 
      } else {
        setError(`Void operation failed: ${response.message || 'Could not void ticket.'}`);
      }

    } catch (err: any) {
      // Ensure the error message clearly shows the validation failure if it happens
      const errorDetail = err.detail ? JSON.stringify(err.detail) : (err.message || 'Check network or server.');
      setError(`Void API call failed: ${errorDetail}`);
    } finally {
      setLoading(false);
    }
}, [onVoidSuccess]);
  
  return (
    <div className="max-w-6xl mx-auto py-8">
      <h2 className="text-3xl font-bold text-red-700 mb-6 flex items-center">
        <Trash2 className="h-7 w-7 mr-3" /> Void Ticket Utility
      </h2>
      <p className="text-gray-600 mb-6">Search for a ticket by number or customer name to permanently void the order. **Voided tickets will also be displayed**.</p>

      {/* Search Bar */}
      <div className="flex space-x-3 mb-6">
        <input
          type="text"
          placeholder="Enter Ticket # or Customer Name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-red-500 focus:border-red-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? 'Searching...' : <Search className="h-5 w-5" />}
        </button>
      </div>

      {/* Error Display */}
      {error && <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}

      {/* Results Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {loading && tickets.length === 0 && <div className="p-6 text-center text-gray-500">Loading search results...</div>}
        
        {tickets.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drop Off</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {/* 1. ADDED: New column for Void Status */}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Void Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.ticket_number} className={ticket.is_void ? "bg-red-100/50 transition-colors" : "hover:bg-red-50 transition-colors"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.ticket_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-500" />
                    {ticket.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(ticket.drop_off_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">${ticket.total_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${ticket.status === 'ready_for_pickup' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {ticket.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  {/* 2. ADDED: Conditional Void Status Badge */}
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {ticket.is_void ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">
                            <XCircle className="h-3 w-3 mr-1" />
                            VOIDED
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
                            ACTIVE
                        </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {/* 3. MODIFIED: Only show Void button if NOT already voided */}
                    {!ticket.is_void ? (
                      <button
                        onClick={() => handleVoidTicket(ticket.ticket_number)}
                        disabled={loading}
                        className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center mx-auto"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Void Order
                      </button>
                    ) : (
                        <span className="text-gray-500 text-xs">Action complete</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && !error && (
            <div className="p-6 text-center text-gray-500">Enter a ticket number or customer name to begin void search.</div>
          )
        )}
      </div>
    </div>
  );
}