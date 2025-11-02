import React, { useState, useCallback } from 'react';
import { Search, RotateCcw, DollarSign, CheckCircle, XCircle, User, Calendar } from 'lucide-react';
import { apiCall } from '../hooks/useApi';

// Assuming the Ticket type (from '../types') is available globally.
// This interface includes the necessary fields, including the new 'is_refunded' flag.
interface Ticket {
  // Assuming 'id' is necessary for the API call in handleRefundTicket
  id: number; 
  ticket_number: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total_amount: number;
  paid_amount: number; // Important for refunds
  drop_off_date: string;
  is_void: boolean;
  is_refunded: boolean; // Must exist after the schema change
}

interface TicketRefundingProps {
    onRefundSuccess?: () => void;
}

const PRIMARY_COLOR = 'blue';

export default function TicketRefunding({ onRefundSuccess }: TicketRefundingProps) {
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
      // NOTE: Assuming your backend search route returns all ticket details
      const result = await apiCall(`/api/tickets?query=${encodeURIComponent(searchQuery)}`, { method: 'GET' });
      // NOTE: We don't filter here, allowing visibility of already refunded/voided tickets.
      setTickets(result); 
    } catch (err: any) {
      setError(`Search failed: ${err.message || 'Unknown error'}`);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);


  // --- API CALL: PROCESS REFUND ---
  const handleRefundTicket = useCallback(async (ticketId: number, ticketNumber: string, amount: number) => {
    if (!window.confirm(`Are you sure you want to process a REFUND of $${amount.toFixed(2)} for ticket ${ticketNumber}?`)) {
        return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Call the new PUT endpoint you created in main.py
      const response: Ticket = await apiCall(`/api/tickets/${ticketId}/refund`, { 
        method: 'PUT',
        // The endpoint is expected to take the is_refunded boolean
        body: JSON.stringify({ is_refunded: true }), 
      });

      // 🎯 FIX: Check for a valid ticket object instead of the missing 'success' flag.
      // The successful FastAPI endpoint returns the full updated Ticket object.
      if (response && response.ticket_number) {
        // Update the local state by replacing the old ticket with the new, updated ticket from the server.
        setTickets(prev => 
            prev.map(t => 
                t.ticket_number === response.ticket_number ? response : t
            )
        );
        alert(`Refund for Ticket ${response.ticket_number} successfully processed.`);
        onRefundSuccess?.(); 
      } else {
        // Fallback for unexpected non-ticket response (still in the success range)
        setError(`Refund operation failed: Server returned an unexpected successful response structure.`);
      }

    } catch (err: any) {
      // This catch block handles HTTP errors (4xx, 5xx) from the server
      const errorDetail = err.detail ? JSON.stringify(err.detail) : (err.message || 'Check network or server.');
      // The server is returning an error response body, which your apiCall is wrapping into an error object.
      setError(`Refund API call failed. The server reports: ${errorDetail}`);
    } finally {
      setLoading(false);
    }
  }, [onRefundSuccess]);
  
  return (
    <div className="max-w-6xl mx-auto py-8">
      <h2 className={`text-3xl font-bold text-${PRIMARY_COLOR}-700 mb-6 flex items-center`}>
        <RotateCcw className="h-7 w-7 mr-3" /> Ticket Refund Utility
      </h2>
      <p className="text-gray-600 mb-6">Search for a ticket by number or customer name to process a refund.</p>

      {/* Search Bar */}
      <div className="flex space-x-3 mb-6">
        <input
          type="text"
          placeholder="Enter Ticket # or Customer Name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className={`bg-${PRIMARY_COLOR}-600 text-white px-6 py-3 rounded-lg hover:bg-${PRIMARY_COLOR}-700 transition-colors font-medium disabled:opacity-50`}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total / Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drop Off</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Refund Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => {
                const isRefundable = !ticket.is_void && !ticket.is_refunded;
                const rowClass = ticket.is_refunded ? 'bg-blue-100/50 transition-colors' : 
                                 ticket.is_void ? 'bg-red-100/50 transition-colors' : 'hover:bg-blue-50 transition-colors';
                
                return (
                <tr key={ticket.ticket_number} className={rowClass}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.ticket_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-500" />
                    {ticket.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                    ${ticket.total_amount.toFixed(2)} / ${ticket.paid_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(ticket.drop_off_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold 
                      ${ticket.status === 'REFUNDED' ? 'bg-blue-100 text-blue-800' : 
                        ticket.status === 'VOIDED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {ticket.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  {/* Conditional Refund Status Badge */}
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {ticket.is_refunded ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            REFUNDED
                        </span>
                    ) : ticket.is_void ? (
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
                    {/* Only show Refund button if refundable */}
                    {isRefundable ? (
                      <button
                        // The button correctly passes ticket.id, which the PUT route uses
                        onClick={() => handleRefundTicket(ticket.id, ticket.ticket_number, ticket.paid_amount)}
                        disabled={loading}
                        className={`text-white bg-${PRIMARY_COLOR}-600 hover:bg-${PRIMARY_COLOR}-700 px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center mx-auto`}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Process Refund
                      </button>
                    ) : (
                        <span className="text-gray-500 text-xs">Action complete / Not applicable</span>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        ) : (
          !loading && !error && (
            <div className="p-6 text-center text-gray-500">Enter a ticket number or customer name to begin refund search.</div>
          )
        )}
      </div>
    </div>
  );
}