import React, { useState, useMemo } from 'react';
import {
  Search, CheckCircle, AlertCircle, Printer,
  CreditCard, DollarSign, User, History, Wallet, ArrowLeft, MapPin, Calculator, Loader2, X
} from 'lucide-react';
import { Ticket } from '../types';
import axios from 'axios';
import baseURL from '../lib/config';
import PrintPreviewModal from './PrintPreviewModal';
import { useColors } from '../state/ColorsContext';

// --- Imports for Template Generation ---
import renderPickupReceiptHtml from '../lib/pickupReceiptTemplate';
import renderPlantReceiptHtml from '../lib/plantReceiptTemplate';

// --- Types for Checkout Profile ---
interface TicketCheckoutItem {
  id: number;
  ticket_number: string;
  status: string;
  created_at: string;
  total_amount: number;
  paid_amount: number;
  remaining_balance: number;
  is_fully_paid: boolean;
}

interface CustomerCheckoutProfile {
  customer_id: number;
  customer_name: string;
  customer_email: string;
  total_debt: number;
  total_credit: number;
  net_balance: number; // Positive = They owe money
  tickets: TicketCheckoutItem[];
}

type Step = 'search' | 'details' | 'payment';

export default function PickUp() {
  const { colors } = useColors();
  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Checkout Profile State ---
  const [checkoutProfile, setCheckoutProfile] = useState<CustomerCheckoutProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Detail View State for Unpaid Tickets
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTicket, setDetailTicket] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Payment State
  const [cashTendered, setCashTendered] = useState<string>('');

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' as 'error' | 'success' });

  // --- PRINTING STATE ---
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printContent, setPrintContent] = useState('');
  const [plantPrintContent, setPlantPrintContent] = useState('');

  // --- Helper: Print Job (Iframe Method) ---
  const handlePrintJob = (content: string) => {
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);

    // Write content and styles
    printFrame.contentDocument?.write(`
      <html>
        <head>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; font-family: monospace; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);

    printFrame.contentDocument?.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => document.body.removeChild(printFrame), 2000);
    }, 500);
  };

  // --- Financial Calculation Logic ---
  const financials = useMemo(() => {
    if (!selectedTicket || !selectedTicket.items) {
      return { subtotal: 0, env: 0, tax: 0, total: 0, paid: 0, balance: 0 };
    }

    // 1. Calculate Subtotal
    const subtotal = selectedTicket.items.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.item_total) || 0);
    }, 0);

    // 2. Calculate Fees
    const env = subtotal * 0.047; // 4.7%
    const tax = subtotal * 0.0825; // 8.25%
    const total = subtotal + env + tax;

    // 3. Balance
    const paid = Number(selectedTicket.paid_amount) || 0;
    const balance = total - paid;

    return { subtotal, env, tax, total, paid, balance };
  }, [selectedTicket]);

  // --- 1. Search Tickets ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${baseURL}/api/organizations/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: searchQuery } // Assuming backend supports ?search= param
      });

      // If backend doesn't support ?search, filter manually here like previous version
      const allTickets: Ticket[] = response.data;
      // Ensure we filter if the API returns all
      const filtered = allTickets.filter(t =>
        t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setTickets(filtered);
      setStep('search');
    } catch (error) {
      console.error("Search error:", error);
      showModal("Error", "Failed to search tickets.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Select Ticket ---
  const handleSelectTicket = async (ticketStub: Ticket) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      // Fetch FULL ticket details
      const ticketResponse = await axios.get(`${baseURL}/api/organizations/tickets/${ticketStub.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const fullTicket = ticketResponse.data;
      setSelectedTicket(fullTicket);
      setCashTendered('');
      setCheckoutProfile(null);

      // Fetch Financial Profile if customer exists
      if (fullTicket.customer_id) {
        fetchCheckoutProfile(fullTicket.customer_id);
      }

      setStep('details');
    } catch (error) {
      console.error("Selection error:", error);
      showModal("Error", "Failed to load ticket details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckoutProfile = async (customerId: number) => {
    setLoadingProfile(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${baseURL}/api/organizations/customers/${customerId}/checkout-profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCheckoutProfile(response.data);
    } catch (error) {
      console.error("Failed to load customer profile", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // --- Fetch Detail for Unpaid Ticket ---
  const handleViewUnpaidTicketDetail = async (ticketId: number) => {
    setLoadingDetail(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${baseURL}/api/organizations/tickets/${ticketId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Detail Ticket Data:", response.data);
      setDetailTicket(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Failed to load ticket detail", error);
      showModal("Error", "Failed to load ticket details.", "error");
    } finally {
      setLoadingDetail(false);
    }
  };

  const proceedToPayment = () => {
    if (selectedTicket) {
      const remaining = financials.balance;
      setCashTendered(remaining > 0 ? remaining.toFixed(2) : '0.00');
    }
    setStep('payment');
  };

  const handleBack = () => {
    if (step === 'payment') setStep('details');
    else if (step === 'details') setStep('search');
  };

  // --- 3. Process Pickup ---
  const handleCompletePickup = async () => {
    if (!selectedTicket) return;

    const paymentAmount = parseFloat(cashTendered) || 0;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${baseURL}/api/organizations/tickets/${selectedTicket.id}/pickup`,
        { amount_paid: paymentAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Merge backend data
        const updatedTicket = {
          ...selectedTicket,
          paid_amount: response.data.new_total_paid,
          status: response.data.new_status
        } as Ticket;

        // --- GENERATE HTML TEMPLATES ---
        const receiptHtml = renderPickupReceiptHtml(updatedTicket);
        const plantHtml = renderPlantReceiptHtml ? renderPlantReceiptHtml(updatedTicket) : '';

        setPrintContent(receiptHtml);
        setPlantPrintContent(plantHtml);

        setShowPrintPreview(true);

        // Reset Local Data
        setTickets([]);
        setSearchQuery('');
        setSelectedTicket(null);
        setStep('search');
      }
    } catch (error: any) {
      console.error("Pickup error:", error);
      showModal("Failed", error.response?.data?.detail || "Could not process pickup.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showModal = (title: string, message: string, type: 'error' | 'success') => {
    setModal({ isOpen: true, title, message, type });
  };

  const getPaymentStatus = () => {
    const balance = financials.balance;
    const tendered = parseFloat(cashTendered) || 0;
    const newBalance = balance - tendered;

    if (newBalance > 0.01) return { status: 'PARTIAL', amount: newBalance, label: 'Remaining Balance' };
    if (newBalance < -0.01) return { status: 'OVERPAID', amount: Math.abs(newBalance), label: 'Change Due' };
    return { status: 'FULL', amount: 0, label: 'Settled' };
  };

  const paymentCalc = getPaymentStatus();

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen bg-gray-50">

      {/* --- HEADER --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Pick Up & Checkout</h1>
        <p className="text-gray-500 mt-1">Process payments, check debts, and release tickets</p>
      </div>

      {/* --- STEP 1: SEARCH --- */}
      {step === 'search' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Scan ticket or search by name/phone..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 px-4 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: colors.primaryColor }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {tickets.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Results</h3>
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className="flex justify-between items-center p-4 bg-white hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm" style={{ backgroundColor: colors.primaryColor, color: '#fff' }}>
                      {ticket.ticket_number.split('-').pop()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 group-hover:text-indigo-700">{ticket.customer_name}</p>
                      <p className="text-xs text-gray-500">Ticket #{ticket.ticket_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${ticket.status === 'ready_for_pickup' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                      {ticket.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <p className="text-sm font-bold text-gray-800 mt-1">${ticket.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- STEP 2: DETAILS --- */}
      {step === 'details' && selectedTicket && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">

          {/* Left: Ticket Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Ticket #{selectedTicket.ticket_number}</h2>
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <User size={16} /> {selectedTicket.customer_name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-blue-800 bg-blue-50 px-3 py-1 rounded-full mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="font-bold">{selectedTicket.rack_number || 'Unassigned'}</span>
                  </div>
                  <span className="text-xs text-gray-400">{selectedTicket.items?.length || 0} Items</span>
                </div>
              </div>

              <div className="space-y-3">
                {selectedTicket.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full text-xs font-bold">
                        {item.quantity}
                      </span>
                      <span className="text-gray-700 font-medium">
                        {item.clothing_name || item.custom_name}
                      </span>
                    </div>
                    <span className="text-gray-900 font-semibold">${parseFloat(item.item_total || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Summary & Action */}
          <div className="space-y-6">
            {checkoutProfile && checkoutProfile.total_debt > 0.01 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 shadow-sm">
                <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="text-red-800 font-bold">Previous Debt Found</h3>
                  <p className="text-red-600 text-sm mt-1">
                    Customer owes <span className="font-bold">${checkoutProfile.total_debt.toFixed(2)}</span> from previous tickets.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              {/* Financial Breakdown */}
              <div className="flex justify-between mb-2 text-gray-500 text-sm">
                <span>Subtotal</span>
                <span>${financials.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2 text-gray-500 text-sm">
                <span>Env Charge (4.7%)</span>
                <span>${financials.env.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2 text-gray-500 text-sm">
                <span>Tax (8.25%)</span>
                <span>${financials.tax.toFixed(2)}</span>
              </div>
              <div className="border-t my-2 border-dashed"></div>
              <div className="flex justify-between mb-2 text-gray-800 font-bold">
                <span>Total</span>
                <span>${financials.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-4 text-green-600">
                <span>Paid So Far</span>
                <span>- ${financials.paid.toFixed(2)}</span>
              </div>

              <div className="border-t pt-4 flex justify-between items-end">
                <span className="text-gray-800 font-medium">Balance Due</span>
                <span className="text-3xl font-bold text-gray-900">
                  ${financials.balance.toFixed(2)}
                </span>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={proceedToPayment}
                  className="flex-1 px-4 py-3 text-white rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-0.5"
                  style={{ backgroundColor: colors.primaryColor }}
                >
                  Pay & Pickup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 3: PAYMENT & FINANCIALS --- */}
      {/* --- STEP 3: PAYMENT & FINANCIALS --- */}
{step === 'payment' && selectedTicket && (
  <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in zoom-in-95 duration-300">

    {/* --- LEFT: WALLET / HISTORY (lg:col-span-5) --- */}
    <div className="lg:col-span-5 space-y-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-slate-400 font-bold text-[8px] uppercase tracking-widest hover:text-indigo-600 transition-colors mb-1"
      >
        <ArrowLeft size={10} /> Back to Ticket
      </button>

      {/* Customer Wallet Card - High Contrast Slate */}
      <div className="bg-slate-900 rounded-[1.2rem] p-4 text-white shadow-lg relative overflow-hidden border border-slate-800">
        <div className="absolute -top-10 -right-10 p-14 bg-indigo-500/5 rounded-full pointer-events-none blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-indigo-600 rounded-md">
              <Wallet className="text-white" size={12} />
            </div>
            <h3 className="font-bold text-[9px] uppercase tracking-widest text-indigo-100/70">Customer Wallet</h3>
          </div>

          {loadingProfile ? (
            <div className="animate-pulse space-y-2">
              <div className="h-2 bg-slate-800 rounded w-1/4"></div>
              <div className="h-5 bg-slate-800 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-500 text-[7.5px] uppercase tracking-wider font-bold mb-0.5">Previous Debt</p>
                  <p className="text-lg font-bold text-rose-400/90 tracking-tight">
                    ${checkoutProfile?.total_debt.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[7.5px] uppercase tracking-wider font-bold mb-0.5">Store Credit</p>
                  <p className="text-lg font-bold text-emerald-400/90 tracking-tight">
                    ${checkoutProfile?.total_credit.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[7.5px] tracking-widest mb-0.5">Net Balance</p>
                    <p className={`text-xl font-bold tracking-tight ${(checkoutProfile?.net_balance || 0) > 0.01 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {(checkoutProfile?.net_balance || 0) > 0.01 ? '-' : '+'}
                      ${Math.abs(checkoutProfile?.net_balance || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className={`p-1 rounded-full ${(checkoutProfile?.net_balance || 0) > 0.01 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {(checkoutProfile?.net_balance || 0) > 0.01 ? <AlertCircle size={10} /> : <CheckCircle size={10} />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Other Unpaid Tickets List */}
      {checkoutProfile && checkoutProfile.tickets.some(t => !t.is_fully_paid && t.id !== selectedTicket.id) && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <h4 className="font-bold text-[8px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <History size={10} className="text-indigo-400" /> Unpaid History
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
            {checkoutProfile.tickets
              .filter(t => !t.is_fully_paid && t.id !== selectedTicket.id)
              .map(t => (
                <button
                  key={t.id}
                  onClick={() => handleViewUnpaidTicketDetail(t.id)}
                  disabled={loadingDetail}
                  className="w-full flex justify-between items-center p-2 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all group disabled:opacity-50"
                >
                  <div className="text-left">
                    <p className="font-bold text-slate-700 text-[10px] group-hover:text-indigo-700">#{ }</p>
                    <p className="text-[7px] text-slate-400 font-medium uppercase">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-rose-600 text-[11px]">${t.remaining_balance.toFixed(2)}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>

    {/* --- RIGHT: PAYMENT INPUT (lg:col-span-7) --- */}
    <div className="lg:col-span-7 bg-white p-6 rounded-[1.5rem] shadow-lg border border-slate-100 flex flex-col relative overflow-hidden">
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Checkout</h2>
            <p className="text-slate-400 font-medium text-[10px]">Confirm payment details</p>
          </div>
          <Calculator className="text-slate-100" size={24} />
        </div>

        {/* Current Ticket Summary Box */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center mb-5">
          <div>
            <p className="text-slate-400 font-bold uppercase text-[7.5px] tracking-widest mb-0.5">Order Selected</p>
            <p className="text-slate-800 font-bold text-sm">#{selectedTicket.ticket_number}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 font-bold uppercase text-[7.5px] tracking-widest mb-0.5">Balance Due</p>
            <p className="text-xl font-bold text-indigo-600 tracking-tight">${financials.balance.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-4 flex-grow">
          {/* Amount Tendered Field */}
          <div>
            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Amount Tendered</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-lg">$</span>
              <input
                type="number"
                step="0.01"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xl font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          {/* Change & Remaining Balance Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Change</p>
              <p className={`text-md font-bold ${paymentCalc.status === 'OVERPAID' ? 'text-emerald-600' : 'text-slate-300'}`}>
                ${paymentCalc.status === 'OVERPAID' ? paymentCalc.amount.toFixed(2) : '0.00'}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Remaining</p>
              <p className={`text-md font-bold ${paymentCalc.status === 'PARTIAL' ? 'text-rose-600' : 'text-slate-300'}`}>
                ${paymentCalc.status === 'PARTIAL' ? paymentCalc.amount.toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button Area - THEMED */}
        <div className="mt-5">
          <button
            onClick={handleCompletePickup}
            disabled={loading || !cashTendered}
            className={`w-full py-3.5 rounded-lg text-[10px] font-bold text-white shadow transition-all active:scale-[0.98] flex justify-center items-center gap-2 uppercase tracking-widest`}
            style={paymentCalc.status === 'PARTIAL' ? undefined : { backgroundColor: colors.primaryColor }}
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : (
              <>
                <CreditCard size={14} />
                {paymentCalc.status === 'PARTIAL' ? 'Confirm Partial Payment' : 'Complete Pickup & Print'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      {/* --- MODALS --- */}
      
      {/* Detail Modal for Unpaid Tickets */}
      {showDetailModal && detailTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Ticket #{detailTicket.ticket_number}</h2>
                <p className="text-gray-500 mt-1">{detailTicket.customer_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailTicket(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Ticket Status & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Status</p>
                  <p className="text-lg font-bold text-gray-800">{detailTicket.status?.replace(/_/g, ' ').toUpperCase()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Created</p>
                  <p className="text-lg font-bold text-gray-800">{new Date(detailTicket.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Items List */}
              {detailTicket.items && detailTicket.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Items ({detailTicket.items.length})</h3>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                    {detailTicket.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start pb-2 border-b border-gray-200 last:border-0">
                        <div>
                          <p className="font-semibold text-gray-800">{item.clothing_name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Qty: {item.quantity} {item.pieces ? `(${item.pieces} pcs)` : ''}
                          </p>
                          {item.item_instructions && (
                            <p className="text-xs text-gray-600 mt-1 italic">Note: {item.item_instructions}</p>
                          )}
                        </div>
                        <p className="font-bold text-gray-800 text-right">${Number(item.item_total).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Summary */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-800">${Number(detailTicket.items?.reduce((sum: number, item: any) => sum + (Number(item.item_total) || 0), 0) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Env Charge (4.7%)</span>
                    <span className="font-semibold text-gray-800">${(Number(detailTicket.items?.reduce((sum: number, item: any) => sum + (Number(item.item_total) || 0), 0) || 0) * 0.047).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (8.25%)</span>
                    <span className="font-semibold text-gray-800">${(Number(detailTicket.items?.reduce((sum: number, item: any) => sum + (Number(item.item_total) || 0), 0) || 0) * 0.0825).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-blue-300 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-lg text-blue-600">${Number(detailTicket.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Paid</span>
                    <span className="font-semibold">- ${Number(detailTicket.paid_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-blue-300 pt-2 flex justify-between font-bold text-red-600">
                    <span>Balance Due</span>
                    <span className="text-lg">${(Number(detailTicket.total_amount || 0) - Number(detailTicket.paid_amount || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailTicket(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Option to select this ticket for payment
                  handleSelectTicket(detailTicket);
                  setShowDetailModal(false);
                  setDetailTicket(null);
                }}
                className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: colors.primaryColor }}
              >
                Pay This Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 transform transition-all">
            <h3 className={`text-xl font-bold mb-2 ${modal.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {modal.title}
            </h3>
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

      {/* Print Preview Modal - USING IFRAME LOGIC */}
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onPrint={() => { }}
        content={printContent}
        hideDefaultButton={true}
        extraActions={
          <>
              <button
                onClick={() => {
                  // Concatenate both receipts with a page break
                  const combined = `${printContent}<div class="page-break" style="page-break-before: always; height: 1px; display: block;"></div>${plantPrintContent}`;
                  handlePrintJob(combined);
                }}
                className="px-4 py-2 text-white rounded-lg flex items-center gap-2"
                style={{ background: `linear-gradient(90deg, ${colors.primaryColor}, ${colors.secondaryColor})` }}
              >
                <Printer size={18} />
                Print All (Cust + Plant)
              </button>
              <button
                onClick={() => handlePrintJob(printContent)}
                className="px-4 py-2 text-white rounded-lg flex items-center gap-2"
                style={{ backgroundColor: colors.primaryColor }}
              >
                <Printer size={18} />
                Print Customer Copy
              </button>
              <button
                onClick={() => handlePrintJob(plantPrintContent)}
                className="px-4 py-2 text-white rounded-lg flex items-center gap-2"
                style={{ backgroundColor: colors.secondaryColor }}
              >
                <Printer size={18} />
                Print Plant Copy
              </button>
          </>
        }
        note="Pickup processed successfully! Please select a print option."
      />

    </div>
  );
}