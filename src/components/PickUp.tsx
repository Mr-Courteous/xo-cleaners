import React, { useState } from 'react';
import { Search, MapPin, CheckCircle, AlertCircle, Printer, CreditCard, DollarSign, Ban } from 'lucide-react';
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
  const [cashTendered, setCashTendered] = useState<string>(''); 
  
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
      const response = await axios.get(`${baseURL}/api/organizations/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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
    setCashTendered(''); 
    setStep('payment');
  };

  // --- 4. Process Pickup ---
  const handleProcessPickup = async () => {
    if (!selectedTicket) return;

    const { balance } = computeCharges(selectedTicket);
    const tendered = parseFloat(cashTendered) || 0;

    if (tendered < balance) {
        setModal({ isOpen: true, title: 'Insufficient Funds', message: 'Cash tendered is less than the balance due.', type: 'error' });
        return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.put(
        `${baseURL}/api/organizations/tickets/${selectedTicket.id}/pickup`,
        { amount_paid: balance }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.success) {
        const updatedTicket: Ticket = {
          ...selectedTicket,
          paid_amount: response.data.new_total_paid ?? selectedTicket.paid_amount,
          status: response.data.new_status ?? selectedTicket.status
        } as Ticket;

        const receiptHtml = renderPickupReceiptHtml(updatedTicket);
        const plantHtml = renderPlantReceiptHtml ? renderPlantReceiptHtml(updatedTicket) : '';

        setPrintContent(receiptHtml);
        setPlantPrintContent(plantHtml);
        setShowPrintPreview(true);

        setStep('search');
        setTickets([]);
        setSearchQuery('');
        setCashTendered('');
      } else {
        const msg = response.data?.message || 'Failed to process pickup.';
        setModal({ isOpen: true, title: 'Error', message: msg, type: 'error' });
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
          <title>Print</title>
          <style>
            @page { margin: 0; }
            @media print {
              html { width: 100%; margin: 0; padding: 0; }
              body { width: 55mm; margin: 0 auto; padding: 0; font-family: sans-serif; }
              div { break-inside: avoid; }
              .page-break { page-break-after: always; break-after: page; }
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printFrame.contentDocument?.close();
    printFrame.contentWindow?.focus();
    setTimeout(() => {
        printFrame.contentWindow?.print();
        setTimeout(() => document.body.removeChild(printFrame), 1000);
    }, 100);
  };

  // --- Charges calculation helper ---
  const computeCharges = (ticket: Ticket) => {
    const items = ticket.items || [];
    const subtotal = items.reduce((sum, item) => sum + (Number(item.item_total) || 0), 0);
    
    const envCharge = subtotal * 0.047;
    const tax = subtotal * 0.0825;
    
    const finalTotal = subtotal + envCharge + tax;
    const paid = Number(ticket.paid_amount) || 0;
    const balance = Math.max(0, finalTotal - paid); 
    return { subtotal, envCharge, tax, finalTotal, paid, balance };
  };

  // --- VALIDATION HELPER ---
  const getPickupEligibility = (ticket: Ticket) => {
    const hasRack = ticket.rack_number && ticket.rack_number.trim() !== '';
    // Check if status implies it's still being processed
    const isProcessing = ['processed', 'processing'].includes(ticket.status.toLowerCase());
    
    let error = null;
    if (!hasRack) error = 'Ticket has no rack location assigned.';
    else if (isProcessing) error = 'Ticket is still processing (not ready).';

    return { allowed: !error, error };
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${['processed', 'processing'].includes(ticket.status.toLowerCase()) 
                             ? 'bg-yellow-100 text-yellow-800' 
                             : 'bg-green-100 text-green-800'}`}>
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

          {/* CHECK ELIGIBILITY */}
          {(() => {
              const { allowed, error } = getPickupEligibility(selectedTicket);
              if (!allowed) {
                  return (
                      <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r flex items-start">
                          <Ban className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                          <div>
                              <h4 className="font-bold text-red-800">Cannot Process Pickup</h4>
                              <p className="text-sm text-red-700">{error}</p>
                          </div>
                      </div>
                  );
              }
              return null;
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Customer Info</h4>
                <p className="text-lg font-bold">{selectedTicket.customer_name}</p>
                <p className="text-gray-600">{selectedTicket.customer_phone}</p>
            </div>
            <div className={`p-4 rounded-lg ${!selectedTicket.rack_number ? 'bg-red-50 border border-red-200' : 'bg-blue-50'}`}>
                <h4 className={`font-medium mb-2 ${!selectedTicket.rack_number ? 'text-red-800' : 'text-blue-800'}`}>
                    Rack Location
                </h4>
                <div className="flex items-center">
                    {selectedTicket.rack_number ? (
                        <>
                            <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="text-2xl font-bold text-blue-900">
                                {selectedTicket.rack_number}
                            </span>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                            <span className="text-xl font-bold text-red-600">Unassigned</span>
                        </>
                    )}
                </div>
            </div>
          </div>

          <div className="border-t pt-4">
             {(() => {
               const charges = computeCharges(selectedTicket);
               return (
                 <>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-gray-600">Subtotal:</span>
                     <span className="font-semibold">${charges.subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-gray-600">Env Charge (4.7%):</span>
                     <span className="text-gray-800">${charges.envCharge.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-gray-600">Tax (8.25%):</span>
                     <span className="text-gray-800">${charges.tax.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-gray-600">Already Paid:</span>
                     <span className="text-xl font-bold text-green-600">-${charges.paid.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center pt-4 border-t">
                     <span className="text-lg font-bold text-gray-900">Balance Due:</span>
                     <span className="text-2xl font-bold text-red-600">${charges.balance.toFixed(2)}</span>
                   </div>
                 </>
               );
             })()}
          </div>

          <div className="mt-8 flex justify-end gap-3">
             <button 
                onClick={() => setStep('search')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
             >
                Back
             </button>
             {/* Disable button if not allowed */}
             {(() => {
                 const { allowed } = getPickupEligibility(selectedTicket);
                 return (
                     <button
                        onClick={handleProceedToPayment}
                        disabled={!allowed}
                        className={`px-6 py-2 rounded-lg font-medium flex items-center
                            ${allowed 
                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                     >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Proceed to Payment
                     </button>
                 );
             })()}
          </div>
        </div>
      )}

      {/* --- STEP 3: PAYMENT & CHANGE CALCULATION --- */}
      {step === 'payment' && selectedTicket && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Collect Payment</h3>
            
            {(() => {
                const { balance } = computeCharges(selectedTicket);
                const tendered = parseFloat(cashTendered) || 0;
                const change = tendered - balance;
                const isInsufficient = tendered < balance;
                const isValidInput = cashTendered !== ''; 

                return (
                    <>
                        <div className="mb-6 text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 mb-1 text-sm uppercase tracking-wide">Balance Due</p>
                            <p className="text-4xl font-extrabold text-gray-800">
                                ${balance.toFixed(2)}
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Cash Tendered (From Customer)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-lg font-bold">$</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    autoFocus
                                    placeholder="0.00"
                                    value={cashTendered}
                                    onChange={(e) => setCashTendered(e.target.value)}
                                    className={`
                                        block w-full pl-8 pr-4 py-3 text-xl font-bold rounded-lg border focus:ring-2 focus:outline-none
                                        ${isInsufficient && isValidInput ? 'border-red-300 ring-red-200 text-red-600' : 'border-gray-300 ring-blue-500 text-gray-900'}
                                    `}
                                />
                            </div>
                            
                            <button 
                                type="button"
                                onClick={() => setCashTendered(balance.toFixed(2))}
                                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                            >
                                Exact Amount
                            </button>
                        </div>

                        <div className={`mb-8 p-4 rounded-lg text-center transition-colors duration-200 ${isValidInput && !isInsufficient ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100'}`}>
                            {isValidInput ? (
                                isInsufficient ? (
                                    <>
                                        <p className="text-red-600 font-bold mb-1 flex items-center justify-center gap-2">
                                            <AlertCircle size={18} /> Insufficient Funds
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Still needs: <span className="font-bold">${(balance - tendered).toFixed(2)}</span>
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-green-700 font-bold text-sm uppercase tracking-wide mb-1">Change Due</p>
                                        <p className="text-3xl font-extrabold text-green-600">
                                            ${change.toFixed(2)}
                                        </p>
                                    </>
                                )
                            ) : (
                                <p className="text-gray-400 text-sm italic">Enter cash amount to calculate change</p>
                            )}
                        </div>

                        <button
                            onClick={handleProcessPickup}
                            disabled={loading || isInsufficient || !isValidInput}
                            className={`
                                w-full py-3 rounded-lg font-bold text-lg flex justify-center items-center transition-all
                                ${loading || isInsufficient || !isValidInput 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                }
                            `}
                        >
                            {loading ? 'Processing...' : 'Complete Transaction'}
                        </button>
                        
                        <button 
                            onClick={() => setStep('details')}
                            className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Cancel
                        </button>
                    </>
                );
            })()}
        </div>
      )}

      {/* --- MODALS --- */}
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
                        const combined = `${printContent}<div class="page-break"></div>${plantPrintContent}`;
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