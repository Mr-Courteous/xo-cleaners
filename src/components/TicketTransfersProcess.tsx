import React, { useState, useEffect } from 'react';
import { useColors } from '../state/ColorsContext';
import {
  Loader2, Search, PackageCheck, MapPin,
  CheckCircle2, X, RefreshCw, User, LayoutGrid, LogOut, Truck, AlertCircle, Archive
} from 'lucide-react';
import axios from 'axios';
import baseURL from '../lib/config';
import PrintPreviewModal from './PrintPreviewModal';
import renderPickupReceiptHtml from '../lib/pickupReceiptTemplate';

interface Rack {
  number: string;
  is_occupied: boolean;
}

interface Ticket {
  id: number;
  ticket_number: string;
  customer_name: string;
  status: string;
  transfer_status: string;
  origin_branch: string;
  origin_branch_name?: string;
  rack_number?: string | null;
  created_at?: string;
  sent_at?: string;
  accepted_at?: string;
}

interface Modal {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
}

const TicketTransfersProcess = () => {
  const { colors } = useColors();
  const [incomingTickets, setIncomingTickets] = useState<Ticket[]>([]);
  const [availableRacks, setAvailableRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Tabs: 'incoming' (In Transit), 'to_rack' (Arrived/Accepted), 'ready' (Completion), 'all' (Full Inventory)
  const [activeTab, setActiveTab] = useState<'incoming' | 'to_rack' | 'ready' | 'all'>('incoming');

  // UI States - Multi-select for batch operations
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [isRackingModalOpen, setIsRackingModalOpen] = useState(false);
  const [currentTicketForRacking, setCurrentTicketForRacking] = useState<Ticket | null>(null);
  const [selectedRack, setSelectedRack] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Printing States
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printContent, setPrintContent] = useState('');

  // Modal Feedback
  const [modal, setModal] = useState<Modal>({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to parse backend error responses (from RackManagement pattern)
  const parseApiError = (error: any): string => {
    if (!error) return 'An unknown error occurred';
    const resp = error.response?.data;
    if (resp) {
      if (typeof resp.detail === 'string') return resp.detail;
      if (Array.isArray(resp.detail) && resp.detail.length > 0) {
        const first = resp.detail[0];
        if (first.msg) return first.msg;
        if (first.message) return first.message;
        try { return JSON.stringify(resp.detail); } catch { /* fallthrough */ }
      }
      if (typeof resp.message === 'string') return resp.message;
      if (typeof resp.error === 'string') return resp.error;
      if (typeof resp === 'string') return resp;
      try { return JSON.stringify(resp); } catch { /* fallthrough */ }
    }
    if (error.message) return error.message;
    return 'An unknown error occurred';
  };

  const showModal = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setModal({ isOpen: true, title, message, type });
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");
    try {
      const [inventoryRes, racksRes] = await Promise.all([
        // Fetch all plant inventory (all tickets transferred to this plant)
        axios.get(`${baseURL}/api/organizations/plant/inventory`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${baseURL}/api/organizations/racks`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      console.log("Inventory Response:", inventoryRes.data);

      const mappedTickets = (inventoryRes.data.tickets || []).map((ticket: any) => ({
        ...ticket,
        origin_branch_name: ticket.origin_branch || ticket.origin_branch_name || 'Unknown Branch'
      }));

      console.log("Fetched Tickets:", mappedTickets);
      setIncomingTickets(mappedTickets);

      // Get all racks and filter for available ones (not occupied) - matches RackManagement pattern
      const allRacks = racksRes.data.racks || [];
      const available = allRacks.filter((rack: Rack) => !rack.is_occupied);
      setAvailableRacks(available);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      const errorMsg = err.response?.data?.detail || 'Failed to load data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- 1. BATCH ACCEPT LOGIC ---
  const handleBatchAccept = async () => {
    if (selectedTickets.length === 0) {
      showModal("No Selection", "Please select at least one ticket to accept", 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${baseURL}/api/organizations/batch-receive`, {
        ticket_ids: selectedTickets
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showModal("Success", `Accepted ${selectedTickets.length} tickets into plant inventory`, 'success');
      setSelectedTickets([]);
      await fetchData();
      setActiveTab('to_rack');
    } catch (err: any) {
      const errorMsg = parseApiError(err);
      showModal("Failed to Accept", errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 2. RACKING LOGIC ---
  const handleAssignRack = async () => {
    // 1. Safety check
    if (!currentTicketForRacking || !selectedRack) {
      setError("Please select a rack before confirming");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Capture values into constants immediately before state changes
    const ticketId = currentTicketForRacking.id;
    const ticketNum = currentTicketForRacking.ticket_number;
    const rackNum = selectedRack;

    try {
      const token = localStorage.getItem("accessToken");

      const res = await axios.put(
        `${baseURL}/api/organizations/tickets/${ticketId}/rack-a-transfered-ticket`,
        { rack_number: rackNum },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );

      // 2. Check for success in the response body
      if (res.data.success === true || res.status === 200) {

        // 3. Close Modal and Reset selection state
        setIsRackingModalOpen(false);
        setCurrentTicketForRacking(null);
        setSelectedRack("");

        // 4. Simple success alert
        alert(`Success: Ticket #${ticketNum} assigned to rack ${rackNum}`);

      } else {
        // Backend returned 200 but success: false
        throw new Error(res.data.detail || "Server logic failed to assign rack");
      }

    } catch (err: any) {
      console.error('Rack assignment error:', err);

      // Determine error message
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to assign rack';

      setError(errorMsg);
      alert(`RACKING FAILED: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- 3. COMPLETION LOGIC ---
  const handleFinalPickup = async (ticket: Ticket) => {
    if (!window.confirm(`Release ticket #${ticket.ticket_number} to customer?`)) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(
        `${baseURL}/api/organizations/tickets/${ticket.id}/transfer-pickup`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // const html = renderPickupReceiptHtml(ticket);
        // setPrintContent(html);
        // setShowPrintPreview(true);
        fetchData();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Pickup failed';
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTicketSelection = (ticketId: number) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const filteredTickets = incomingTickets.filter(t => {
    const matchesSearch = t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'incoming') {
      // Show tickets that are requested or in transit (not yet at plant)
      return matchesSearch && (t.transfer_status === 'requested' || t.transfer_status === 'in_transit');
    } else if (activeTab === 'to_rack') {
      // Show tickets at plant that haven't been racked yet
      return matchesSearch && t.transfer_status === 'at_plant';
    } else if (activeTab === 'ready') {
      // Show tickets ready at branch
      return matchesSearch && t.transfer_status === 'ready_at_branch';
    } else if (activeTab === 'all') {
      // Show all tickets with full inventory details
      return matchesSearch;
    }
  });

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin w-10 h-10" style={{ color: colors.primaryColor }} />
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#F4F7FE] min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Plant Terminal</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Receive, Rack & Release</p>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase transition-all flex items-center gap-2 ${activeTab === 'incoming' ? 'text-white shadow-md' : 'text-slate-400'}`}
              style={{ backgroundColor: activeTab === 'incoming' ? colors.primaryColor : 'transparent' }}
            >
              <Truck size={14} /> Incoming
            </button>
            <button
              onClick={() => setActiveTab('to_rack')}
              className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase transition-all flex items-center gap-2 ${activeTab === 'to_rack' ? 'text-white shadow-md' : 'text-slate-400'}`}
              style={{ backgroundColor: activeTab === 'to_rack' ? colors.primaryColor : 'transparent' }}
            >
              <LayoutGrid size={14} /> To Rack
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase transition-all flex items-center gap-2 ${activeTab === 'ready' ? 'text-white shadow-md' : 'text-slate-400'}`}
              style={{ backgroundColor: activeTab === 'ready' ? colors.primaryColor : 'transparent' }}
            >
              <PackageCheck size={14} /> Ready
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase transition-all flex items-center gap-2 ${activeTab === 'all' ? 'text-white shadow-md' : 'text-slate-400'}`}
              style={{ backgroundColor: activeTab === 'all' ? colors.primaryColor : 'transparent' }}
            >
              <Archive size={14} /> Inventory
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-black text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto"><X size={20} className="text-red-600" /></button>
          </div>
        )}

        {/* Search & Batch Actions */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input
              type="text"
              placeholder="Search ticket # or customer..."
              className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-[2rem] shadow-sm font-bold text-slate-700 focus:ring-2 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {activeTab === 'incoming' && (
            <div className="flex gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              {selectedTickets.length > 0 && (
                <>
                  <button
                    onClick={handleBatchAccept}
                    disabled={isSubmitting}
                    className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 text-white disabled:opacity-50"
                    style={{ backgroundColor: colors.primaryColor }}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={16} /> Accept {selectedTickets.length} Tickets</>}
                  </button>
                  <button
                    onClick={() => setSelectedTickets([])}
                    className="px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-600 border border-slate-300 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  const allIncomingIds = incomingTickets
                    .filter(t => t.transfer_status === 'requested' || t.transfer_status === 'in_transit')
                    .map(t => t.id);
                  if (allIncomingIds.length === 0) {
                    showModal('No Tickets', 'No tickets available to accept', 'error');
                    return;
                  }
                  setSelectedTickets(allIncomingIds);
                }}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border-2 disabled:opacity-50 transition-all"
                style={{ borderColor: colors.primaryColor, backgroundColor: `${colors.primaryColor}10`, color: colors.primaryColor }}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <>Select All</>}
              </button>
            </div>
          )}

          {activeTab === 'to_rack' && (
            <div className="flex gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <button
                onClick={async () => {
                  const allAtPlantIds = incomingTickets
                    .filter(t => t.transfer_status === 'at_plant')
                    .map(t => t.id);
                  if (allAtPlantIds.length === 0) {
                    showModal('No Tickets', 'No tickets ready to receive', 'error');
                    return;
                  }
                  setIsSubmitting(true);
                  try {
                    const token = localStorage.getItem("accessToken");
                    await axios.post(`${baseURL}/api/organizations/batch-receive`, {
                      ticket_ids: allAtPlantIds
                    }, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    showModal("Success", `Received ${allAtPlantIds.length} tickets`, 'success');
                    await fetchData();
                  } catch (err: any) {
                    const errorMsg = parseApiError(err);
                    showModal("Failed", errorMsg, 'error');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 text-white disabled:opacity-50"
                style={{ backgroundColor: colors.primaryColor }}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <>Receive All</>}
              </button>
            </div>
          )}
        </div>

        {/* Tickets Grid - Only for card views */}
        {activeTab !== 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              className={`bg-white rounded-[2.5rem] p-6 shadow-sm border transition-all cursor-pointer ${selectedTickets.includes(ticket.id)
                  ? `border-2 border-blue-500 bg-blue-50`
                  : 'border-slate-100 hover:shadow-md'
                }`}
              onClick={() => activeTab === 'incoming' && toggleTicketSelection(ticket.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter" style={{ backgroundColor: `${colors.primaryColor}15`, color: colors.primaryColor }}>
                  #{ticket.ticket_number}
                </div>
                {activeTab === 'incoming' && (
                  <input
                    type="checkbox"
                    checked={selectedTickets.includes(ticket.id)}
                    onChange={() => toggleTicketSelection(ticket.id)}
                    className="w-5 h-5 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                {ticket.rack_number && (
                  <div className="flex items-center gap-1 text-emerald-600 font-black text-xs">
                    <MapPin size={14} /> {ticket.rack_number}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 truncate">
                  <User size={18} className="text-slate-300" /> {ticket.customer_name}
                </h3>
                <p className="text-slate-400 text-[9px] font-bold uppercase mt-1 tracking-wider">
                  From: {ticket.origin_branch_name || 'Main Branch'}
                </p>
              </div>

              {activeTab === 'to_rack' && (
                <button
                  onClick={() => {
                    setCurrentTicketForRacking(ticket);
                    setIsRackingModalOpen(true);
                    setSelectedRack("");
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800"
                >
                  <MapPin size={16} /> Assign Rack
                </button>
              )}

              {activeTab === 'ready' && (
                <button
                  onClick={() => handleFinalPickup(ticket)}
                  disabled={isSubmitting}
                  className="w-full py-4 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                  style={{ backgroundColor: '#10b981' }}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><LogOut size={16} /> Release to Drop Off Station</>}
                </button>
              )}
            </div>
          ))}
        </div>
        ) : (
        // TABLE VIEW FOR ALL INVENTORY
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-slate-700 uppercase text-[10px] tracking-wider">Ticket #</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700 uppercase text-[10px] tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700 uppercase text-[10px] tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700 uppercase text-[10px] tracking-wider">From</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700 uppercase text-[10px] tracking-wider">Rack #</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700 uppercase text-[10px] tracking-wider">Sent</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700 uppercase text-[10px] tracking-wider">Accepted</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket, idx) => (
                  <tr key={ticket.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-6 py-4 font-black text-slate-900">{ticket.ticket_number}</td>
                    <td className="px-6 py-4 text-slate-700">{ticket.customer_name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold" style={{
                        backgroundColor: ticket.transfer_status === 'received' ? '#ecfdf5' : ticket.transfer_status === 'at_plant' ? '#eff6ff' : '#fef3c7',
                        color: ticket.transfer_status === 'received' ? '#059669' : ticket.transfer_status === 'at_plant' ? '#0284c7' : '#d97706'
                      }}>
                        {ticket.transfer_status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-xs">{ticket.origin_branch || 'Unknown'}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{ticket.rack_number || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{ticket.sent_at ? new Date(ticket.sent_at).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{ticket.accepted_at ? new Date(ticket.accepted_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {filteredTickets.length === 0 && (
          <div className="text-center py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <RefreshCw size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No items in this stage</p>
            <button onClick={fetchData} className="mt-4 px-6 py-2 rounded-xl text-sm font-bold text-slate-600 border border-slate-300 hover:bg-slate-50">
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* RACK MODAL */}
      {isRackingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-8 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Assign to Rack</h2>
                <p className="text-slate-400 text-xs font-bold uppercase mt-2">
                  Ticket: #{currentTicketForRacking?.ticket_number}
                </p>
                <p className="text-slate-500 text-xs font-bold mt-1">
                  Customer: {currentTicketForRacking?.customer_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsRackingModalOpen(false);
                  setSelectedRack("");
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={24} className="text-slate-600" />
              </button>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-sm font-black uppercase text-slate-700 mb-4 tracking-widest">Select Available Rack</h3>
                {availableRacks.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {availableRacks.map((rack, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedRack(rack.number)}
                        className={`py-6 px-2 rounded-2xl font-black transition-all border-2 text-center ${selectedRack === rack.number
                            ? 'text-white border-2 shadow-lg scale-105'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100'
                          }`}
                        style={{
                          backgroundColor: selectedRack === rack.number ? colors.primaryColor : '',
                          borderColor: selectedRack === rack.number ? colors.primaryColor : ''
                        }}
                      >
                        <div className="text-lg">{rack.number}</div>
                        <div className="text-[9px] opacity-75 mt-1">
                          {rack.is_occupied ? 'Occupied' : 'Available'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500 font-bold">No available racks</p>
                  </div>
                )}
              </div>

              {selectedRack && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-black text-blue-900">
                    Selected Rack: <span className="text-lg text-blue-600">{selectedRack}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAssignRack}
                  disabled={isSubmitting || !selectedRack}
                  className="flex-1 py-5 rounded-[1.5rem] text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg"
                  style={{ backgroundColor: colors.primaryColor }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Assigning...
                    </>
                  ) : (
                    <>
                      <MapPin size={16} /> Confirm Placement
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsRackingModalOpen(false);
                    setSelectedRack("");
                  }}
                  disabled={isSubmitting}
                  className="px-6 py-5 rounded-[1.5rem] text-slate-700 font-black uppercase text-xs border-2 border-slate-300 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onPrint={() => { }}
        content={printContent}
        note="Release successful. Receipt generated."
      />

      {/* MODAL FEEDBACK */}
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
    </div>
  );
};

export default TicketTransfersProcess;