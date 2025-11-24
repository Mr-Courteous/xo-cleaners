import React, { useState } from 'react';
import { Search, Package, MapPin, Calendar, User, Phone, DollarSign, Printer } from 'lucide-react';
import { Ticket } from '../types';
import { formatDateTime } from '../utils/date';
import Modal from './Modal';
import axios from 'axios';
import baseURL from '../lib/config';
import PrintPreviewModal from './PrintPreviewModal';
import renderReceiptHtml from '../lib/receiptTemplate';
import renderPlantReceiptHtml from '../lib/plantReceiptTemplate';
import renderPickupReceiptHtml  from '../lib/pickupReceiptTemplate';

type Step = 'search' | 'details' | 'payment';

export default function PickUp() {
  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [balancePaid, setBalancePaid] = useState<number>(0);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' as 'error' | 'success' });

  // Printing State
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printContent, setPrintContent] = useState('');      // Customer Receipt
  const [plantPrintContent, setPlantPrintContent] = useState(''); // Plant Receipt

  // --- Printing Helper (Consistent with DropOff/TicketManagement) ---
  const handlePrintJob = (htmlContent: string) => {
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);

    printFrame.contentDocument?.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            @page { size: 55mm auto; margin: 0; }
            @media print {
              html, body { margin: 0; padding: 0; }
              .page-break { 
                page-break-before: always; 
                break-before: page;
                display: block; 
                height: 0; 
                overflow: hidden;
              }
            }
            body { font-family: sans-serif; }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `);

    printFrame.contentDocument?.close();
    printFrame.contentWindow?.focus();

    setTimeout(() => {
      printFrame.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1000);
    }, 100);
  };

  const searchTickets = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token missing");

      const response = await axios.get(
        `${baseURL}/api/organizations/single-ticket/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const results: Ticket[] = response.data || [];
      // Filter out tickets that are already picked up to avoid confusion
      setTickets(results.filter((ticket: Ticket) => ticket.status !== 'picked_up'));
      setStep('search');

    } catch (error: any) {
      console.error('Failed to search tickets:', error);
      setModal({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to search tickets.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token missing");

      const response = await axios.get(
        `${baseURL}/api/organizations/tickets/${ticketId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const ticket: Ticket = response.data;
      setSelectedTicket(ticket);
      setBalancePaid(Math.max(0, ticket.total_amount - ticket.paid_amount));
      setStep('details');
    } catch (error: any) {
      console.error('Failed to load ticket details:', error);
      setModal({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to load ticket details.',
        type: 'error'
      });
    }
  };

  const completePickup = async () => {
    // ... (existing validation logic)

    try {
      // ... (existing API call)

      // Create the updated ticket object
      const updatedTicketForReceipt: Ticket = {
        ...selectedTicket,
        status: 'picked_up',
        paid_amount: selectedTicket.paid_amount + balancePaid,
      };

      // USE THE NEW TEMPLATE HERE
      const customerHtml = renderPickupReceiptHtml(updatedTicketForReceipt); // <--- Changed
      const plantHtml = renderPlantReceiptHtml(updatedTicketForReceipt);

      setPrintContent(customerHtml);
      setPlantPrintContent(plantHtml);
      setShowPrintPreview(true);

      setModal({
        isOpen: true,
        title: 'Success',
        message: `Pickup processed successfully! Ticket #${selectedTicket.ticket_number} is now marked as picked up.`,
        type: 'success'
      });

      // Reset state after successful pickup (in background behind modal)
      setSelectedTicket(null);
      setTickets([]);
      setSearchQuery('');
      setStep('search');
      setBalancePaid(0);

    } catch (error: any) {
      console.error('Failed to process pickup:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to process pickup. Please try again.';
      setModal({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
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
      case 'ready': return 'bg-green-100 text-green-800';
      case 'ready_for_pickup': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'dropped_off': return 'Dropped Off';
      case 'in_process': return 'In Process';
      case 'ready': return 'Ready for Pickup';
      case 'ready_for_pickup': return 'Ready for Pickup';
      case 'picked_up': return 'Picked Up';
      default: return status;
    }
  };

  const outstandingBalance = selectedTicket ? selectedTicket.total_amount - selectedTicket.paid_amount : 0;

  // 1. Search Bar
  const renderSearchBar = () => (
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
  );

  // 2. Search Results
  const renderSearchResults = () => (
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
  );

  // 3. Ticket Details
  const renderTicketDetails = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Ticket Details</h3>
          <button
            onClick={() => { setSelectedTicket(null); setStep('search'); setTickets([]); }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-6">
        {selectedTicket?.items && selectedTicket.items.length > 0 && (
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

        {selectedTicket?.special_instructions && (
          <div className="mb-6 p-4 bg-amber-50 rounded-lg">
            <h4 className="font-medium mb-2">Special Instructions</h4>
            <p className="text-gray-700">{selectedTicket.special_instructions}</p>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div>
            <div className="text-xl font-bold text-gray-900">Total: ${selectedTicket?.total_amount.toFixed(2)}</div>
            <div className={`text-lg font-bold ${outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              Balance Due: ${outstandingBalance.toFixed(2)}
            </div>
          </div>

          {(selectedTicket?.status === 'ready' || selectedTicket?.status === 'ready_for_pickup') && (
            <button
              onClick={() => setStep('payment')}
              className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              {outstandingBalance > 0 ? 'Go to Payment' : 'Process Pickup'}
            </button>
          )}
          {(selectedTicket?.status !== 'ready' && selectedTicket?.status !== 'ready_for_pickup') && (
            <div className="text-amber-600 font-medium">
              {getStatusText(selectedTicket.status)} - Cannot pick up yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 4. Payment Form
  const renderPaymentForm = () => {
    if (!selectedTicket) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Complete Payment for Ticket #{selectedTicket.ticket_number}</h3>
            <button
              onClick={() => setStep('details')}
              className="text-gray-500 hover:text-gray-700"
            >
              Back to Details
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 text-lg mb-6 p-4 bg-gray-50 rounded-lg">
            <div>Total Ticket Amount:</div>
            <div className="font-bold text-right">${selectedTicket.total_amount.toFixed(2)}</div>
            <div>Amount Already Paid:</div>
            <div className="text-right">${selectedTicket.paid_amount.toFixed(2)}</div>
            <div className="font-bold text-red-600">Outstanding Balance:</div>
            <div className="font-bold text-red-600 text-right">${outstandingBalance.toFixed(2)}</div>
          </div>

          <div className="mb-6">
            <label htmlFor="balancePaid" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Amount Customer is Paying Now
            </label>
            <input
              id="balancePaid"
              type="number"
              min="0"
              step="0.01"
              value={balancePaid.toFixed(2)}
              onChange={(e) => setBalancePaid(parseFloat(e.target.value) || 0)}
              className="w-full text-xl p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-sm text-gray-500">Enter the amount the customer is paying to settle the balance.</p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-xl font-bold">
              New Total Paid: <span className="text-green-600">${(selectedTicket.paid_amount + balancePaid).toFixed(2)}</span>
            </div>

            <button
              onClick={completePickup}
              disabled={balancePaid < outstandingBalance - 0.001 || loading}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? 'Processing...' : 'Confirm Payment & Pickup'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN RENDER
  // =========================================================================

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Pick Up Clothes</h2>
        <p className="text-gray-600">Search by customer name, phone number, or ticket number</p>
      </div>

      {step === 'search' && renderSearchBar()}
      {step === 'search' && tickets.length > 0 && renderSearchResults()}
      {step === 'details' && selectedTicket && renderTicketDetails()}
      {step === 'payment' && selectedTicket && renderPaymentForm()}

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
      />

      {/* --- UPDATED: Consistent Print Preview Modal --- */}
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onPrint={() => { }} // No-op, hiding default button
        content={printContent} // Customer receipt for preview
        hideDefaultButton={true} // Hides standard print button
        extraActions={(
          <>
            {/* Button 1: Print Receipts (All) */}
            <button
              onClick={() => {
                const combinedHtml = `
                    ${printContent}
                    <div class="page-break"></div>
                    ${plantPrintContent}
                `;
                handlePrintJob(combinedHtml);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
            >
              <Printer size={18} />
              Print Receipts (All)
            </button>

            {/* Button 2: Print Plant Only */}
            <button
              onClick={() => {
                handlePrintJob(plantPrintContent);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Printer size={18} />
              Print Plant Only
            </button>
          </>
        )}
      />
    </div>
  );
}