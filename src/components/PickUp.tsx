import React, { useState } from 'react';
import { Search, Package, MapPin, Calendar, User, Phone, DollarSign, Printer, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Ticket } from '../types';
import axios from 'axios';
import baseURL from '../lib/config';
import PrintPreviewModal from './PrintPreviewModal';
import renderPickupReceiptHtml from '../lib/pickupReceiptTemplate';
import renderPlantReceiptHtml from '../lib/plantReceiptTemplate';

type Step = 'search' | 'details' | 'payment';

export default function PickUp() {
  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Payment State
  const [amountPaid, setAmountPaid] = useState<string>(''); // Using string for better input handling
  
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' as 'error' | 'success' });

  // Printing State
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printContent, setPrintContent] = useState('');
  const [plantPrintContent, setPlantPrintContent] = useState('');

  // --- 1. Search Tickets ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      // Note: Ensure your backend has a search endpoint or logic to filter
      const response = await axios.get(`${baseURL}/api/organizations/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Client-side filtering for demo (ideally backend does this)
      const allTickets: Ticket[] = response.data;
      const filtered = allTickets.filter(t => 
        t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Only show tickets that are NOT picked up yet
      const activeTickets = filtered.filter(t => t.status !== 'picked_up');
      
      setTickets(activeTickets);
      if (activeTickets.length === 0) {
          setModal({ isOpen: true, title: 'No Tickets', message: 'No active tickets found matching that query.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setModal({ isOpen: true, title: 'Error', message: 'Failed to search tickets.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Select Ticket ---
  const handleSelectTicket = (ticket: Ticket) => {
    // Re-fetch full details to ensure we have items for the receipt
    const fetchDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${baseURL}/api/organizations/tickets/${ticket.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedTicket(res.data);
            setStep('details');
        } catch (err) {
            setModal({ isOpen: true, title: 'Error', message: 'Could not load ticket details.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    fetchDetails();
  };

  // --- 3. Proceed to Payment ---
  const handleProceedToPayment = () => {
    if (!selectedTicket) return;
    
    const balanceDue = selectedTicket.total_amount - selectedTicket.paid_amount;
    
    // Auto-fill the exact balance
    setAmountPaid(balanceDue.toFixed(2));
    setStep('payment');
  };

  // --- 4. Process Pickup ---
  const handleProcessPickup = async () => {
    if (!selectedTicket) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Send the payment amount to backend
      const response = await axios.put(
        `${baseURL}/api/organizations/tickets/${selectedTicket.id}/pickup`,
        { amount_paid: parseFloat(amountPaid) }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update local state with the returned (updated) ticket data
        // We merge the response data to ensure receipt templates have latest info
        const updatedTicket = { ...selectedTicket, ...response.data, status: 'picked_up' };
        
        // Generate Receipt HTML
        const receiptHtml = renderPickupReceiptHtml(updatedTicket);
        const plantHtml = renderPlantReceiptHtml(updatedTicket);

        setPrintContent(receiptHtml);
        setPlantPrintContent(plantHtml);
        
        // Open Print Preview
        setShowPrintPreview(true);
        
        // Reset flow in background
        setStep('search');
        setTickets([]);
        setSearchQuery('');
      }

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Failed to process pickup.';
      setModal({ isOpen: true, title: 'Error', message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- Helper: Print Job ---
  const handlePrintJob = (content: string) => {
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    printFrame.contentDocument?.write(`
      <html>
        <head>
          <style>
            @page { size: 55mm auto; margin: 0; }
            body { margin: 0; font-family: monospace; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printFrame.contentDocument?.close();
    printFrame.contentWindow?.focus();
    printFrame.contentWindow?.print();
    setTimeout(() => document.body.removeChild(printFrame), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <CheckCircle className="w-8 h-8 mr-3 text-blue-600" />
        Ticket Pickup
      </h2>

      {/* --- STEP 1: SEARCH --- */}
      {step === 'search' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSearch} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Find Ticket</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Ticket # (e.g., 241105-001) or Customer Name"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {tickets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {ticket.ticket_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        ${(ticket.total_amount - ticket.paid_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleSelectTicket(ticket)}
                          className="text-blue-600 hover:text-blue-900 font-bold"
                        >
                          Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- STEP 2: DETAILS CONFIRMATION --- */}
      {step === 'details' && selectedTicket && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Pickup Details</h3>
            <button onClick={() => setStep('search')} className="text-gray-500 hover:text-gray-700">
                Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Customer Info</h4>
                <p className="text-lg font-bold">{selectedTicket.customer_name}</p>
                <p className="text-gray-600">{selectedTicket.customer_phone}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Rack Location</h4>
                <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-2xl font-bold text-blue-900">
                        {selectedTicket.rack_number || 'Unassigned'}
                    </span>
                </div>
            </div>
          </div>

          <div className="border-t pt-4">
             <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Total Ticket Amount:</span>
                <span className="text-xl font-bold">${selectedTicket.total_amount.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Already Paid:</span>
                <span className="text-xl font-bold text-green-600">-${selectedTicket.paid_amount.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-bold text-gray-900">Balance Due:</span>
                <span className="text-2xl font-bold text-red-600">
                    ${(selectedTicket.total_amount - selectedTicket.paid_amount).toFixed(2)}
                </span>
             </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
             <button 
                onClick={() => setStep('search')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
             >
                Back
             </button>
             <button
                onClick={handleProceedToPayment}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center"
             >
                <CreditCard className="w-4 h-4 mr-2" />
                Proceed to Payment
             </button>
          </div>
        </div>
      )}

      {/* --- STEP 3: PAYMENT --- */}
      {step === 'payment' && selectedTicket && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Collect Payment</h3>
            
            <div className="mb-6 text-center">
                <p className="text-gray-500 mb-1">Outstanding Balance</p>
                <p className="text-4xl font-bold text-blue-600">
                    ${(selectedTicket.total_amount - selectedTicket.paid_amount).toFixed(2)}
                </p>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Being Paid Now</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                        type="number"
                        step="0.01"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="block w-full pl-7 pr-12 py-3 text-lg border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                {/* Quick Actions */}
                <div className="mt-2 flex gap-2 justify-center">
                    <button 
                        type="button"
                        onClick={() => setAmountPaid((selectedTicket.total_amount - selectedTicket.paid_amount).toFixed(2))}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100"
                    >
                        Full Balance
                    </button>
                </div>
            </div>

            <button
                onClick={handleProcessPickup}
                disabled={loading || parseFloat(amountPaid) <= 0}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50 flex justify-center items-center"
            >
                {loading ? 'Processing...' : 'Confirm Payment & Pickup'}
            </button>
            
            <button 
                onClick={() => setStep('details')}
                className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
                Cancel
            </button>
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Success/Error Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                <div className={`flex items-center mb-4 ${modal.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {modal.type === 'error' ? <AlertCircle className="w-6 h-6 mr-2" /> : <CheckCircle className="w-6 h-6 mr-2" />}
                    <h3 className="text-lg font-bold">{modal.title}</h3>
                </div>
                <p className="text-gray-600 mb-6">{modal.message}</p>
                <button
                    onClick={() => setModal({ ...modal, isOpen: false })}
                    className="w-full py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-medium"
                >
                    Close
                </button>
            </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onPrint={() => {}}
        content={printContent}
        hideDefaultButton={true}
        extraActions={
            <>
                <button
                    onClick={() => {
                        // Combine receipts for "Print All"
                        const combined = `${printContent}<div style="page-break-before: always;"></div>${plantPrintContent}`;
                        handlePrintJob(combined);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                    <Printer size={18} />
                    Print All (Cust + Plant)
                </button>
                <button
                    onClick={() => handlePrintJob(printContent)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Printer size={18} />
                    Print Customer Copy
                </button>
            </>
        }
        note="Pickup processed successfully! Please print the receipt below."
      />

    </div>
  );
}