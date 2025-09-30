import React, { useState } from 'react';
import { Search, Package, MapPin, Calendar, User, Phone } from 'lucide-react';
import { apiCall } from '../hooks/useApi';
import { Ticket } from '../types';
import { formatDateTime } from '../utils/date';
import Modal from './Modal';

export default function PickUp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' as 'error' | 'success' });

  const searchTickets = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const results = await apiCall(`/find-tickets?query=${encodeURIComponent(searchQuery)}`);
      setTickets(results.filter((ticket: Ticket) => ticket.status !== 'picked_up'));
    } catch (error) {
      console.error('Failed to search tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId: number) => {
    try {
      const ticket = await apiCall(`/tickets/${ticketId}`);
      setSelectedTicket(ticket);
    } catch (error) {
      console.error('Failed to load ticket details:', error);
    }
  };

  const processPickup = async (ticketId: number) => {
    try {
      await apiCall(`/tickets/${ticketId}/pickup`, { method: 'PUT' });
      setModal({
        isOpen: true,
        title: 'Success',
        message: 'Pickup processed successfully!',
        type: 'success'
      });
      setSelectedTicket(null);
      setTickets([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to process pickup:', error);
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to process pickup. Please try again.',
        type: 'error'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dropped_off': return 'bg-amber-100 text-amber-800';
      case 'in_process': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'dropped_off': return 'Dropped Off';
      case 'in_process': return 'In Process';
      case 'ready': return 'Ready for Pickup';
      default: return status;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Pick Up Clothes</h2>
        <p className="text-gray-600">Search by customer name, phone number, or ticket number</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Enter customer name, phone, or ticket number..."
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
            <h3 className="text-lg font-semibold">Search Results</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => loadTicketDetails(ticket.id)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="font-medium text-lg">#{ticket.ticket_number}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
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
                  <div className="text-right flex flex-col items-end">
                    <div className="text-lg font-bold text-gray-900 mb-2">${ticket.total_amount.toFixed(2)}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadTicketDetails(ticket.id);
                      }}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
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

      {selectedTicket && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Ticket Details</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium mb-3">Ticket Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Ticket Number:</strong> #{selectedTicket.ticket_number}</div>
                  <div><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTicket.status)}`}>
                      {getStatusText(selectedTicket.status)}
                    </span>
                  </div>
                  <div><strong>Drop-off Date:</strong> {formatDateTime(selectedTicket.drop_off_date || selectedTicket.created_at)}</div>
                  {selectedTicket.rack_number && (
                    <div><strong>Rack Location:</strong> #{selectedTicket.rack_number}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {selectedTicket.customer_name}</div>
                  <div><strong>Phone:</strong> {selectedTicket.customer_phone}</div>
                  {selectedTicket.customer_address && (
                    <div><strong>Address:</strong> {selectedTicket.customer_address}</div>
                  )}
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
              <div className="text-2xl font-bold text-blue-600">
                Total: ${selectedTicket.total_amount.toFixed(2)}
              </div>
              {selectedTicket.status === 'ready' && (
                <button
                  onClick={() => processPickup(selectedTicket.id)}
                  className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Process Pickup
                </button>
              )}
              {selectedTicket.status !== 'ready' && (
                <div className="text-amber-600 font-medium">
                  {selectedTicket.status === 'dropped_off' && 'Clothes not yet processed'}
                  {selectedTicket.status === 'in_process' && 'Still being processed'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
}