import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, User, Loader2, RefreshCw, AlertCircle, CheckSquare, Square, Send, X, Search, Filter } from 'lucide-react';
import axios from "axios";
import baseURL from "../lib/config";
import { useColors } from '../state/ColorsContext';

interface TicketTransfer {
  id: number;
  ticket_number: string;
  transfer_status: string;
  customer_name: string;
  created_at: string;
  transferred_at: string | null;
}

const BatchTransfer: React.FC = () => {
  const { colors } = useColors();
  const [tickets, setTickets] = useState<TicketTransfer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- SEARCH & FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // --- BATCH SELECTION STATE ---
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [plantCode, setPlantCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTransferTracker();
  }, []);

  const fetchTransferTracker = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${baseURL}/api/organizations/tickets-transfer-tracker`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.tickets) {
        setTickets(response.data.tickets);
      }
    } catch (err: any) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // --- FILTER LOGIC ---
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.transfer_status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleBatchTransfer = async () => {
    if (!plantCode.trim()) return alert("Please enter a plant connection code.");
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("accessToken");
      const payload = { ticket_ids: selectedIds, plant_connection_code: plantCode.trim() };
      const response = await axios.post(`${baseURL}/api/organizations/tickets/batch-transfer`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        alert(response.data.message);
        setPlantCode("");
        setSelectedIds([]);
        setIsDispatchModalOpen(false);
        fetchTransferTracker();
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Transfer failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const formatTimestamp = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin w-8 h-8" style={{ color: colors.primaryColor }} />
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl" style={{ backgroundColor: `${colors.primaryColor}15` }}>
              <ArrowRightLeft size={24} style={{ color: colors.primaryColor }} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Production Tracker</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filteredTickets.length} Results Found</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {selectedIds.length > 0 && (
              <button 
                onClick={() => setIsDispatchModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-transform active:scale-95"
                style={{ backgroundColor: colors.primaryColor }}
              >
                <Send size={18} /> Dispatch ({selectedIds.length})
              </button>
            )}
            <button onClick={fetchTransferTracker} className="p-2.5 text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by ticket # or customer name..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium text-sm shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none appearance-none font-bold text-xs uppercase tracking-widest text-gray-500 shadow-sm cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="requested">Requested</option>
              {/* <option value="accepted">Accepted</option> */}
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 w-10">
                    <button 
                      onClick={() => selectedIds.length === filteredTickets.length ? setSelectedIds([]) : setSelectedIds(filteredTickets.map(t => Number(t.id)))}
                      className="text-gray-400"
                    >
                      {selectedIds.length === filteredTickets.length && filteredTickets.length > 0 ? <CheckSquare size={20} style={{color: colors.primaryColor}} /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ticket</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    className={`transition-colors cursor-pointer ${selectedIds.includes(Number(ticket.id)) ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
                    onClick={() => toggleSelect(Number(ticket.id))}
                  >
                    <td className="px-6 py-5">
                      {selectedIds.includes(Number(ticket.id)) ? 
                        <CheckSquare size={20} style={{color: colors.primaryColor}} /> : 
                        <Square size={20} className="text-gray-300" />
                      }
                    </td>
                    <td className="px-6 py-5 font-mono text-base font-black" style={{ color: colors.primaryColor }}>
                      #{ticket.ticket_number}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 border border-gray-200 uppercase">
                          {ticket.customer_name.substring(0,2)}
                        </div>
                        {ticket.customer_name}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
                        {ticket.transfer_status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-tighter">
                        <div className="text-gray-400">In: {formatTimestamp(ticket.created_at)}</div>
                        {ticket.transferred_at && <div className="text-blue-500">Sent: {formatTimestamp(ticket.transferred_at)}</div>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTickets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white">
                <Search size={40} className="text-gray-100 mb-4" />
                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs">No matching tickets found</h3>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- DISPATCH MODAL (Remains Same) --- */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-black">Dispatch Batch</h2>
              <button onClick={() => setIsDispatchModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                <AlertCircle className="text-blue-500 shrink-0" size={20} />
                <p className="text-blue-700 text-xs font-bold leading-relaxed uppercase tracking-tight">
                  You are sending {selectedIds.length} tickets to an external plant for processing. This action will notify the receiving plant.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Plant Connection Code</label>
                <input 
                  type="text" 
                  value={plantCode}
                  onChange={(e) => setPlantCode(e.target.value.toUpperCase())}
                  placeholder="CODE-123-XYZ"
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-lg focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              <button 
                onClick={handleBatchTransfer}
                disabled={isSubmitting || !plantCode}
                className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg active:scale-95 transition-all"
                style={{ backgroundColor: colors.primaryColor }}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Confirm Dispatch</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchTransfer;