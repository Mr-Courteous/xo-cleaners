import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Loader2, Save, Filter, FileText, DollarSign, Users, Search,
    ArrowLeft, History, ChevronLeft, ChevronRight
} from 'lucide-react';
import baseURL from '../lib/config';

// --- Types ---
interface LedgerRow {
    id: string; date: string; reference: string;
    customer_name: string; type: string; amount: number; method: string;
}
interface TicketRow {
    id: number; ticket_number: string; customer_id: number; customer_name: string;
    status: string; transfer_status?: string | null; transferred_to_name?: string | null;
    rack_number?: string | null; is_refunded: boolean;
    total_amount: number; paid_amount: number;
    created_at: string; transfer_timestamp?: string | null;
}
interface DashboardTotals {
    gross_sales: number; revenue: number; refunds: number;
    net_revenue: number; outstanding: number; avg_ticket: number; ticket_count: number;
}
interface DashboardResponse {
    totals: DashboardTotals;
    rows: (LedgerRow | TicketRow)[];
    page: number; page_size: number; total_count: number; total_pages: number;
}
interface CustomerWithStats {
    id: number; first_name: string; last_name: string; email: string;
    joined_at: string | null; visit_count: number; lifetime_spend: number; last_visit: string | null;
}
interface PaginatedCustomersResponse {
    rows: CustomerWithStats[]; page: number; page_size: number;
    total_count: number; total_pages: number;
}
interface CheckoutTicket {
    id: number; ticket_number: string; status: string; created_at: string;
    total_amount: number; paid_amount: number; remaining_balance: number; is_fully_paid: boolean;
}
interface CheckoutProfile {
    customer_id: number; customer_name: string; customer_email: string;
    total_debt: number; total_credit: number; net_balance: number;
    tickets: CheckoutTicket[];
}
interface ChartPoint { label: string; value: number; color?: string; }
interface ChartsResponse {
    revenue_by_status: ChartPoint[];
    top_items: ChartPoint[];
    daily_revenue: ChartPoint[];
    customer_growth: ChartPoint[];
}

// --- Helpers ---
const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } });
const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

// --- CHART COMPONENT ---
const SimpleChart = ({ data, type }: { data: { label: string; value: number }[], type: 'Bar' | 'Pie' | 'Line' }) => {
    const max = Math.max(...data.map(d => Math.abs(d.value)), 1);
    const total = data.reduce((acc, cur) => acc + Math.abs(cur.value), 0) || 1;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (data.length === 0) {
        return <div className="flex items-center justify-center h-64 text-sm text-gray-400">No data for this view</div>;
    }

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
                        return <circle key={i} cx="50" cy="50" r="25" fill="transparent" stroke={colors[i % 5]} strokeWidth="20" strokeDasharray={dash} strokeDashoffset={offset} />;
                    })}
                </svg>
                <div className="space-y-1 text-xs">
                    {data.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % 5] }}></span>
                            <span>{d.label}</span>
                            <span className="font-bold">{formatCurrency(d.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-end justify-between h-64 gap-2 pt-10 pb-2 w-full overflow-x-auto">
            {data.map((d, i) => (
                <div key={i} className="flex-1 min-w-[30px] flex flex-col items-center group relative h-full justify-end">
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

// --- PAGINATION CONTROLS ---
const PaginationBar = ({ page, totalPages, totalCount, onPageChange }: {
    page: number; totalPages: number; totalCount: number; onPageChange: (p: number) => void;
}) => {
    if (totalPages <= 1) return (
        <div className="px-6 py-3 text-xs text-gray-400 border-t border-gray-100">{totalCount} record{totalCount !== 1 ? 's' : ''}</div>
    );
    return (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-sm">
            <span className="text-xs text-gray-400">
                Page {page} of {totalPages} &middot; {totalCount} total records
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-medium disabled:opacity-40 hover:bg-gray-50"
                >
                    <ChevronLeft size={14} /> Prev
                </button>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-medium disabled:opacity-40 hover:bg-gray-50"
                >
                    Next <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default function DashboardAnalytics() {
    const [loading, setLoading] = useState(true);
    const [chartsLoading, setChartsLoading] = useState(false);

    // View State
    const [viewMode, setViewMode] = useState<'operations' | 'financials' | 'customers'>('financials');

    // Date / quick filter
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [quickFilter, setQuickFilter] = useState('30days');
    const [chartType, setChartType] = useState<'None' | 'Bar' | 'Line' | 'Pie'>('None');

    // Dashboard (financials/operations) state
    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 25;

    // Charts
    const [charts, setCharts] = useState<ChartsResponse | null>(null);

    // Customers state
    const [customers, setCustomers] = useState<PaginatedCustomersResponse | null>(null);
    const [customerPage, setCustomerPage] = useState(1);
    const [customerSearch, setCustomerSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const CUSTOMER_PAGE_SIZE = 25;

    // Selected customer (history) state
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [checkoutProfile, setCheckoutProfile] = useState<CheckoutProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const [pdfLoading, setPdfLoading] = useState(false);

    // --- Init default date range (last 30 days) ---
    useEffect(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
    }, []);

    // --- Reset page when view/date/filters change ---
    useEffect(() => {
        setPage(1);
    }, [viewMode, dateRange]);

    // --- Debounce customer search ---
    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedSearch(customerSearch);
            setCustomerPage(1);
        }, 350);
        return () => clearTimeout(handle);
    }, [customerSearch]);

    // --- Fetch dashboard (financials/operations) ---
    const fetchDashboard = useCallback(async () => {
        if (!dateRange.start || !dateRange.end) return;
        if (viewMode === 'customers') return;
        setLoading(true);
        try {
            const res = await axios.get<DashboardResponse>(
                `${baseURL}/api/organizations/analytics/dashboard`,
                {
                    ...getAuthHeaders(),
                    params: {
                        start_date: dateRange.start,
                        end_date: dateRange.end,
                        view: viewMode,
                        page,
                        page_size: PAGE_SIZE,
                    }
                }
            );
            setDashboard(res.data);
        } catch (err) {
            console.error('Error fetching dashboard analytics:', err);
        } finally {
            setLoading(false);
        }
    }, [dateRange, viewMode, page]);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    // --- Fetch charts (financials only) ---
    useEffect(() => {
        if (!dateRange.start || !dateRange.end || viewMode !== 'financials') return;
        if (chartType === 'None') { setCharts(null); return; }
        const fetchCharts = async () => {
            setChartsLoading(true);
            try {
                const res = await axios.get<ChartsResponse>(
                    `${baseURL}/api/organizations/analytics/charts`,
                    { ...getAuthHeaders(), params: { start_date: dateRange.start, end_date: dateRange.end } }
                );
                setCharts(res.data);
            } catch (err) {
                console.error('Error fetching charts:', err);
            } finally {
                setChartsLoading(false);
            }
        };
        fetchCharts();
    }, [dateRange, viewMode, chartType]);

    // --- Fetch customers ---
    const fetchCustomers = useCallback(async () => {
        if (viewMode !== 'customers' || selectedCustomerId) return;
        setLoading(true);
        try {
            const res = await axios.get<PaginatedCustomersResponse>(
                `${baseURL}/api/organizations/analytics/customers`,
                {
                    ...getAuthHeaders(),
                    params: {
                        search: debouncedSearch || undefined,
                        page: customerPage,
                        page_size: CUSTOMER_PAGE_SIZE,
                        sort: 'spend',
                    }
                }
            );
            setCustomers(res.data);
        } catch (err) {
            console.error('Error fetching customers:', err);
        } finally {
            setLoading(false);
        }
    }, [viewMode, debouncedSearch, customerPage, selectedCustomerId]);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    // --- Fetch selected customer's full ticket history ---
    useEffect(() => {
        if (!selectedCustomerId) { setCheckoutProfile(null); return; }
        const fetchProfile = async () => {
            setProfileLoading(true);
            try {
                const res = await axios.get<CheckoutProfile>(
                    `${baseURL}/api/organizations/customers/${selectedCustomerId}/checkout-profile`,
                    getAuthHeaders()
                );
                setCheckoutProfile(res.data);
            } catch (err) {
                console.error('Error fetching customer profile:', err);
            } finally {
                setProfileLoading(false);
            }
        };
        fetchProfile();
    }, [selectedCustomerId]);

    // --- Chart data (Bar/Line built from current page rows; Pie from totals) ---
    const chartData = useMemo(() => {
        if (chartType === 'None' || !dashboard || !Array.isArray(dashboard.rows)) return [];
        if (chartType === 'Pie') {
            return [
                { label: 'Collected', value: dashboard.totals.revenue },
                { label: 'Refunds', value: dashboard.totals.refunds },
                { label: 'Outstanding', value: dashboard.totals.outstanding },
            ];
        }
        if (viewMode === 'operations') {
            const map = new Map<string, number>();
            (dashboard.rows as TicketRow[]).forEach(t => {
                const d = formatDate(t.created_at);
                map.set(d, (map.get(d) || 0) + 1);
            });
            return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
        }
        const map = new Map<string, number>();
        (dashboard.rows as LedgerRow[]).forEach(l => {
            const d = formatDate(l.date);
            map.set(d, (map.get(d) || 0) + l.amount);
        });
        return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
    }, [dashboard, chartType, viewMode]);

    // --- PDF GENERATION ---
    // Pulls a large page from the backend on demand so the export covers the whole period.
    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            const doc = new jsPDF();
            const title = viewMode === 'operations' ? 'Operations Report' : viewMode === 'financials' ? 'Financial Ledger' : 'Customer Directory';

            doc.setFontSize(20);
            doc.setTextColor(40);
            doc.text(title, 14, 22);

            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

            let head: any[] = [];
            let body: any[] = [];
            let startY = 55;

            if (viewMode !== 'customers') {
                doc.text(`Period: ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}`, 14, 36);

                // Fetch full dataset for the period (large page size)
                const res = await axios.get<DashboardResponse>(
                    `${baseURL}/api/organizations/analytics/dashboard`,
                    {
                        ...getAuthHeaders(),
                        params: {
                            start_date: dateRange.start,
                            end_date: dateRange.end,
                            view: viewMode,
                            page: 1,
                            page_size: 5000,
                        }
                    }
                );
                const full = res.data;

                doc.text(`Total Records: ${full.total_count}`, 14, 42);
                doc.setFontSize(12);
                doc.setTextColor(0);
                const totalText = viewMode === 'operations'
                    ? `Total Volume: ${full.total_count} tickets`
                    : `Net Revenue: ${formatCurrency(full.totals.net_revenue)}`;
                doc.text(totalText, 14, 50);

                if (viewMode === 'operations') {
                    head = [['Ticket ID', 'Customer', 'Date', 'Status', 'Paid Amount']];
                    body = (full.rows as TicketRow[]).map(row => [
                        row.ticket_number,
                        row.customer_name,
                        formatDate(row.created_at),
                        row.status.replace(/_/g, ' '),
                        formatCurrency(row.paid_amount)
                    ]);
                } else {
                    head = [['Date', 'Ref', 'Customer', 'Type', 'Amount']];
                    body = (full.rows as LedgerRow[]).map(row => [
                        formatDate(row.date),
                        row.reference,
                        row.customer_name,
                        row.type,
                        formatCurrency(row.amount)
                    ]);
                }
            } else {
                // Customers: fetch full directory
                const res = await axios.get<PaginatedCustomersResponse>(
                    `${baseURL}/api/organizations/analytics/customers`,
                    { ...getAuthHeaders(), params: { page: 1, page_size: 5000, sort: 'spend' } }
                );
                head = [['Name', 'Email', 'Visits', 'Total Spend', 'Last Visit']];
                body = res.data.rows.map(c => [
                    `${c.first_name} ${c.last_name}`,
                    c.email,
                    c.visit_count,
                    formatCurrency(c.lifetime_spend),
                    c.last_visit ? formatDate(c.last_visit) : 'Never'
                ]);
                startY = 35;
            }

            autoTable(doc, {
                head,
                body,
                startY,
                theme: 'grid',
                headStyles: { fillColor: [66, 139, 202] },
            });

            doc.save(`${title.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
        } finally {
            setPdfLoading(false);
        }
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
        if (val === 'all') start.setFullYear(2000, 0, 1);
        setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
    };

    const totals = dashboard?.totals;

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
                    <button onClick={() => setViewMode('financials')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${viewMode === 'financials' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>
                        <DollarSign size={16} /> Financials
                    </button>
                    <button onClick={() => setViewMode('operations')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${viewMode === 'operations' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                        <FileText size={16} /> Operations
                    </button>
                    <button onClick={() => { setViewMode('customers'); setSelectedCustomerId(null); }} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${viewMode === 'customers' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}>
                        <Users size={16} /> Customers
                    </button>
                </div>
            </div>

            {/* Summary Tiles */}
            {viewMode !== 'customers' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white p-4 rounded-lg border shadow-sm border-green-100">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total Collected</div>
                        <div className="text-xl font-black text-green-700">{formatCurrency(totals?.revenue || 0)}</div>
                        <div className="text-[10px] text-green-600/70 mt-1">Gross cash income</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm border-red-100">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Refunds Issued</div>
                        <div className="text-xl font-black text-red-600">{formatCurrency(totals?.refunds || 0)}</div>
                        <div className="text-[10px] text-red-500/70 mt-1">Amount returned to customers</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm bg-gray-50/50">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Net Revenue</div>
                        <div className="text-xl font-black text-gray-900">{formatCurrency(totals?.net_revenue || 0)}</div>
                        <div className="text-[10px] text-gray-500 mt-1">Final period balance</div>
                    </div>
                </div>
            )}

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
                                <option value="all">All time</option>
                            </select>
                            <Filter className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={14} />
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg p-1.5 px-3">
                            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="bg-transparent border-none text-sm outline-none w-28 text-gray-600" />
                            <span className="text-gray-400">→</span>
                            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="bg-transparent border-none text-sm outline-none w-28 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={pdfLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save PDF
                        </button>
                    </div>
                </div>
            )}

            {viewMode === 'customers' && !selectedCustomerId && (
                <div className="flex justify-end">
                    <button onClick={handleDownloadPDF} disabled={pdfLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                        {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Directory
                    </button>
                </div>
            )}

            {/* --- CHART PANEL (financials/operations) --- */}
            {viewMode !== 'customers' && chartType !== 'None' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            Visual Analysis
                            {chartType !== 'Pie' && <span className="text-xs font-normal text-gray-400">(current page)</span>}
                        </h3>
                        <button onClick={() => setChartType('None')} className="text-sm text-gray-400 hover:text-gray-600">Hide Chart</button>
                    </div>
                    {chartsLoading && chartType === 'Pie' ? (
                        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-gray-300" /></div>
                    ) : (
                        <SimpleChart data={chartData} type={chartType} />
                    )}
                </div>
            )}


            {/* --- DATA TABLES --- */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${viewMode === 'financials' ? 'bg-green-50/50' : viewMode === 'customers' ? 'bg-purple-50/50' : 'bg-gray-50/50'}`}>
                    <div className="flex items-center gap-3">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            {viewMode === 'operations' && <><FileText size={18} /> Ticket Data</>}
                            {viewMode === 'financials' && <><DollarSign size={18} /> Financial Ledger</>}
                            {viewMode === 'customers' && <><Users size={18} /> Customer Directory</>}
                        </h2>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${viewMode === 'customers' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {viewMode === 'customers' ? (customers?.total_count ?? 0) : (dashboard?.total_count ?? 0)} Records
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
                                <input type="text" placeholder="Search name or email..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                                <Search className="absolute left-3 top-2 text-gray-400" size={14} />
                            </div>
                        )
                    )}
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex justify-center p-16"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
                )}

                {/* --- OPERATIONS VIEW --- */}
                {!loading && viewMode === 'operations' && dashboard && (
                    <>
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
                                    {(dashboard.rows as TicketRow[]).map((row) => (
                                        <tr key={row.id} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="px-6 py-3 font-medium text-blue-600 sticky left-0 bg-white group-hover:bg-blue-50/50 z-10 border-r border-transparent group-hover:border-blue-100">#{row.ticket_number}</td>
                                            <td className="px-6 py-3 text-gray-700">{row.customer_name}</td>
                                            <td className="px-6 py-3 text-gray-500">{formatDate(row.created_at)}</td>
                                            <td className="px-6 py-3"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] uppercase font-bold">{row.status.replace(/_/g, ' ')}</span></td>
                                            <td className="px-6 py-3 text-right font-bold text-gray-900">{formatCurrency(row.paid_amount || 0)}</td>
                                        </tr>
                                    ))}
                                    {dashboard.rows.length === 0 && (
                                        <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No tickets in this period</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationBar page={dashboard.page} totalPages={dashboard.total_pages} totalCount={dashboard.total_count} onPageChange={setPage} />
                    </>
                )}

                {/* --- FINANCIALS VIEW --- */}
                {!loading && viewMode === 'financials' && dashboard && (
                    <>
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
                                    {(dashboard.rows as LedgerRow[]).map((row) => (
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
                                    {dashboard.rows.length === 0 && (
                                        <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No ledger entries in this period</td></tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-200 sticky bottom-0 z-20">
                                    <tr>
                                        <td className="px-6 py-4 sticky left-0 bg-gray-50 z-30">Cash Summary</td>
                                        <td colSpan={2} className="text-xs text-gray-500 font-normal">Across {dashboard.totals.ticket_count} tickets in period</td>
                                        <td className="px-6 py-4 text-right text-sm text-green-600">
                                            Collected: {formatCurrency(dashboard.totals.revenue)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-red-600">
                                            Refunds: {formatCurrency(dashboard.totals.refunds)}
                                        </td>
                                        <td className={`px-6 py-4 text-right text-lg ${dashboard.totals.net_revenue >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                            Net: {formatCurrency(dashboard.totals.net_revenue)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <PaginationBar page={dashboard.page} totalPages={dashboard.total_pages} totalCount={dashboard.total_count} onPageChange={setPage} />
                    </>
                )}

                {/* --- CUSTOMERS VIEW --- */}
                {viewMode === 'customers' && (
                    <>
                        {!selectedCustomerId ? (
                            <>
                                {!loading && customers && (
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
                                                {customers.rows.map((c) => (
                                                    <tr key={c.id} className="hover:bg-purple-50/50 transition-colors">
                                                        <td className="px-6 py-3 font-medium text-gray-900">{c.first_name} {c.last_name}</td>
                                                        <td className="px-6 py-3 text-gray-500">{c.email}</td>
                                                        <td className="px-6 py-3 text-center"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{c.visit_count}</span></td>
                                                        <td className="px-6 py-3 text-right font-medium text-green-700">{formatCurrency(c.lifetime_spend)}</td>
                                                        <td className="px-6 py-3 text-gray-500 text-xs">{c.last_visit ? formatDate(c.last_visit) : 'Never'}</td>
                                                        <td className="px-6 py-3 text-center">
                                                            <button onClick={() => setSelectedCustomerId(c.id)} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center justify-center gap-1 mx-auto">
                                                                <History size={14} /> View History
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {customers.rows.length === 0 && (
                                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No customers found</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {loading && <div className="flex justify-center p-16"><Loader2 className="animate-spin text-gray-400" size={28} /></div>}
                                {customers && (
                                    <PaginationBar page={customers.page} totalPages={customers.total_pages} totalCount={customers.total_count} onPageChange={setCustomerPage} />
                                )}
                            </>
                        ) : (
                            <div className="bg-gray-50 min-h-[400px]">
                                <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-4">
                                    <button onClick={() => setSelectedCustomerId(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft size={20} /></button>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{checkoutProfile?.customer_name || '...'}</h3>
                                        <p className="text-xs text-gray-500">{checkoutProfile?.customer_email}</p>
                                    </div>
                                    {checkoutProfile && (
                                        <div className="ml-auto flex gap-4 text-xs">
                                            {checkoutProfile.total_debt > 0 && (
                                                <div className="text-right">
                                                    <div className="text-gray-400 uppercase font-bold tracking-wide">Owes</div>
                                                    <div className="text-red-600 font-bold">{formatCurrency(checkoutProfile.total_debt)}</div>
                                                </div>
                                            )}
                                            {checkoutProfile.total_credit > 0 && (
                                                <div className="text-right">
                                                    <div className="text-gray-400 uppercase font-bold tracking-wide">Credit</div>
                                                    <div className="text-green-600 font-bold">{formatCurrency(checkoutProfile.total_credit)}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {profileLoading ? (
                                    <div className="flex justify-center p-16"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
                                                <tr><th className="px-6 py-3">Ticket ID</th><th className="px-6 py-3">Created</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Paid</th><th className="px-6 py-3 text-right">Balance</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {(checkoutProfile?.tickets || []).map(t => (
                                                    <tr key={t.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-3 font-medium text-blue-600">#{t.ticket_number}</td>
                                                        <td className="px-6 py-3 text-gray-500">{formatDate(t.created_at)}</td>
                                                        <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${t.status === 'picked_up' ? 'bg-green-100 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{t.status.replace(/_/g, ' ')}</span></td>
                                                        <td className="px-6 py-3 text-right font-bold text-gray-900">{formatCurrency(t.paid_amount || 0)}</td>
                                                        <td className={`px-6 py-3 text-right font-bold ${t.remaining_balance > 0.01 ? 'text-red-600' : t.remaining_balance < -0.01 ? 'text-green-600' : 'text-gray-400'}`}>
                                                            {formatCurrency(t.remaining_balance)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!checkoutProfile || checkoutProfile.tickets.length === 0) && (
                                                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No tickets for this customer</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}