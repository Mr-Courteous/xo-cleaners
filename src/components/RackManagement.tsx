import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, Package, CheckCircle, AlertCircle, Loader2, AlertTriangle, X } from 'lucide-react';
import { Rack } from '../types'; // Assuming this type is { number: number, is_occupied: boolean, ticket_id: number, ticket_number: string }
import Modal from './Modal';
import { useColors } from '../state/ColorsContext';
// import { apiCall } from '../hooks/useApi'; // <-- REMOVED
import baseURL from "../lib/config"; // Added import
import axios from 'axios'; // Added import

// --- NEW ---
// A hook for debouncing input
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- NEW ---
// Type for the validation response
interface ValidatedTicket {
  ticket_id: number;
  ticket_number: string;
  customer_name: string;
}

export default function RackManagement() {
  const { colors } = useColors();
  const [searchRack, setSearchRack] = useState('');
  
  // --- States for manual data fetching ---
  const [racks, setRacks] = useState<Rack[]>([]);
  const [availableRacks, setAvailableRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // --- NEW STATES FOR TICKET VALIDATION ---
  const [ticketNumber, setTicketNumber] = useState(''); // The string the user types
  const [validatedTicket, setValidatedTicket] = useState<ValidatedTicket | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const debouncedTicketNumber = useDebounce(ticketNumber, 500); // Wait 500ms after user stops typing
  const [assignRackNumber, setAssignRackNumber] = useState('');
  const [assigning, setAssigning] = useState(false); // <-- ADDED for API call state
  const [assignError, setAssignError] = useState<string | null>(null);

  // --- Re-rack confirmation states ---
  const [showReRackConfirm, setShowReRackConfirm] = useState(false);
  const [reRackData, setReRackData] = useState<{ old_rack: number | null; new_rack: number } | null>(null);

  // Helper to parse backend error responses into a friendly message
  const parseApiError = (error: any) => {
    if (!error) return 'An unknown error occurred';
    // axios response format
    const resp = error.response?.data;
    if (resp) {
      // Common FastAPI: { detail: 'message' } or { detail: [ { msg: '...' } ] }
      if (typeof resp.detail === 'string') return resp.detail;
      if (Array.isArray(resp.detail) && resp.detail.length > 0) {
        // try to extract msg or text
        const first = resp.detail[0];
        if (first.msg) return first.msg;
        if (first.message) return first.message;
        try { return JSON.stringify(resp.detail); } catch { /* fallthrough */ }
      }
      // Other conventions
      if (typeof resp.message === 'string') return resp.message;
      if (typeof resp.error === 'string') return resp.error;
      // If entire body is a string
      if (typeof resp === 'string') return resp;
      // Fallback to stringify
      try { return JSON.stringify(resp); } catch { /* fallthrough */ }
    }
    // axios error message fallback
    if (error.message) return error.message;
    return 'An unknown error occurred';
  };


  // --- Main Data Fetching Function ---
  const fetchRacks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token missing");

      // 1. Call the correct backend route
      const response = await axios.get(
        `${baseURL}/api/organizations/racks`, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 2. Get the array from the 'racks' key
      const allRacks = response.data?.racks || [];
      setRacks(allRacks);

      // 3. Filter for available racks and update state
      const available = allRacks.filter((rack: Rack) => !rack.is_occupied);
      setAvailableRacks(available);

    } catch (error: any) {
      console.error('Failed to fetch racks:', error);
      setRacks([]);
      setAvailableRacks([]);
    } finally {
      setLoading(false);
    }
  };
  
  // --- Load initial data on mount ---
  useEffect(() => {
    fetchRacks();
  }, []); // Runs once

  // --- NEW: Effect for Ticket Validation ---
  useEffect(() => {
    const validateTicket = async () => {
      if (debouncedTicketNumber.trim() === '') {
        setIsValidating(false);
        setValidatedTicket(null);
        setTicketError(null);
        return;
      }

      setIsValidating(true);
      setValidatedTicket(null);
      setTicketError(null);
      
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Access token missing");

        // Use axios for this GET request
        const response = await axios.get(
          `${baseURL}/api/organizations/tickets/validate/${debouncedTicketNumber}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        setValidatedTicket(response.data);
      } catch (error: any) {
        console.error('Ticket validation error:', error);
        const msg = parseApiError(error);
        setTicketError(msg || 'Ticket not found');
      } finally {
        setIsValidating(false);
      }
    };

    validateTicket();
  }, [debouncedTicketNumber]); // Runs when the debounced ticket number changes


  // --- Refetch function to be called after updates ---
  const refetch = () => fetchRacks();

  // --- Assign Rack Function ---
  // --- REPLACED THIS ENTIRE FUNCTION ---
  const assignRack = async () => {
    if (!validatedTicket || !assignRackNumber) {
      setModalMessage('Please select a valid ticket and rack number');
      setIsModalOpen(true);
      return;
    }

    setAssigning(true);
    const ticketId = validatedTicket.ticket_id; 

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token missing");

      // Use axios.put to make the API call
      const response = await axios.put(
        `${baseURL}/api/organizations/tickets/${ticketId}/rack`, // Endpoint
        { rack_number: parseInt(assignRackNumber) }, // Request body
        { // Config object with headers
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Check if this is a re-racking operation
      if (response.data?.is_rerack) {
        // Show re-rack confirmation dialog
        setReRackData({
          old_rack: response.data?.old_rack,
          new_rack: response.data?.new_rack
        });
        setShowReRackConfirm(true);
        setAssigning(false);
        return;
      }

      // Clear the form first
      setTicketNumber(''); // Clear ticket number input
      setValidatedTicket(null); // Clear validated ticket
      setAssignRackNumber('');
      
      // 5. Just call refetch. It will update both lists.
      await refetch();
      
      // Show success message after data is refreshed
      setModalMessage(`Rack #${assignRackNumber} assigned successfully!`);
      setIsModalOpen(true);
      
    } catch (error: any) {
      console.error('Rack assignment error:', error);
      const errorMessage = parseApiError(error);
      setAssignError(errorMessage);
      setModalMessage(`Failed to assign rack: ${errorMessage}`);
      setIsModalOpen(true);
    } finally {
      setAssigning(false);
    }
  };

  // --- Handle re-rack confirmation ---
  const handleReRackConfirm = async () => {
    if (!validatedTicket || !assignRackNumber || !reRackData) {
      setShowReRackConfirm(false);
      return;
    }

    setAssigning(true);

    try {
      // Clear the form
      setTicketNumber('');
      setValidatedTicket(null);
      setAssignRackNumber('');
      setShowReRackConfirm(false);
      
      // Store the old and new rack for the success message
      const oldRack = reRackData.old_rack;
      const newRack = reRackData.new_rack;
      setReRackData(null);

      // Refetch racks
      await refetch();

      // Show success message
      setModalMessage(`Ticket re-racked from rack #${oldRack} to rack #${newRack} successfully!`);
      setIsModalOpen(true);
    } catch (error: any) {
      console.error('Re-rack confirmation error:', error);
      setModalMessage(`An error occurred during re-racking.`);
      setIsModalOpen(true);
      setShowReRackConfirm(false);
    } finally {
      setAssigning(false);
    }
  };

  const filteredRacks = racks.filter(rack => 
    searchRack === '' || rack.number.toString().includes(searchRack)
  );

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
      >
        {modalMessage}
      </Modal>

      {/* Re-rack Confirmation Modal */}
      {showReRackConfirm && reRackData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Re-racking</h3>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700 mb-3">
                  This ticket is already racked at <span className="font-semibold">Rack #{reRackData.old_rack}</span>.
                </p>
                <p className="text-gray-700">
                  Do you want to move it to <span className="font-semibold">Rack #{reRackData.new_rack}</span>?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReRackConfirm(false);
                    setReRackData(null);
                  }}
                  disabled={assigning}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReRackConfirm}
                  disabled={assigning}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirm Re-rack
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Rack Management</h2>
        <p className="text-gray-600">Manage clothing placement and rack assignments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Assign Rack to Ticket</h3>
          <div className="space-y-4">
            
            {/* --- CHANGED --- Ticket Number Input */}
            <div>
              <label htmlFor="ticketNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Ticket Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="ticketNumber"
                  placeholder="Enter Ticket Number (e.g., 251103-001)"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value.trim())}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
                    ticketError ? 'border-red-500 ring-red-300' : 
                    validatedTicket ? 'border-green-500 ring-green-300' : 'border-gray-300 ring-blue-500'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {isValidating ? (
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  ) : ticketError ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : validatedTicket ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : null}
                </div>
              </div>
              {ticketError && (
                <p className="mt-1 text-sm text-red-600">{ticketError}</p>
              )}
              {validatedTicket && (
                <p className="mt-1 text-sm text-green-600">
                  Ticket found for: <strong>{validatedTicket.customer_name}</strong>
                </p>
              )}
            </div>

            {/* --- Rack Selection --- */}
            <div>
              <label htmlFor="rackNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Available Rack
              </label>
              <select
                id="rackNumber"
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
            </div>

            <button
              onClick={assignRack}
              // --- CHANGED --- Button disabled if validating OR assigning
              disabled={!validatedTicket || !assignRackNumber || isValidating || assigning}
              className="w-full text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: colors.primaryColor }}
            >
              {assigning ? 'Assigning...' : 'Assign Rack'}
            </button>
            {assignError && (
              <p className="mt-2 text-sm text-red-600">{assignError}</p>
            )}
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
            Showing {filteredRacks.length} of {racks.length} racks
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold" style={{ color: colors.primaryColor }}>Occupied Racks ({occupiedRacks.length})</h3>
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
                        <MapPin className="h-4 w-4 mr-2" style={{ color: colors.primaryColor }} />
                        <span className="font-medium">Rack #{rack.number}</span>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">Ticket ID: {rack.ticket_id}</div>
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
            <h3 className="text-lg font-semibold" style={{ color: colors.secondaryColor }}>Available Racks ({emptyRacks.length})</h3>
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