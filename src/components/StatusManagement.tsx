import React, { useState } from 'react';
import { 
  Search, Package, Clock, CheckCircle, User, Phone, 
  Calendar, MapPin, X, Ban, AlertCircle 
} from 'lucide-react';
// import { apiCall } from '../hooks/useApi'; // --- REMOVED ---
import axios from 'axios'; // --- NEW ---
import baseURL from '../lib/config'; // --- NEW ---
import { Ticket } from '../types';
import { formatDateTime } from '../utils/date';
import Modal from './Modal'; // Assuming Modal is in './Modal'

export default function StatusManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'error' as 'error' | 'success' });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const searchTickets = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setTickets([]); // Clear previous results
    try {
      // 1. Get token from local storage
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Access token not found");
      }

      // 2. Set authorization headers
      const headers = { 
        'Authorization': `Bearer ${token}` 
      };

      // 3. Make the API call using axios and baseURL
      const response = await axios.get(
        `${baseURL}/api/organizations/find-tickets?query=${encodeURIComponent(searchQuery)}`,
        { headers }
      );

      // 4. Set tickets from response.data
      setTickets(response.data);

    } catch (error: any) {
      console.error('Failed to search tickets:', error);
      // Show an error in the modal
      setModal({
        isOpen: true,
        title: 'Search Error',
        message: error.response?.data?.detail || error.message || 'An error occurred while searching.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dropped_off': return 'bg-amber-100 text-amber-800';
      case 'in_process': return 'bg-blue-100 text-blue-800';
      case 'ready_for_pickup': return 'bg-green-100 text-green-800';
      case 'picked_up': return 'bg-gray-100 text-gray-800';
      case 'voided': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      {loading && (
        <div className="text-center p-6 text-gray-500">
          <p>Loading tickets...</p>
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="text-center p-6 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No tickets found. Try another search.</p>
        </div>
      )}

      {/* Ticket List */}
      {!loading && tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map((ticket) => {
             // Helper booleans for UI logic
             const isVoid = ticket.is_void || ticket.status === 'voided';
             const isRefunded = ticket.is_refunded;

             return (
              <div 
                key={ticket.id} 
                className={`border rounded-lg shadow-sm p-5 relative overflow-hidden ${
                  isVoid ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                }`}
              >
                {/* Watermark for Voided Tickets */}
                {isVoid && (
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Ban size={100} className="text-red-500" />
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between relative z-10">
                  {/* Left Side Info */}
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`text-xl font-bold ${isVoid ? 'text-red-600 line-through' : 'text-blue-600'}`}>
                        #{ticket.ticket_number}
                      </span>
                      
                      {/* Status Badges */}
                      {isVoid ? (
                         <span className="px-2.5 py-0.5 text-xs font-bold text-white bg-red-600 rounded">VOID</span>
                      ) : (
                         <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                           {ticket.status.replace('_', ' ').toUpperCase()}
                         </span>
                      )}

                      {isRefunded && (
                         <span className="px-2.5 py-0.5 text-xs font-bold text-white bg-purple-600 rounded">REFUNDED</span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-gray-700 mb-1">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">{ticket.customer_name}</span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{ticket.customer_phone}</span>
                    </div>
                  </div>

                  {/* Right Side Info */}
                  <div className="text-sm text-gray-500 mt-4 md:mt-0 md:text-right">
                    <div className="flex items-center justify-end">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Drop Off: {formatDateTime(ticket.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-end">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Picked Up: {ticket.pickup_date ? formatDateTime(ticket.pickup_date) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-end mt-1 font-medium">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>Rack: {ticket.rack_number || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="flex justify-between items-end border-t border-gray-100 mt-4 pt-4 relative z-10">
                  <div className="text-lg font-bold text-gray-800">
                    Total: ${ticket.total_amount.toFixed(2)}
                  </div>
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b">
              <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">
                    Details for Ticket #{selectedTicket.ticket_number}
                  </h3>
                  {(selectedTicket.is_void || selectedTicket.status === 'voided') && 
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-sm font-bold">VOID</span>
                  }
                  {selectedTicket.is_refunded && 
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-sm font-bold">REFUNDED</span>
                  }
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-500">Customer</h4>
                  <p className="text-lg font-semibold">{selectedTicket.customer_name}</p>
                  <p className="text-gray-600">{selectedTicket.customer_phone}</p>
                </div>
                <div className="text-right">
                  <h4 className="font-medium text-gray-500">Status</h4>
                  <p className={`text-lg font-semibold ${getStatusColor(selectedTicket.status).split(' ')[1]}`}>
                    {selectedTicket.status.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-gray-600">Rack: {selectedTicket.rack_number || 'N/A'}</p>
                </div>
              </div>

              {/* Items */}
              {selectedTicket.items && selectedTicket.items.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Items ({selectedTicket.items.length})</h4>
                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {selectedTicket.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border-b last:border-b-0">
                        <div>
                          <span className="font-medium text-gray-900">{item.clothing_name}</span>
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
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Special Instructions</h4>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">{selectedTicket.special_instructions}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-2xl font-bold text-blue-600">
                  Total: ${selectedTicket.total_amount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}