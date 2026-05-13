import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
    LayoutDashboard, 
    Package, 
    Clock, 
    RefreshCw, 
    FileText, 
    Users, 
    Search, 
    Plus, 
    Trash2, 
    CheckCircle, 
    AlertCircle, 
    X, 
    ChevronRight, 
    MapPin, 
    DollarSign,
    Loader2,
    Activity,
    UserPlus,
    CreditCard
} from 'lucide-react';
import baseURL from '../lib/config';

interface Store {
    id: number;
    name: string;
    org_type: string;
}

interface PlatformAdminStoreProxyProps {
    store: Store;
    onExit: () => void;
}

export default function PlatformAdminStoreProxy({ store, onExit }: PlatformAdminStoreProxyProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'dropoff' | 'pickup' | 'racks' | 'tickets' | 'customers'>('overview');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const getHeaders = () => {
        const token = localStorage.getItem('platformAdminToken');
        return { Authorization: `Bearer ${token}` };
    };

    const getProxyUrl = (resource: string) => {
        const separator = resource.includes('?') ? '&' : '?';
        return `${baseURL}/platform-admin/proxy/${resource}${separator}target_org_id=${store.id}`;
    };

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3000);
    };

    // ==========================================
    // 1. OVERVIEW TAB
    // ==========================================
    const OverviewTab = () => {
        const [stats, setStats] = useState({
            total_tickets: 0,
            active_tickets: 0,
            ready_pickup: 0,
            in_process: 0,
            occupied_racks: 0,
            available_racks: 0
        });

        const fetchStats = useCallback(async () => {
            setLoading(true);
            try {
                const [ticketsRes, racksRes] = await Promise.all([
                    axios.get(getProxyUrl('tickets'), { headers: getHeaders() }),
                    axios.get(getProxyUrl('racks'), { headers: getHeaders() })
                ]);

                const tickets = ticketsRes.data || [];
                const racksArray = racksRes.data?.racks || [];

                setStats({
                    total_tickets: tickets.length,
                    active_tickets: tickets.filter((t: any) => !['picked_up', 'cancelled', 'refunded'].includes(t.status)).length,
                    ready_pickup: tickets.filter((t: any) => t.status === 'ready_for_pickup').length,
                    in_process: tickets.filter((t: any) => !['picked_up', 'cancelled', 'refunded', 'ready_for_pickup'].includes(t.status)).length,
                    occupied_racks: racksArray.filter((r: any) => r.is_occupied).length,
                    available_racks: racksArray.filter((r: any) => !r.is_occupied).length
                });
            } catch (err: any) {
                setError("Failed to fetch overview stats");
            } finally {
                setLoading(false);
            }
        }, []);

        useEffect(() => { fetchStats(); }, [fetchStats]);

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Store Overview</h2>
                    <button onClick={fetchStats} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {[
                        { label: 'Total Tickets', value: stats.total_tickets, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                        { label: 'Active Tickets', value: stats.active_tickets, icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                        { label: 'Ready for Pickup', value: stats.ready_pickup, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                        { label: 'In Process', value: stats.in_process, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                        { label: 'Occupied Racks', value: stats.occupied_racks, icon: MapPin, color: 'text-rose-400', bg: 'bg-rose-400/10' },
                        { label: 'Available Racks', value: stats.available_racks, icon: MapPin, color: 'text-slate-400', bg: 'bg-slate-400/10' },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
                            <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                                <stat.icon size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-black">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // ==========================================
    // 2. DROP OFF TAB
    // ==========================================
    const DropOffTab = () => {
        const [customers, setCustomers] = useState<any[]>([]);
        const [clothingTypes, setClothingTypes] = useState<any[]>([]);
        const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
        const [selectedItems, setSelectedItems] = useState<{ id: number, name: string, quantity: number }[]>([]);
        const [paidAmount, setPaidAmount] = useState<number>(0);
        const [searchCustomer, setSearchCustomer] = useState("");
        const [submitting, setSubmitting] = useState(false);

        const fetchData = useCallback(async () => {
            try {
                const [custRes, clothRes] = await Promise.all([
                    axios.get(getProxyUrl('customers'), { headers: getHeaders() }),
                    axios.get(getProxyUrl('clothing-types'), { headers: getHeaders() })
                ]);
                setCustomers(custRes.data || []);
                // Flatten the grouped object
                const flat = Object.values(clothRes.data).flat();
                setClothingTypes(flat);
            } catch (err) {
                setError("Failed to fetch drop-off data");
            }
        }, []);

        useEffect(() => { fetchData(); }, [fetchData]);

        const addItem = (type: any) => {
            setSelectedItems(prev => {
                const existing = prev.find(i => i.id === type.id);
                if (existing) {
                    return prev.map(i => i.id === type.id ? { ...i, quantity: i.quantity + 1 } : i);
                }
                return [...prev, { id: type.id, name: type.name, quantity: 1 }];
            });
        };

        const removeItem = (id: number) => {
            setSelectedItems(prev => prev.filter(i => i.id !== id));
        };

        const handleSubmit = async () => {
            if (!selectedCustomer) { setError("Please select a customer"); return; }
            if (selectedItems.length === 0) { setError("Please add at least one item"); return; }

            setSubmitting(true);
            try {
                const res = await axios.post(getProxyUrl('tickets'), {
                    customer_id: selectedCustomer,
                    items: selectedItems.map(i => ({
                        clothing_type_id: i.id,
                        quantity: i.quantity,
                        starch_level: "none",
                        crease: false
                    })),
                    paid_amount: paidAmount,
                    rack_number: null,
                    special_instructions: null
                }, { headers: getHeaders() });

                showSuccess(`Ticket ${res.data.ticket_number} created!`);
                setSelectedItems([]);
                setSelectedCustomer(null);
                setPaidAmount(0);
            } catch (err) {
                setError("Failed to create ticket");
            } finally {
                setSubmitting(false);
            }
        };

        const filteredCustomers = customers.filter(c => 
            `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchCustomer.toLowerCase()) ||
            c.phone?.includes(searchCustomer)
        );

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
                        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                            <Users size={16} /> Select Customer
                        </h3>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text"
                                placeholder="Search by name or phone..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
                                value={searchCustomer}
                                onChange={(e) => setSearchCustomer(e.target.value)}
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                            {filteredCustomers.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => setSelectedCustomer(c.id)}
                                    className={`w-full text-left p-3 rounded-xl text-sm transition-all border ${selectedCustomer === c.id ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                                >
                                    <p className="font-bold">{c.first_name} {c.last_name}</p>
                                    <p className="text-xs opacity-60">{c.phone || c.email}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
                        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                            <Package size={16} /> Select Items
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {clothingTypes.map(type => (
                                <button 
                                    key={type.id}
                                    onClick={() => addItem(type)}
                                    className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-center hover:border-indigo-500 transition-all active:scale-95"
                                >
                                    <p className="text-xs font-bold truncate">{type.name}</p>
                                    <p className="text-[10px] text-indigo-400 mt-1">${type.total_price?.toFixed(2)}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col h-full">
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                        <FileText size={16} /> New Order Summary
                    </h3>
                    
                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] mb-6 pr-2 custom-scrollbar">
                        {selectedItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 opacity-50">
                                <Plus size={48} />
                                <p className="text-sm font-bold">Add items to get started</p>
                            </div>
                        ) : (
                            selectedItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-700">
                                    <div>
                                        <p className="font-bold text-sm">{item.name}</p>
                                        <p className="text-xs text-indigo-400">Qty: {item.quantity}</p>
                                    </div>
                                    <button onClick={() => removeItem(item.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-700 space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Initial Payment ($)</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-xl font-black text-emerald-400 focus:border-emerald-500 outline-none transition-all"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <button 
                            disabled={submitting || !selectedCustomer || selectedItems.length === 0}
                            onClick={handleSubmit}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-indigo-900/20"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Create Ticket</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ==========================================
    // 3. PICK UP TAB
    // ==========================================
    const PickUpTab = () => {
        const [ticketNumber, setTicketNumber] = useState("");
        const [ticketData, setTicketData] = useState<any>(null);
        const [checking, setChecking] = useState(false);
        const [amountPaid, setAmountPaid] = useState<number>(0);
        const [processing, setProcessing] = useState(false);

        const handleValidate = async () => {
            if (!ticketNumber) return;
            setChecking(true);
            setTicketData(null);
            try {
                const res = await axios.get(getProxyUrl(`tickets/validate/${ticketNumber}`), { headers: getHeaders() });
                setTicketData(res.data);
                setAmountPaid(res.data.balance_due || 0);
            } catch (err) {
                setError("Invalid ticket number");
            } finally {
                setChecking(false);
            }
        };

        const handlePickup = async () => {
            if (!ticketData) return;
            setProcessing(true);
            try {
                await axios.put(getProxyUrl(`tickets/${ticketData.ticket_id}/pickup`), {
                    amount_paid: amountPaid
                }, { headers: getHeaders() });
                showSuccess("Pickup successful!");
                setTicketData(null);
                setTicketNumber("");
            } catch (err) {
                setError("Pickup failed");
            } finally {
                setProcessing(false);
            }
        };

        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-8 flex items-center gap-2">
                        <Search size={16} /> Validate Ticket for Pickup
                    </h3>
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            placeholder="Enter Ticket # (e.g. TICK-123)"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 text-xl font-black uppercase focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                            value={ticketNumber}
                            onChange={(e) => setTicketNumber(e.target.value)}
                        />
                        <button 
                            onClick={handleValidate}
                            disabled={checking || !ticketNumber}
                            className="bg-indigo-600 hover:bg-indigo-500 px-8 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                        >
                            {checking ? <Loader2 className="animate-spin" /> : "Check"}
                        </button>
                    </div>
                </div>

                {ticketData && (
                    <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700/50 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Customer</p>
                                <p className="text-xl font-bold">{ticketData.customer_name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Current Status</p>
                                <span className="px-3 py-1 bg-emerald-400/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{ticketData.status || 'READY'}</span>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 mb-8">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Amount Due</p>
                                    <p className="text-4xl font-black text-amber-400">${ticketData.balance_due?.toFixed(2)}</p>
                                </div>
                                <div className="w-32">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Paying Now ($)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-lg font-black text-emerald-400 focus:border-emerald-500 outline-none transition-all"
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handlePickup}
                            disabled={processing}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-900/20"
                        >
                            {processing ? <Loader2 className="animate-spin" /> : <><CreditCard size={20} /> Process Pickup</>}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // ==========================================
    // 4. RACK ASSIGNMENT TAB
    // ==========================================
    const RacksTab = () => {
        const [tickets, setTickets] = useState<any[]>([]);
        const [racks, setRacks] = useState<any[]>([]);
        const [search, setSearch] = useState("");
        const [savingId, setSavingId] = useState<number | null>(null);

        const fetchData = useCallback(async () => {
            setLoading(true);
            try {
                const [ticketsRes, racksRes] = await Promise.all([
                    axios.get(getProxyUrl('tickets'), { headers: getHeaders() }),
                    axios.get(getProxyUrl('racks'), { headers: getHeaders() })
                ]);
                setTickets(ticketsRes.data || []);
                setRacks(racksRes.data?.racks || []);
            } catch (err) {
                setError("Failed to fetch racking data");
            } finally {
                setLoading(false);
            }
        }, []);

        useEffect(() => { fetchData(); }, [fetchData]);

        const handleSaveRack = async (ticketId: number, rack: string) => {
            setSavingId(ticketId);
            try {
                await axios.put(getProxyUrl(`tickets/${ticketId}/rack`), {
                    rack_number: parseInt(rack, 10)
                }, { headers: getHeaders() });
                showSuccess("Rack assigned");
                fetchData();
            } catch (err) {
                setError("Failed to assign rack");
            } finally {
                setSavingId(null);
            }
        };

        const filtered = tickets.filter(t => 
            t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
            t.customer_name.toLowerCase().includes(search.toLowerCase())
        ).filter(t => t.status !== 'picked_up');

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Rack Assignment</h2>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find ticket..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* RACK STATUS GRID */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                        <MapPin size={16} /> Rack Status Overview
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                        {racks.map(r => (
                            <div 
                                key={r.id} 
                                className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all ${r.is_occupied ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-900/10' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                                title={r.is_occupied ? `Ticket ID: ${r.ticket_id}` : 'Available'}
                            >
                                <span className="text-[10px] font-black">{r.number}</span>
                                {r.is_occupied && <Activity size={10} className="mt-1 animate-pulse" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ticket #</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Customer</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Current Rack</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filtered.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-700/20 transition-colors">
                                        <td className="px-6 py-4 font-black text-indigo-400">{t.ticket_number}</td>
                                        <td className="px-6 py-4 font-bold">{t.customer_name}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900 px-2 py-1 rounded border border-slate-700">{t.status}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="text" 
                                                defaultValue={t.rack_number || ""}
                                                id={`rack-${t.id}`}
                                                placeholder="Enter Rack"
                                                className="bg-slate-900 border border-slate-700 rounded-lg py-1 px-3 text-sm focus:border-indigo-500 outline-none w-24"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => {
                                                    const val = (document.getElementById(`rack-${t.id}`) as HTMLInputElement).value;
                                                    handleSaveRack(t.id, val);
                                                }}
                                                disabled={savingId === t.id}
                                                className="bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {savingId === t.id ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // ==========================================
    // 5. TICKETS TAB
    // ==========================================
    const TicketsTab = () => {
        const [tickets, setTickets] = useState<any[]>([]);
        const [search, setSearch] = useState("");
        const [selectedTicket, setSelectedTicket] = useState<any>(null);
        const [modalOpen, setModalOpen] = useState(false);
        const [detailLoading, setDetailLoading] = useState(false);

        const fetchTickets = useCallback(async () => {
            setLoading(true);
            try {
                const res = await axios.get(getProxyUrl('tickets'), { headers: getHeaders() });
                setTickets(res.data || []);
            } catch (err) {
                setError("Failed to fetch tickets");
            } finally {
                setLoading(false);
            }
        }, []);

        useEffect(() => { fetchTickets(); }, [fetchTickets]);

        const openDetail = async (id: number) => {
            setModalOpen(true);
            setDetailLoading(true);
            try {
                const res = await axios.get(getProxyUrl(`tickets/${id}`), { headers: getHeaders() });
                setSelectedTicket(res.data);
            } catch (err) {
                setError("Failed to fetch ticket details");
            } finally {
                setDetailLoading(false);
            }
        };

        const filtered = tickets.filter(t => 
            t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
            t.customer_name.toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Order Management</h2>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search orders..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ticket #</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Customer</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Paid</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Rack</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filtered.map(t => (
                                    <tr key={t.id} onClick={() => openDetail(t.id)} className="hover:bg-slate-700/20 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4 font-black text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-2">
                                            {t.ticket_number} <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </td>
                                        <td className="px-6 py-4 font-bold">{t.customer_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                                                t.status.includes('ready') ? 'bg-emerald-400/10 text-emerald-400' : 
                                                t.status === 'picked_up' ? 'bg-slate-400/10 text-slate-400' : 'bg-amber-400/10 text-amber-400'
                                            }`}>{t.status}</span>
                                        </td>
                                        <td className="px-6 py-4 font-bold">${t.total_amount?.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-emerald-400 font-bold">${t.paid_amount?.toFixed(2)}</td>
                                        <td className="px-6 py-4 font-bold text-slate-400">{t.rack_number || '-'}</td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {modalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setModalOpen(false)}></div>
                        <div className="relative bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Order Details</p>
                                    <h3 className="text-2xl font-black text-indigo-400">{selectedTicket?.ticket_number || 'Loading...'}</h3>
                                </div>
                                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-500">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {detailLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                        <Loader2 className="animate-spin text-indigo-400" size={40} />
                                        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Fetching Line Items...</p>
                                    </div>
                                ) : selectedTicket && (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Customer</p>
                                                <p className="font-bold">{selectedTicket.customer_name}</p>
                                                <p className="text-xs text-slate-400">{selectedTicket.customer_phone}</p>
                                            </div>
                                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Rack Location</p>
                                                <p className="font-black text-emerald-400">{selectedTicket.rack_number || 'NOT ASSIGNED'}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Order Contents</p>
                                            <div className="space-y-2">
                                                {selectedTicket.items?.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between items-center p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center text-xs font-black">{item.quantity}</div>
                                                            <p className="font-bold">{item.clothing_name}</p>
                                                        </div>
                                                        <p className="font-black text-sm">${item.item_total?.toFixed(2)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-700 shadow-inner">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Bill</p>
                                                <p className="text-xl font-black">${selectedTicket.total_amount?.toFixed(2)}</p>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Amount Paid</p>
                                                <p className="text-xl font-black text-emerald-400">${selectedTicket.paid_amount?.toFixed(2)}</p>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Balance Outstanding</p>
                                                <p className="text-3xl font-black text-amber-400">${(selectedTicket.total_amount - selectedTicket.paid_amount).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ==========================================
    // 6. CUSTOMERS TAB
    // ==========================================
    const CustomersTab = () => {
        const [customers, setCustomers] = useState<any[]>([]);
        const [search, setSearch] = useState("");
        const [showForm, setShowForm] = useState(false);
        const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', email: '', phone: '' });
        const [submitting, setSubmitting] = useState(false);

        const fetchCustomers = useCallback(async () => {
            setLoading(true);
            try {
                const res = await axios.get(getProxyUrl('customers'), { headers: getHeaders() });
                setCustomers(res.data || []);
            } catch (err) {
                setError("Failed to fetch customers");
            } finally {
                setLoading(false);
            }
        }, []);

        useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setSubmitting(true);
            try {
                // register-customers expects: { first_name, last_name, phone, email, address, password }
                await axios.post(getProxyUrl('register-customers'), {
                    first_name: newCustomer.first_name,
                    last_name: newCustomer.last_name,
                    phone: newCustomer.phone,
                    email: newCustomer.email || null,
                    address: "",
                    password: "Password123!"
                }, { headers: getHeaders() });
                showSuccess("Customer created!");
                setShowForm(false);
                setNewCustomer({ first_name: '', last_name: '', email: '', phone: '' });
                fetchCustomers();
            } catch (err) {
                setError("Failed to create customer");
            } finally {
                setSubmitting(false);
            }
        };

        const filtered = customers.filter(c => 
            `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search) ||
            c.email?.toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Customer Database</h2>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
                    >
                        {showForm ? <X size={16} /> : <><UserPlus size={16} /> New Customer</>}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
                        <input 
                            required 
                            placeholder="First Name" 
                            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none"
                            value={newCustomer.first_name}
                            onChange={e => setNewCustomer({...newCustomer, first_name: e.target.value})}
                        />
                        <input 
                            placeholder="Last Name" 
                            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none"
                            value={newCustomer.last_name}
                            onChange={e => setNewCustomer({...newCustomer, last_name: e.target.value})}
                        />
                        <input 
                            placeholder="Phone Number" 
                            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none"
                            value={newCustomer.phone}
                            onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                        />
                        <input 
                            placeholder="Email (Optional)" 
                            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none"
                            value={newCustomer.email}
                            onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                        />
                        <div className="lg:col-span-4 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="bg-emerald-600 hover:bg-emerald-500 px-8 py-2 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : "Register Customer"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by name, phone, or email..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(c => (
                            <div key={c.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 hover:border-slate-500 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center font-black">
                                        {c.first_name[0]}{c.last_name ? c.last_name[0] : ''}
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">ID: {c.id}</span>
                                </div>
                                <h4 className="mt-4 font-bold text-slate-200">{c.first_name} {c.last_name}</h4>
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs text-slate-500 flex items-center gap-2"><DollarSign size={12} /> {c.phone || 'No Phone'}</p>
                                    <p className="text-xs text-slate-500 flex items-center gap-2 truncate"><Users size={12} /> {c.email || 'No Email'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'dropoff': return <DropOffTab />;
            case 'pickup': return <PickUpTab />;
            case 'racks': return <RacksTab />;
            case 'tickets': return <TicketsTab />;
            case 'customers': return <CustomersTab />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col text-slate-300 font-sans">
            {/* TOP BANNER */}
            <div className="bg-slate-900 border-b border-slate-800 h-16 px-6 flex items-center justify-between shadow-2xl z-[110]">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-900/40">
                        <Activity size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 leading-none mb-1">Administrative Proxy</p>
                        <h1 className="text-sm font-bold text-white">Operating as: <span className="text-indigo-400">{store.name}</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={onExit}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/20 active:scale-95"
                    >
                        <X size={16} className="inline mr-2" /> Exit Session
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* SIDEBAR */}
                <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 space-y-2">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'dropoff', label: 'Drop Off', icon: Package },
                        { id: 'pickup', label: 'Pick Up', icon: Clock },
                        { id: 'racks', label: 'Rack Manager', icon: MapPin },
                        { id: 'tickets', label: 'Orders', icon: FileText },
                        { id: 'customers', label: 'Customers', icon: Users },
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                        >
                            <item.icon size={18} className="mr-3" />
                            {item.label}
                        </button>
                    ))}
                    
                    <div className="mt-auto p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Store Info</p>
                        <p className="text-xs font-bold text-slate-300 truncate">{store.name}</p>
                        <p className="text-[10px] text-slate-600 mt-1 uppercase font-black">{store.org_type.replace(/_/g, ' ')}</p>
                    </div>
                </aside>

                {/* CONTENT AREA */}
                <main className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
                    {/* FEEDBACK OVERLAYS */}
                    {error && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[150] bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <AlertCircle size={20} />
                            <p className="text-sm font-bold">{error}</p>
                            <button onClick={() => setError(null)} className="ml-4 hover:opacity-70"><X size={16} /></button>
                        </div>
                    )}
                    {success && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[150] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <CheckCircle size={20} />
                            <p className="text-sm font-bold">{success}</p>
                        </div>
                    )}

                    <div className="max-w-6xl mx-auto">
                        {renderTab()}
                    </div>
                </main>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
            `}</style>
        </div>
    );
}
