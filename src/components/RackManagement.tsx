import React, { useState, useEffect } from 'react';
import { MapPin, Search, Package } from 'lucide-react';
import { useApi, apiCall } from '../hooks/useApi';
import { Rack } from '../types';
import Modal from './Modal';

export default function RackManagement() {
  const [searchRack, setSearchRack] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [assignRackNumber, setAssignRackNumber] = useState('');
  const { data: racks, loading, refetch } = useApi<Rack[]>('/racks');
  const [availableRacks, setAvailableRacks] = useState<{number: number}[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchAvailableRacks(),
        refetch()
      ]);
    };
    loadInitialData();
  }, []);

  const fetchAvailableRacks = async () => {
    try {
      const available = await apiCall('/racks/available');
      if (Array.isArray(available)) {
        setAvailableRacks(available);
      } else {
        console.error('Expected array from /racks/available, got:', typeof available);
        setAvailableRacks([]);
      }
    } catch (error) {
      console.error('Failed to fetch available racks:', error);
      setAvailableRacks([]);
    }
  };

  const assignRack = async () => {
    if (!selectedTicketId || !assignRackNumber) {
      setModalMessage('Please enter both ticket ID and rack number');
      setIsModalOpen(true);
      return;
    }

    // Remove any 'DC' prefix if present for consistency
    const ticketId = selectedTicketId.replace(/^DC/i, '');

    try {
      await apiCall(`/tickets/${ticketId}/rack`, {
        method: 'PUT',
        body: JSON.stringify({ rack_number: parseInt(assignRackNumber) }),
      });

      // Clear the form first
      setSelectedTicketId('');
      setAssignRackNumber('');
      
      // Then refresh both rack lists
      await Promise.all([
        fetchAvailableRacks(),
        refetch()
      ]);
      
      // Show success message after data is refreshed
      setModalMessage(`Rack #${assignRackNumber} assigned successfully!`);
      setIsModalOpen(true);
      
    } catch (error) {
      console.error('Rack assignment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setModalMessage(`Failed to assign rack: ${errorMessage}. Please check if the ticket exists and the rack is available.`);
      setIsModalOpen(true);
    }
  };

  const filteredRacks = Array.isArray(racks) ? racks.filter(rack => 
    searchRack === '' || rack.number.toString().includes(searchRack)
  ) : [];

  const occupiedRacks = filteredRacks.filter(rack => rack.is_occupied);
  const emptyRacks = filteredRacks.filter(rack => !rack.is_occupied);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm h-96"></div>
          <div className="bg-white p-6 rounded-lg shadow-sm h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Rack Management"
        message={modalMessage}
      />
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Rack Management</h2>
        <p className="text-gray-600">Manage clothing placement and rack assignments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Assign Rack to Ticket</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter Ticket Number (e.g., 221340718)"
              value={selectedTicketId}
              onChange={(e) => setSelectedTicketId(e.target.value.trim())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={assignRackNumber}
              onChange={(e) => setAssignRackNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Available Rack</option>
              {availableRacks.map((rack) => (
                <option key={rack.number} value={rack.number}>
                  Rack #{rack.number}
                </option>
              ))}
            </select>
            <button
              onClick={assignRack}
              disabled={!selectedTicketId || !assignRackNumber}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Assign Rack
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Search Racks</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search rack number..."
              value={searchRack}
              onChange={(e) => setSearchRack(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredRacks.length} of {racks?.length || 0} racks
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-red-600">Occupied Racks ({occupiedRacks.length})</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {occupiedRacks.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                No occupied racks found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {occupiedRacks.map((rack) => (
                  <div key={rack.number} className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-red-500 mr-2" />
                        <span className="font-medium">Rack #{rack.number}</span>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">#{rack.ticket_number}</div>
                        <div className="text-gray-600">{rack.customer_name}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-green-600">Available Racks ({emptyRacks.length})</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {emptyRacks.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                No available racks found
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4">
                {emptyRacks.slice(0, 50).map((rack) => (
                  <div
                    key={rack.number}
                    className="p-2 text-center border border-gray-200 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <span className="text-sm font-medium">#{rack.number}</span>
                  </div>
                ))}
                {emptyRacks.length > 50 && (
                  <div className="col-span-full text-center text-sm text-gray-500 mt-2">
                    ... and {emptyRacks.length - 50} more available racks
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}