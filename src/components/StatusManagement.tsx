import React, { useState } from 'react';
import { Search, Package, Clock, CheckCircle, User, Phone, Calendar, MapPin } from 'lucide-react';
import { apiCall } from '../hooks/useApi';
import { Ticket } from '../types';
import { formatDateTime } from '../utils/date';
import Modal from './Modal';

export default function StatusManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'error' as 'error' | 'success' });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Status Management</h2>
        <p className="text-gray-600">View ticket status and details</p>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Tickets ({tickets.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <span className="font-medium text-xl">#{ticket.ticket_number}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">{ticket.customer_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        {ticket.customer_phone}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Drop-off: {formatDateTime(ticket.drop_off_date || ticket.created_at)}
                      </div>
                      {ticket.pickup_date && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Picked up: {formatDateTime(ticket.pickup_date)}
                        </div>
                      )}
                    </div>

                    {ticket.special_instructions && (
                      <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong>Special Instructions:</strong> {ticket.special_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2 ml-6">
                    <div className="text-lg font-bold text-blue-600">
                      Total: ${ticket.total_amount.toFixed(2)}
                    </div>
                    {ticket.rack_number && (
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        Rack #{ticket.rack_number}
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors text-sm font-medium flex items-center"
                    >
                      View Details
                    </button>
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

      {!searchQuery && (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Status Overview</h3>
          <p className="text-gray-500 mb-4">Search for tickets to view their current status</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
              <div className="text-amber-600 font-medium text-sm">Dropped Off</div>
            </div>
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="text-blue-600 font-medium text-sm">In Process</div>
            </div>
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="text-green-600 font-medium text-sm">Ready</div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="text-gray-600 font-medium text-sm">Picked Up</div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, title: '', message: '', type: 'error' })}
        title={modal.title}
        message={modal.message}
      />

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Ticket #{selectedTicket.ticket_number}</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium">{selectedTicket.customer_name}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      {selectedTicket.customer_phone}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Ticket Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      Drop-off: {formatDateTime(selectedTicket.drop_off_date || selectedTicket.created_at)}
                    </div>
                    {selectedTicket.rack_number && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        Rack #{selectedTicket.rack_number}
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                        {getStatusText(selectedTicket.status)}
                      </span>
                    </div>
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
