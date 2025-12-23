import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Loader2, Save, Calendar as CalendarIcon, Filter, 
  FileText, DollarSign, Users, Search, ArrowLeft, History
} from 'lucide-react';
import baseURL from '../lib/config';

// --- Types ---
interface RawTicket { 
    id: number; ticket_number: string; customer_id: number; 
    status: string; is_refunded: boolean; created_at: string; 
    updated_at: string | null; paid_amount: number; 
}
interface LedgerEntry {
    id: string; date: string; reference: string; 
    customer_name: string; type: string; amount: number; method: string;
}
interface RawCustomer { 
    id: number; first_name: string; last_name: string; 
    email: string; joined_at: string | null; 
}
interface FullOrgDataResponse {
  tickets: RawTicket[];
  items: any[];
  racks: any[];
  customers: RawCustomer[];
  ledger: LedgerEntry[];
}

// --- Helper Functions ---
const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } });
const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

// --- CHART COMPONENTS ---
const SimpleChart = ({ data, type, color = "blue" }: { data: { label: string; value: number }[], type: 'Bar' | 'Pie' | 'Line', color?: string }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (type === 'Pie') {
        let cumulative = 0;
        return (
            <div className="flex items-center justify-center gap-8 h-64">
                <svg viewBox="0 0 100 100" className="w-48 h-48 transform -rotate-90">
                    {data.map((d, i) => {
                        const pct = Math.abs(d.value) / total;
                        const dash = `${pct * 314} 314`;
                        const offset = -cumulative * 314;
                        cumulative += pct;
                        return <circle key={i} cx="50" cy="50" r="25" fill="transparent" stroke={colors[i%5]} strokeWidth="20" strokeDasharray={dash} strokeDashoffset={offset} />;
                    })}
                </svg>
                <div className="space-y-1 text-xs">
                    {data.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{backgroundColor: colors[i%5]}}></span>
                            <span>{d.label}</span>
                            <span className="font-bold">{formatCurrency(d.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex items-end justify-between h-64 gap-2 pt-10 pb-2 w-full">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                     <div className="absolute -top-8 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                        {d.label}: {formatCurrency(d.value)}
                    </div>
                    <div 
                        className={`w-full max-w-[40px] rounded-t transition-all duration-500 ${d.value < 0 ? 'bg-red-400' : 'bg-green-500'}`} 
                        style={{ height: `${Math.max((Math.abs(d.value) / max) * 100, 2)}%` }}
                    ></div>
                    <div className="text-[10px] text-gray-500 mt-2 truncate w-full text-center px-1 border-t pt-1">{d.label}</div>
                </div>
            ))}
        </div>
    );
};

export default function DashboardAnalytics() {
  const [data, setData] = useState<FullOrgDataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // View State
  const [viewMode, setViewMode] = useState<'operations' | 'financials' | 'customers'>('operations');
  
  // Customer View State
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Controls State
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [quickFilter, setQuickFilter] = useState('30days');
  const [chartType, setChartType] = useState<'None' | 'Bar' | 'Line' | 'Pie'>('None');
  
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
  }, []);

  useEffect(() => {
    axios.get(`${baseURL}/api/organizations/analytics/dashboard`, getAuthHeaders())
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  // --- DATA PROCESSING ---
  const filteredData = useMemo(() => {
    if (!data) return { tickets: [], ledger: [] };
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59);

    const tickets = data.tickets.filter(t => {
        const d = new Date(t.created_at);
        return d >= start && d <= end;
    }).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const ledger = data.ledger.filter(l => {
        const d = new Date(l.date);
        return d >= start && d <= end;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { tickets, ledger };
  }, [data, dateRange]);

  const processedCustomers = useMemo(() => {
    if (!data) return [];
    const stats = new Map<number, { count: number; spend: number; lastVisit: string }>();
    data.tickets.forEach(t => {
        if (!stats.has(t.customer_id)) {
            stats.set(t.customer_id, { count: 0, spend: 0, lastVisit: '' });
        }
        const s = stats.get(t.customer_id)!;
        s.count += 1;
        s.spend += (t.paid_amount || 0);
        if (!s.lastVisit || t.created_at > s.lastVisit) {
            s.lastVisit = t.created_at;
        }
    });

    const term = customerSearch.toLowerCase();
    return data.customers
        .filter(c => 
            (c.first_name + ' ' + c.last_name).toLowerCase().includes(term) ||
            (c.email || '').toLowerCase().includes(term)
        )
        .map(c => ({
            ...c,
            stats: stats.get(c.id) || { count: 0, spend: 0, lastVisit: null }
        }))
        .sort((a, b) => b.stats.spend - a.stats.spend);
  }, [data, customerSearch]);

  const selectedCustomerTickets = useMemo(() => {
     if (!selectedCustomerId || !data) return [];
     return data.tickets
        .filter(t => t.customer_id === selectedCustomerId)
        .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data, selectedCustomerId]);

  const totals = useMemo(() => {
    const tTotal = filteredData.tickets.reduce((acc, t) => acc + (t.paid_amount||0), 0);
    const lTotal = filteredData.ledger.reduce((acc, l) => acc + l.amount, 0);
    const lIncome = filteredData.ledger.filter(l => l.amount > 0).reduce((acc, l) => acc + l.amount, 0);
    const lRefunds = filteredData.ledger.filter(l => l.amount < 0).reduce((acc, l) => acc + l.amount, 0);
    return { tTotal, lTotal, lIncome, lRefunds };
  }, [filteredData]);

  const chartData = useMemo(() => {
    if (chartType === 'None') return [];
    if (viewMode === 'operations') {
        const map = new Map();
        filteredData.tickets.forEach(t => {
            const d = new Date(t.created_at).toLocaleDateString();
            map.set(d, (map.get(d)||0) + 1); 
        });
        return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
    } else if (viewMode === 'financials') {
        if (chartType === 'Pie') {
            return [ { label: 'Income', value: totals.lIncome }, { label: 'Refunds', value: Math.abs(totals.lRefunds) } ];
        }
        const map = new Map();
        filteredData.ledger.forEach(l => {
            const d = new Date(l.date).toLocaleDateString();
            map.set(d, (map.get(d)||0) + l.amount);
        });
        return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
    }
    return [];
  }, [filteredData, chartType, viewMode, totals]);

  // --- PDF GENERATION LOGIC ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const title = viewMode === 'operations' ? 'Operations Report' : viewMode === 'financials' ? 'Financial Ledger' : 'Customer Directory';
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text(title, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    if (viewMode !== 'customers') {
        doc.text(`Period: ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}`, 14, 36);
        doc.text(`Total Records: ${viewMode === 'operations' ? filteredData.tickets.length : filteredData.ledger.length}`, 14, 42);
        
        // Summary Block
        doc.setFontSize(12);
        doc.setTextColor(0);
        const totalText = viewMode === 'operations' 
            ? `Total Revenue: ${formatCurrency(totals.tTotal)}`
            : `Net Balance: ${formatCurrency(totals.lTotal)}`;
        doc.text(totalText, 14, 50);
    }

    // Table Content
    let head = [];
    let body = [];
    let startY = 55;

    if (viewMode === 'operations') {
        head = [['Ticket ID', 'Customer', 'Date', 'Status', 'Paid Amount']];
        body = filteredData.tickets.map(row => [
            row.ticket_number,
            data?.customers.find(c => c.id === row.customer_id)?.first_name || 'Walk-in',
            formatDate(row.created_at),
            row.status.replace(/_/g, ' '),
            formatCurrency(row.paid_amount)
        ]);
    } else if (viewMode === 'financials') {
        head = [['Date', 'Ref', 'Customer', 'Type', 'Amount']];
        body = filteredData.ledger.map(row => [
            formatDate(row.date),
            row.reference,
            row.customer_name,
            row.type,
            formatCurrency(row.amount)
        ]);
    } else if (viewMode === 'customers') {
        head = [['Name', 'Email', 'Visits', 'Total Spend', 'Last Visit']];
        body = processedCustomers.map(c => [
            `${c.first_name} ${c.last_name}`,
            c.email,
            c.stats.count,
            formatCurrency(c.stats.spend),
            c.stats.lastVisit ? formatDate(c.stats.lastVisit) : 'Never'
        ]);
        startY = 35; // Start higher since no date range text
    }

    autoTable(doc, {
        head: head,
        body: body,
        startY: startY,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] }, // Blue header
    });

    doc.save(`${title.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleQuickFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setQuickFilter(val);
    const end = new Date();
    const start = new Date();
    if (val === '7days') start.setDate(start.getDate() - 7);
    if (val === '30days') start.setDate(start.getDate() - 30);
    if (val === '90days') start.setDate(start.getDate() - 90);
    if (val === 'ytd') start.setMonth(0, 1);
    setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-gray-700 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500">
                {viewMode === 'operations' ? 'Tracking ticket volume and status' : 
                 viewMode === 'financials' ? 'Tracking revenue, payments, and refunds' : 
                 'Customer database and history'}
            </p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
             <button onClick={() => setViewMode('operations')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${viewMode === 'operations' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                <FileText size={16}/> Operations
             </button>
             <button onClick={() => setViewMode('financials')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${viewMode === 'financials' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>
                <DollarSign size={16}/> Financials
             </button>
             <button onClick={() => setViewMode('customers')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${viewMode === 'customers' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}>
                <Users size={16}/> Customers
             </button>
          </div>
      </div>

      {/* --- CONTROLS --- */}
      {viewMode !== 'customers' && (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative">
                <select value={quickFilter} onChange={handleQuickFilter} className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg block w-40 p-2.5 pr-8">
                    <option value="7days">Past 7 days</option>
                    <option value="30days">Past 30 days</option>
                    <option value="90days">Past 90 days</option>
                    <option value="ytd">Year to Date</option>
                </select>
                <Filter className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={14} />
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg p-1.5 px-3">
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent border-none text-sm outline-none w-28 text-gray-600"/>
                <span className="text-gray-400">→</span>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent border-none text-sm outline-none w-28 text-gray-600"/>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
                <Save size={16} /> Save PDF
            </button>
        </div>
      </div>
      )}
      
      {/* Customer Mode "Save" button wrapper (since controls are hidden) */}
      {viewMode === 'customers' && (
         <div className="flex justify-end">
             <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Save size={16} /> Save Directory
             </button>
         </div>
      )}

      {/* --- CHART PANEL --- */}
      {viewMode !== 'customers' && chartType !== 'None' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">Visual Analysis</h3>
                <button onClick={() => setChartType('None')} className="text-sm text-gray-400 hover:text-gray-600">Hide Chart</button>
            </div>
            <SimpleChart data={chartData} type={chartType} />
        </div>
      )}

      {/* --- DATA TABLES --- */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${viewMode === 'financials' ? 'bg-green-50/50' : viewMode === 'customers' ? 'bg-purple-50/50' : 'bg-gray-50/50'}`}>
            <div className="flex items-center gap-3">
                <h2 className="font-bold text-gray-700 flex items-center gap-2">
                    {viewMode === 'operations' && <><FileText size={18}/> Ticket Data</>}
                    {viewMode === 'financials' && <><DollarSign size={18}/> Financial Ledger</>}
                    {viewMode === 'customers' && <><Users size={18}/> Customer Directory</>}
                </h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${viewMode === 'customers' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {viewMode === 'operations' ? filteredData.tickets.length : viewMode === 'financials' ? filteredData.ledger.length : processedCustomers.length} Records
                </span>
            </div>
            
            {viewMode !== 'customers' ? (
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400 font-medium hidden sm:block">Chart:</span>
                    <div className="flex items-center bg-gray-200/50 rounded-lg p-1 gap-1">
                        {['None', 'Bar', 'Line', 'Pie'].map((type) => (
                            <button key={type} onClick={() => setChartType(type as any)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${chartType === type ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{type}</button>
                        ))}
                    </div>
                </div>
            ) : (
                !selectedCustomerId && (
                <div className="relative w-64">
                    <input type="text" placeholder="Search name or email..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"/>
                    <Search className="absolute left-3 top-2 text-gray-400" size={14}/>
                </div>
                )
            )}
        </div>

        {/* --- OPERATIONS VIEW --- */}
        {viewMode === 'operations' && (
            <div className="overflow-x-auto relative max-h-[600px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold sticky top-0 z-20">
                        <tr>
                            <th className="px-6 py-3 sticky left-0 bg-gray-100 z-30">Ticket ID</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Total Paid</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.tickets.map((row) => (
                            <tr key={row.id} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="px-6 py-3 font-medium text-blue-600 sticky left-0 bg-white group-hover:bg-blue-50/50 z-10 border-r border-transparent group-hover:border-blue-100">#{row.ticket_number}</td>
                                <td className="px-6 py-3 text-gray-700">{data?.customers.find(c => c.id === row.customer_id)?.first_name || 'Walk-in'}</td>
                                <td className="px-6 py-3 text-gray-500">{formatDate(row.created_at)}</td>
                                <td className="px-6 py-3"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] uppercase font-bold">{row.status.replace(/_/g, ' ')}</span></td>
                                <td className="px-6 py-3 text-right font-bold text-gray-900">{formatCurrency(row.paid_amount || 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* --- FINANCIALS VIEW --- */}
        {viewMode === 'financials' && (
            <div className="overflow-x-auto relative max-h-[600px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold sticky top-0 z-20">
                        <tr>
                            <th className="px-6 py-3 sticky left-0 bg-gray-100 z-30">ID</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Reference</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.ledger.map((row) => (
                            <tr key={row.id} className="hover:bg-green-50/50 transition-colors group">
                                <td className="px-6 py-3 font-medium text-gray-600 sticky left-0 bg-white group-hover:bg-green-50/50 z-10 border-r border-transparent group-hover:border-green-100">{row.id}</td>
                                <td className="px-6 py-3 text-gray-500">{formatDate(row.date)}</td>
                                <td className="px-6 py-3 text-gray-700 font-medium">{row.reference}</td>
                                <td className="px-6 py-3 text-gray-600">{row.customer_name}</td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${row.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {row.type}
                                    </span>
                                </td>
                                <td className={`px-6 py-3 text-right font-bold ${row.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {row.amount > 0 ? '+' : ''}{formatCurrency(row.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-200 sticky bottom-0 z-20">
                        <tr>
                            <td className="px-6 py-4 sticky left-0 bg-gray-50 z-30">Net Total</td>
                            <td colSpan={4}></td>
                            <td className={`px-6 py-4 text-right text-lg ${totals.lTotal >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                {formatCurrency(totals.lTotal)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        )}

        {/* --- CUSTOMERS VIEW --- */}
        {viewMode === 'customers' && (
            <>
            {!selectedCustomerId ? (
                <div className="overflow-x-auto relative max-h-[600px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold sticky top-0 z-20">
                            <tr>
                                <th className="px-6 py-3">Customer Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3 text-center">Visits</th>
                                <th className="px-6 py-3 text-right">Lifetime Spend</th>
                                <th className="px-6 py-3">Last Visit</th>
                                <th className="px-6 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {processedCustomers.map((c) => (
                                <tr key={c.id} className="hover:bg-purple-50/50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-900">{c.first_name} {c.last_name}</td>
                                    <td className="px-6 py-3 text-gray-500">{c.email}</td>
                                    <td className="px-6 py-3 text-center"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{c.stats.count}</span></td>
                                    <td className="px-6 py-3 text-right font-medium text-green-700">{formatCurrency(c.stats.spend)}</td>
                                    <td className="px-6 py-3 text-gray-500 text-xs">{c.stats.lastVisit ? formatDate(c.stats.lastVisit) : 'Never'}</td>
                                    <td className="px-6 py-3 text-center">
                                        <button onClick={() => setSelectedCustomerId(c.id)} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center justify-center gap-1 mx-auto">
                                            <History size={14} /> View History
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-gray-50 min-h-[400px]">
                    <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-4">
                        <button onClick={() => setSelectedCustomerId(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft size={20} /></button>
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">{data?.customers.find(c => c.id === selectedCustomerId)?.first_name} {data?.customers.find(c => c.id === selectedCustomerId)?.last_name}</h3>
                            <p className="text-xs text-gray-500">Full Ticket History</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
                                <tr><th className="px-6 py-3">Ticket ID</th><th className="px-6 py-3">Created</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Amount</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {selectedCustomerTickets.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-blue-600">#{t.ticket_number}</td>
                                        <td className="px-6 py-3 text-gray-500">{formatDate(t.created_at)}</td>
                                        <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${t.status === 'picked_up' ? 'bg-green-100 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{t.status.replace(/_/g, ' ')}</span></td>
                                        <td className="px-6 py-3 text-right font-bold text-gray-900">{formatCurrency(t.paid_amount || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            </>
        )}

      </div>
    </div>
  );
}  