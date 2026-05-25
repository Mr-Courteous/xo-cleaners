import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    MapPin,
    DollarSign,
    Loader2,
    Activity,
    UserPlus,
    CreditCard,
    Shirt,
    PenTool,
    List,
    Grid,
    User,
    Calculator,
    ChevronRight,
} from 'lucide-react';
import baseURL from '../lib/config';
import PrintPreviewModal from './PrintPreviewModal';
import renderReceiptHtml from '../lib/receiptTemplate';
import renderPlantReceiptHtml from '../lib/plantReceiptTemplate';
import renderCustomerPlantReceiptHtml from '../lib/customerPlantReceiptTemplate';
import { generateTagHtml } from '../lib/tagTemplates';
import { handlePrintJob } from '../lib/printUtils';
import { getOrgAddress } from '../lib/getOrgAddress';

// ==========================================
// INTERFACES
// ==========================================
interface Store {
    id: number;
    name: string;
    org_type: string;
}

interface PlatformAdminStoreProxyProps {
    store: Store;
    onExit: () => void;
}

interface TabProps {
    store: Store;
    getHeaders: () => Record<string, string>;
    getProxyUrl: (resource: string) => string;
    setError: (err: string | null) => void;
    showSuccess: (msg: string) => void;
    openPrintPreview?: (detail: any) => Promise<void>;
}

// Shared item type for the DropOff flow
interface DropOffItem {
    id: number;            // clothing_type_id (-1 for custom)
    name: string;
    plant_price: number;
    margin: number;
    quantity: number;
    starch_level: string;  // 'no_starch' | 'light' | 'medium' | 'heavy' | 'extra_heavy'
    starch_charge: number;
    clothing_size: string; // 'none' | 's' | 'm' | 'l' | 'xl' | 'xxl'
    size_charge: number;
    crease: boolean;
    additional_charge: number;
    item_instructions: string;
    alteration_behavior: string; // 'none' | 'alteration_only'
    alteration_id: number | null;
    alteration_name: string | null;
    alteration_price: number;
    is_custom: boolean;
    item_total: number;
}

// ==========================================
// UPCHARGE SELECTOR  (mirrored from DropOff)
// ==========================================
const UpchargeSelector = ({
    currentCharge,
    onUpdate,
}: {
    currentCharge: number;
    onUpdate: (v: number) => void;
}) => {
    const handle = (amount: number) => {
        onUpdate(Math.round((currentCharge + amount) * 100) / 100);
    };
    return (
        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-sm">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Price Adj:{' '}
                    <span className={currentCharge >= 0 ? 'text-red-600' : 'text-green-600'}>
                        ${Math.abs(currentCharge).toFixed(2)}
                    </span>
                </span>
                {currentCharge !== 0 && (
                    <button
                        type="button"
                        onClick={() => onUpdate(0)}
                        className="text-[9px] text-gray-400 hover:text-red-600 underline"
                    >
                        Reset
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-1.5">
                <div className="flex gap-1 bg-green-50 p-1 rounded">
                    {[0.10, 0.50, 1.00, 5.00].map(inc => (
                        <button
                            key={`-${inc}`}
                            type="button"
                            onClick={() => handle(-inc)}
                            className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-white border border-green-200 text-green-700 hover:bg-green-100"
                        >
                            -${inc.toFixed(2)}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1 bg-red-50 p-1 rounded">
                    {[0.10, 0.50, 1.00, 5.00].map(inc => (
                        <button
                            key={`+${inc}`}
                            type="button"
                            onClick={() => handle(inc)}
                            className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-white border border-red-200 text-red-700 hover:bg-red-100"
                        >
                            +${inc.toFixed(2)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// CLOTHING GRID  (mirrored from DropOff)
// ==========================================
const ClothingGrid = ({
    clothingTypes,
    onAdd,
    onAddCustom,
}: {
    clothingTypes: any[];
    onAdd: (id: number) => void;
    onAddCustom: () => void;
}) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg">
        {clothingTypes.map(type => (
            <button
                key={type.id}
                onClick={() => onAdd(type.id)}
                className="flex flex-col items-center justify-start p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 h-24 font-semibold text-xs active:scale-[0.98]"
            >
                {type.image_url ? (
                    <img
                        src={type.image_url}
                        alt={type.name}
                        className="w-full h-5 object-contain rounded-lg mb-0.5"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-5 flex items-center justify-center bg-gray-100 rounded-lg mb-0.5">
                        <Shirt className="w-4 h-4 text-gray-500" />
                    </div>
                )}
                <span className="text-xs font-semibold text-center mt-0.5 line-clamp-2 w-full px-0.5 leading-tight">{type.name}</span>
                <span className="text-xs font-bold mt-auto text-blue-600">
                    ${(type.total_price || (type.plant_price + type.margin) || 0).toFixed(2)}
                </span>
            </button>
        ))}
        <button
            onClick={onAddCustom}
            className="flex flex-col items-center justify-center p-1.5 rounded-lg shadow-sm transition-all h-24 text-xs active:scale-[0.98] hover:shadow-md"
            style={{ backgroundColor: '#6366f110', border: '2px dashed #6366f133', color: '#6366f1' }}
        >
            <div className="w-8 h-8 flex items-center justify-center rounded-full mb-1" style={{ backgroundColor: '#6366f122' }}>
                <PenTool className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">Custom</span>
            <span className="text-[10px] mt-0.5">Add</span>
        </button>
    </div>
);

// ==========================================
// 1. OVERVIEW TAB
// ==========================================
const OverviewTab = ({ store, getHeaders, getProxyUrl, setError }: TabProps) => {
    const [stats, setStats] = useState({
        total_tickets: 0, active_tickets: 0, ready_pickup: 0,
        in_process: 0, occupied_racks: 0, available_racks: 0,
    });
    const [localLoading, setLocalLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        setLocalLoading(true);
        try {
            const [ticketsRes, racksRes] = await Promise.all([
                axios.get(getProxyUrl('tickets'), { headers: getHeaders() }),
                axios.get(getProxyUrl('racks'), { headers: getHeaders() }),
            ]);
            const tickets = ticketsRes.data || [];
            const racksArray = racksRes.data?.racks || [];
            setStats({
                total_tickets: tickets.length,
                active_tickets: tickets.filter((t: any) => !['picked_up', 'cancelled', 'refunded'].includes(t.status)).length,
                ready_pickup: tickets.filter((t: any) => t.status === 'ready_for_pickup').length,
                in_process: tickets.filter((t: any) => !['picked_up', 'cancelled', 'refunded', 'ready_for_pickup'].includes(t.status)).length,
                occupied_racks: racksArray.filter((r: any) => r.is_occupied).length,
                available_racks: racksArray.filter((r: any) => !r.is_occupied).length,
            });
        } catch {
            setError('Failed to fetch overview stats');
        } finally {
            setLocalLoading(false);
        }
    }, [getProxyUrl, getHeaders, setError]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const statCards = [
        { label: 'Total Tickets', value: stats.total_tickets, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Active Tickets', value: stats.active_tickets, icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
        { label: 'Ready for Pickup', value: stats.ready_pickup, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { label: 'In Process', value: stats.in_process, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { label: 'Occupied Racks', value: stats.occupied_racks, icon: MapPin, color: 'text-rose-400', bg: 'bg-rose-400/10' },
        { label: 'Available Racks', value: stats.available_racks, icon: MapPin, color: 'text-slate-400', bg: 'bg-slate-400/10' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Store Overview</h2>
                <button onClick={fetchStats} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all">
                    <RefreshCw size={18} className={localLoading ? 'animate-spin' : ''} />
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {statCards.map((s, idx) => (
                    <div key={idx} className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
                        <div className={`${s.bg} ${s.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                            <s.icon size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-2xl font-black">{s.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==========================================
// 2. DROP OFF TAB  — mirrors DropOff.tsx exactly
// ==========================================
const DropOffTab = ({ store, getHeaders, getProxyUrl, setError, showSuccess, openPrintPreview }: TabProps) => {
    // ---- STEP STATE ----
    const [step, setStep] = useState<'customer' | 'items' | 'review'>('customer');

    // ---- CUSTOMER STATE ----
    const [customerSearch, setCustomerSearch] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '', email: '', address: '' });
    const [searchLoading, setSearchLoading] = useState(false);
    const [creatingCustomer, setCreatingCustomer] = useState(false);

    // ---- CLOTHING TYPES / SETTINGS ----
    const [clothingTypes, setClothingTypes] = useState<any[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [alterationTypes, setAlterationTypes] = useState<any[]>([]);
    const [starchPrices, setStarchPrices] = useState({ no_starch: 0, light: 0, medium: 0, heavy: 0, extra_heavy: 0 });
    const [sizePrices, setSizePrices] = useState<Record<string, number>>({ s: 0, m: 0, l: 0, xl: 0, xxl: 0, none: 0 });

    // ---- ITEMS ----
    const [items, setItems] = useState<DropOffItem[]>([]);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // ---- ORDER DETAILS ----
    const [pickupDate, setPickupDate] = useState(
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16)
    );
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [paidAmount, setPaidAmount] = useState(0);
    const [tenderedAmount, setTenderedAmount] = useState('');

    // ---- CUSTOM ITEM MODAL ----
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customForm, setCustomForm] = useState({ name: '', price: '', margin: '' });

    // ---- SUBMISSION ----
    const [submitting, setSubmitting] = useState(false);

    // ---- AFTER-CREATION: TICKET LIST ----
    const [createdTickets, setCreatedTickets] = useState<any[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [showTickets, setShowTickets] = useState(false);
    const [createdTicketDetail, setCreatedTicketDetail] = useState<any | null>(null);

    // ---- INIT DATA ----
    const fetchInitData = useCallback(async () => {
        try {
            const [clothRes, settingsRes, altRes] = await Promise.all([
                axios.get(getProxyUrl('clothing-types'), { headers: getHeaders() }),
                axios.get(getProxyUrl('settings'), { headers: getHeaders() }).catch(() => ({ data: null })),
                axios.get(getProxyUrl('alteration-types'), { headers: getHeaders() }).catch(() => ({ data: [] })),
            ]);

            // Clothing types
            if (clothRes.data && typeof clothRes.data === 'object' && !Array.isArray(clothRes.data)) {
                const flat = Object.values(clothRes.data).flat() as any[];
                setClothingTypes(flat);
                setCategories(Object.keys(clothRes.data).sort());
            } else if (Array.isArray(clothRes.data)) {
                setClothingTypes(clothRes.data);
            }

            // Settings (starch/size pricing)
            if (settingsRes.data) {
                const d = settingsRes.data;
                setStarchPrices({
                    no_starch: 0,
                    light: parseFloat(d.starch_price_light) || 0,
                    medium: parseFloat(d.starch_price_medium) || 0,
                    heavy: parseFloat(d.starch_price_heavy) || 0,
                    extra_heavy: parseFloat(d.starch_price_extra_heavy) || 0,
                });
                setSizePrices({
                    none: 0,
                    s: parseFloat(d.size_price_s) || 0,
                    m: parseFloat(d.size_price_m) || 0,
                    l: parseFloat(d.size_price_l) || 0,
                    xl: parseFloat(d.size_price_xl) || 0,
                    xxl: parseFloat(d.size_price_xxl) || 0,
                });
            }

            // Alteration types
            if (Array.isArray(altRes.data)) setAlterationTypes(altRes.data);
        } catch (err) {
            setError('Failed to load Drop Off configuration.');
        }
    }, [getProxyUrl, getHeaders, setError]);

    useEffect(() => { fetchInitData(); }, [fetchInitData]);

    // ---- CUSTOMER SEARCH ----
    const searchCustomers = useCallback(async (query: string) => {
        if (query.length < 2) { setCustomers([]); return; }
        setSearchLoading(true);
        try {
            const res = await axios.get(
                getProxyUrl(`customers/search?q=${encodeURIComponent(query)}`),
                { headers: getHeaders() }
            );
            setCustomers(Array.isArray(res.data) ? res.data : []);
        } catch {
            setCustomers([]);
        } finally {
            setSearchLoading(false);
        }
    }, [getProxyUrl, getHeaders]);

    const createCustomer = async () => {
        setCreatingCustomer(true);
        try {
            const res = await axios.post(
                getProxyUrl('customers/register'),
                { ...newCustomer, password: 'FallbackDefaultPassword123!' },
                { headers: getHeaders() }
            );
            setSelectedCustomer(res.data);
            setShowNewCustomerForm(false);
            setStep('items');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create customer.');
        } finally {
            setCreatingCustomer(false);
        }
    };

    // ---- ITEM COMPUTATION (mirrors DropOff.tsx updateItem) ----
    const computeItemTotal = (item: DropOffItem): DropOffItem => {
        const isAltOnly = item.alteration_behavior === 'alteration_only';
        const qty = item.quantity || 0;

        const starchKey = item.starch_level as keyof typeof starchPrices;
        const unitStarch = isAltOnly ? 0 : (starchPrices[starchKey] || 0);
        const starch_charge = unitStarch * qty;

        const sizeKey = item.clothing_size || 'none';
        const unitSize = (isAltOnly || sizeKey === 'none') ? 0 : (sizePrices[sizeKey] || 0);
        const size_charge = unitSize * qty;

        const ct = clothingTypes.find(c => c.id === item.id);
        let basePrice = 0;
        if (item.is_custom) {
            basePrice = (item.plant_price || 0) + (item.margin || 0);
        } else if (ct) {
            basePrice = ct.total_price || (ct.plant_price + ct.margin) || 0;
        }
        if (isAltOnly) basePrice = 0;

        const total = Math.max(
            0,
            (basePrice * qty) +
            (item.additional_charge || 0) +
            starch_charge +
            size_charge +
            (item.alteration_price || 0)
        );

        return { ...item, starch_charge, size_charge, item_total: total };
    };

    const addItemByTypeId = (typeId: number) => {
        const ct = clothingTypes.find(t => t.id === typeId);
        if (!ct) return;
        const base: DropOffItem = {
            id: ct.id, name: ct.name,
            plant_price: ct.plant_price, margin: ct.margin,
            quantity: 1,
            starch_level: 'no_starch', starch_charge: 0,
            clothing_size: 'none', size_charge: 0,
            crease: false, additional_charge: 0,
            item_instructions: '',
            alteration_behavior: 'none',
            alteration_id: null, alteration_name: null, alteration_price: 0,
            is_custom: false,
            item_total: ct.total_price || (ct.plant_price + ct.margin) || 0,
        };
        setItems(prev => { const next = [...prev, computeItemTotal(base)]; setSelectedItemIndex(next.length - 1); return next; });
    };

    const addCustomItem = () => {
        const price = parseFloat(customForm.price) || 0;
        const margin = parseFloat(customForm.margin) || 0;
        const base: DropOffItem = {
            id: -1, name: customForm.name.trim() || 'Custom Item',
            plant_price: price, margin,
            quantity: 1,
            starch_level: 'no_starch', starch_charge: 0,
            clothing_size: 'none', size_charge: 0,
            crease: false, additional_charge: 0,
            item_instructions: '',
            alteration_behavior: 'none',
            alteration_id: null, alteration_name: null, alteration_price: 0,
            is_custom: true,
            item_total: price + margin,
        };
        setItems(prev => { const next = [...prev, computeItemTotal(base)]; setSelectedItemIndex(next.length - 1); return next; });
        setCustomForm({ name: '', price: '', margin: '' });
        setShowCustomModal(false);
    };

    const updateItem = (index: number, updates: Partial<DropOffItem>) => {
        setItems(prev => {
            const next = [...prev];
            next[index] = computeItemTotal({ ...next[index], ...updates });
            return next;
        });
    };

    const removeItem = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setItems(prev => prev.filter((_, i) => i !== index));
        if (selectedItemIndex === index) setSelectedItemIndex(null);
        if (selectedItemIndex !== null && index < selectedItemIndex) setSelectedItemIndex(selectedItemIndex - 1);
    };

    // ---- FILTERED CLOTHING ----
    const filteredClothing = useMemo(() => {
        let list = clothingTypes.filter(c => c && c.name);
        if (selectedCategory !== 'All') list = list.filter(c => c.category === selectedCategory);
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(c => c.name.toLowerCase().includes(q));
        }
        return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [clothingTypes, selectedCategory, searchTerm]);

    // ---- TOTALS ----
    const totalAmount = items.reduce((s, i) => s + i.item_total, 0);
    const envCharge = totalAmount * 0.047;
    const tax = totalAmount * 0.0825;
    const finalTotal = totalAmount + envCharge + tax;

    // ---- SUBMIT TICKET ----
    const mapStarch = (val: string) => {
        if (!val || val === 'no_starch') return 'none';
        if (val === 'extra_heavy') return 'high';
        return val; // light, medium, heavy pass-through
    };

    const handleSubmitTicket = async () => {
        if (!selectedCustomer) { setError('Please assign a customer first.'); return; }
        if (items.length === 0) { setError('Please add at least one item.'); return; }

        setSubmitting(true);
        try {
            const payload = {
                customer_id: selectedCustomer.id,
                items: items.map(i => ({
                    clothing_type_id: i.is_custom || i.id === -1 ? null : i.id,
                    custom_name: i.is_custom ? i.name : null,
                    unit_price: i.plant_price || 0,
                    margin: i.is_custom ? i.margin : 0,
                    quantity: i.quantity,
                    starch_level: mapStarch(i.starch_level),
                    clothing_size: i.clothing_size || 'none',
                    size_charge: i.size_charge || 0,
                    crease: i.crease,
                    additional_charge: i.additional_charge || 0,
                    starch_charge: i.starch_charge || 0,
                    item_instructions: i.item_instructions || null,
                    alteration_behavior: i.alteration_behavior,
                    alteration_id: i.alteration_id || null,
                    alteration_name: i.alteration_name || null,
                    alteration_price: i.alteration_price || 0,
                })),
                paid_amount: Number(paidAmount) || 0,
                pickup_date: new Date(pickupDate).toISOString(),
                special_instructions: specialInstructions || null,
            };

            const res = await axios.post(getProxyUrl('tickets'), payload, { headers: getHeaders() });
            showSuccess(`Ticket #${res.data.ticket_number} created successfully!`);

            // ---- RESET FORM ----
            setStep('customer');
            setSelectedCustomer(null);
            setItems([]);
            setSelectedItemIndex(null);
            setSpecialInstructions('');
            setPaidAmount(0);
            setTenderedAmount('');
            setCustomerSearch('');
            setCustomers([]);
            setPickupDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16));

            // ---- FETCH & SHOW TICKETS & LOAD CREATED TICKET DETAIL ----
            setLoadingTickets(true);
            setShowTickets(true);
            try {
                const ticketsRes = await axios.get(getProxyUrl('tickets'), { headers: getHeaders() });
                setCreatedTickets(ticketsRes.data || []);
            } catch {
                setError('Ticket created but failed to refresh list.');
            }

            // Try to fetch the full ticket detail for the newly created ticket
            try {
                const detailRes = await axios.get(getProxyUrl(`tickets/${res.data.id}`), { headers: getHeaders() });
                const detail = detailRes.data || null;
                setCreatedTicketDetail(detail);

                // Open print preview using main handler
                try { await openPrintPreview(detail); } catch (e) { /* non-fatal */ }

            } catch {
                // Non-fatal: show list but inform user if detail couldn't be loaded
                setCreatedTicketDetail(null);
            } finally {
                setLoadingTickets(false);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create ticket.');
        } finally {
            setSubmitting(false);
        }
    };

    // ==========================================
    // RENDER: STEP INDICATOR (identical to DropOff.tsx)
    // ==========================================
    const StepIndicator = () => (
        <div className="flex items-center mt-0.5 space-x-2 mb-1.5">
            {(['customer', 'items', 'review'] as const).map((s, idx) => (
                <div key={s} className={`flex items-center ${step === s ? 'text-indigo-400' : 'text-gray-500'}`}>
                    {idx > 0 && <ChevronRight size={12} className="mr-2 text-slate-600" />}
                    <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium mr-1 ${step === s ? 'bg-indigo-400/20 text-indigo-400' : 'bg-slate-700 text-slate-500'}`}
                    >
                        {idx + 1}
                    </div>
                    <span className="text-xs capitalize">{s}</span>
                </div>
            ))}
        </div>
    );

    // ==========================================
    // RENDER: TICKET LIST (shown after creation — mirrors PlatformAdmin behaviour)
    // ==========================================
    if (showTickets) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Orders</h2>
                        <p className="text-xs text-slate-500 mt-1">Ticket created successfully — showing current orders for this store.</p>
                    </div>
                    <button
                        onClick={() => { setShowTickets(false); setCreatedTicketDetail(null); }}
                        className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={14} /> New Drop Off
                    </button>
                </div>

                <div className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                    {loadingTickets ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 className="animate-spin mb-3 text-indigo-400" size={32} />
                            <p className="text-sm font-bold uppercase tracking-widest">Loading tickets...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3">
                            <div className="lg:col-span-2 overflow-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-slate-900 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4">Ticket #</th>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Pickup Date</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {createdTickets.map((t: any) => (
                                            <tr key={t.id} onClick={async () => {
                                                try {
                                                    const detailRes = await axios.get(getProxyUrl(`tickets/${t.id}`), { headers: getHeaders() });
                                                    const detail = detailRes.data || null;
                                                    setCreatedTicketDetail(detail);

                                                    // open centralized print preview for selected ticket
                                                    try { await openPrintPreview(detail); } catch (e) { /* non-fatal */ }

                                                } catch { setError('Failed to load ticket details'); }
                                            }} className="hover:bg-slate-700/30 transition-colors cursor-pointer">
                                                <td className="px-6 py-4 font-black text-indigo-300">{t.ticket_number}</td>
                                                <td className="px-6 py-4 font-medium">{t.customer_name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${t.status === 'ready_for_pickup'
                                                            ? 'bg-emerald-400/10 text-emerald-400'
                                                            : t.status === 'picked_up'
                                                                ? 'bg-slate-600/30 text-slate-400'
                                                                : 'bg-amber-400/10 text-amber-400'
                                                        }`}>
                                                        {t.status?.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400 text-xs">{t.pickup_date ? new Date(t.pickup_date).toLocaleDateString() : '—'}</td>
                                                <td className="px-6 py-4 text-right font-black">${t.total_amount?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {createdTickets.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-16 text-center text-slate-500 italic">No tickets found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="lg:col-span-1 p-6 border-l border-slate-700/30">
                                {createdTicketDetail ? (
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Ticket Details</p>
                                                <h3 className="text-2xl font-black text-indigo-400">{createdTicketDetail.ticket_number}</h3>
                                            </div>
                                            <button onClick={() => setCreatedTicketDetail(null)} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 mb-4">
                                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Customer</p>
                                                <p className="font-bold">{createdTicketDetail.customer_name}</p>
                                            </div>
                                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                                                <span className={`text-xs font-black uppercase px-2 py-1 rounded-lg ${createdTicketDetail.status === 'ready_for_pickup' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'}`}>{createdTicketDetail.status?.replace(/_/g, ' ')}</span>
                                            </div>
                                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Pickup Date</p>
                                                <p className="font-black text-slate-300">{createdTicketDetail.pickup_date ? new Date(createdTicketDetail.pickup_date).toLocaleDateString() : '—'}</p>
                                            </div>
                                        </div>

                                        {createdTicketDetail.items?.length > 0 && (
                                            <div className="space-y-3 mb-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Order Contents</p>
                                                <div className="space-y-2">
                                                    {createdTicketDetail.items.map((item: any) => (
                                                        <div key={item.id} className="flex justify-between items-center p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center text-xs font-black">{item.quantity}</div>
                                                                <p className="font-bold">{item.clothing_name || item.custom_name}</p>
                                                            </div>
                                                            <p className="font-black text-sm">${item.item_total?.toFixed(2)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-700 shadow-inner">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Bill</p>
                                                <p className="text-xl font-black">${createdTicketDetail.total_amount?.toFixed(2)}</p>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Amount Paid</p>
                                                <p className="text-xl font-black text-emerald-400">${createdTicketDetail.paid_amount?.toFixed(2)}</p>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Balance Outstanding</p>
                                                <p className="text-3xl font-black text-amber-400">${(createdTicketDetail.total_amount - createdTicketDetail.paid_amount).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-500 italic">Select a ticket to view details.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ==========================================
    // RENDER: STEP 1 — CUSTOMER (mirrors DropOff.tsx step === 'customer')
    // ==========================================
    if (step === 'customer') {
        return (
            <div className="w-full max-w-full mx-auto font-sans flex flex-col">
                <div className="mb-3">
                    <h2 className="text-lg font-bold text-white">Drop Off Clothes</h2>
                    <StepIndicator />
                </div>

                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 shadow-xl flex-1">
                    <h3 className="text-sm font-semibold mb-3 text-slate-200">Select or Create Customer</h3>

                    {!showNewCustomerForm ? (
                        <div>
                            {/* Search */}
                            <div className="mb-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-3 w-3" />
                                    {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 h-3 w-3 animate-spin" />}
                                    <input
                                        type="text"
                                        placeholder="Search by name or phone..."
                                        value={customerSearch}
                                        onChange={e => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* Results */}
                            {customers.length > 0 && (
                                <div className="mb-3">
                                    <h4 className="font-medium mb-1 text-sm text-slate-300">Existing Customers</h4>
                                    <div className="space-y-1">
                                        {customers.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => { setSelectedCustomer(c); setStep('items'); }}
                                                className="p-2 border border-slate-700 bg-slate-900/50 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-sm flex items-center gap-3"
                                            >
                                                <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center font-black text-xs">
                                                    {c.first_name?.[0]}{c.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-200">{c.first_name} {c.last_name}</span>
                                                    <span className="text-slate-500 text-xs ml-3">{c.phone || c.email}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {customerSearch.length >= 2 && customers.length === 0 && !searchLoading && (
                                <div className="mb-4 p-4 rounded-xl bg-indigo-400/5 border border-indigo-500/20">
                                    <div className="flex items-center text-indigo-400">
                                        <User className="h-5 w-5 mr-2" />
                                        <span className="font-medium">No existing customer found</span>
                                    </div>
                                    <p className="text-sm mt-1 text-indigo-300/70">No match for "{customerSearch}". Create a new customer below.</p>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    const term = customerSearch.trim();
                                    const prefill = { first_name: '', last_name: '', phone: '', email: '', address: '' };
                                    if (term) {
                                        const isEmail = term.includes('@');
                                        const isPhone = /^[\d\-\+\(\)\s\.]+$/.test(term) && (term.match(/\d/g) || []).length > 3;
                                        if (isEmail) prefill.email = term;
                                        else if (isPhone) prefill.phone = term;
                                        else { const p = term.split(' '); prefill.first_name = p[0]; if (p.length > 1) prefill.last_name = p.slice(1).join(' '); }
                                    }
                                    setNewCustomer(prefill);
                                    setShowNewCustomerForm(true);
                                }}
                                className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all active:scale-[0.99]"
                            >
                                Create New Customer
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h4 className="font-medium mb-3 text-sm text-slate-200">New Customer Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                                {[
                                    { ph: 'First Name', key: 'first_name', type: 'text' },
                                    { ph: 'Last Name', key: 'last_name', type: 'text' },
                                    { ph: '123-456-7890', key: 'phone', type: 'tel' },
                                    { ph: 'Email', key: 'email', type: 'email' },
                                ].map(({ ph, key, type }) => (
                                    <input
                                        key={key}
                                        type={type}
                                        placeholder={ph}
                                        value={(newCustomer as any)[key]}
                                        onChange={e => setNewCustomer({ ...newCustomer, [key]: e.target.value })}
                                        className="px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm"
                                    />
                                ))}
                                <input
                                    type="text"
                                    placeholder="Address"
                                    value={newCustomer.address}
                                    onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                    className="px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm md:col-span-2 lg:col-span-4"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowNewCustomerForm(false)} className="px-4 py-2 text-slate-400 hover:text-slate-200">Cancel</button>
                                <button
                                    onClick={createCustomer}
                                    disabled={creatingCustomer || !(newCustomer.email || newCustomer.phone)}
                                    className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {creatingCustomer ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Creating...
                                        </>
                                    ) : 'Create Customer'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ==========================================
    // RENDER: STEP 2 — ITEMS (mirrors DropOff.tsx step === 'items')
    // ==========================================
    if (step === 'items') {
        const selItem = selectedItemIndex !== null ? items[selectedItemIndex] : null;

        return (
            <div className="w-full max-w-full mx-auto font-sans flex flex-col">
                <div className="mb-3">
                    <h2 className="text-lg font-bold text-white">Drop Off Clothes</h2>
                    <StepIndicator />
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center font-black text-xs">
                            {selectedCustomer?.first_name?.[0]}{selectedCustomer?.last_name?.[0]}
                        </div>
                        <span className="text-sm text-slate-300 font-medium">{selectedCustomer?.first_name} {selectedCustomer?.last_name}</span>
                        <button onClick={() => { setStep('customer'); setSelectedCustomer(null); }} className="text-xs text-slate-500 hover:text-red-400 ml-1">Change</button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-3">
                    {/* LEFT: EDIT PANEL */}
                    <div className="lg:w-1/4 order-last lg:order-first">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 sticky top-4 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-sm font-bold mb-3 text-gray-900">Edit Item</h3>

                            {selItem ? (
                                <div className="space-y-2">
                                    {/* Selected item header */}
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h4 className="font-semibold text-xs text-gray-900 truncate">{selItem.name}</h4>
                                                <p className="text-[11px] text-gray-500">Total: ${selItem.item_total.toFixed(2)}</p>
                                            </div>
                                            <button onClick={e => removeItem(selectedItemIndex!, e)} className="text-gray-400 hover:text-red-600">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Service Mode */}
                                    <div className="bg-blue-50 p-2 rounded-lg shadow-sm border border-blue-200 text-sm" style={selItem.alteration_behavior === 'alteration_only' ? { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' } : {}}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Service Mode</h3>
                                            {selItem.alteration_behavior === 'alteration_only' && <span className="text-[8px] font-bold text-purple-700 uppercase">Alt Only</span>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const isAlt = selItem.alteration_behavior === 'alteration_only';
                                                updateItem(selectedItemIndex!, {
                                                    alteration_behavior: isAlt ? 'none' : 'alteration_only',
                                                    starch_level: isAlt ? selItem.starch_level : 'no_starch',
                                                    clothing_size: isAlt ? selItem.clothing_size : 'none',
                                                    crease: isAlt ? selItem.crease : false,
                                                });
                                            }}
                                            className={`w-full flex items-center justify-center gap-1 py-1 rounded-lg border-2 transition-all font-bold text-xs ${selItem.alteration_behavior === 'alteration_only' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'}`}
                                        >
                                            <div className={`w-3 h-3 rounded border flex items-center justify-center ${selItem.alteration_behavior === 'alteration_only' ? 'bg-white border-white' : 'border-gray-300'}`}>
                                                {selItem.alteration_behavior === 'alteration_only' && <div className="w-1.5 h-1.5 bg-purple-600 rounded-sm" />}
                                            </div>
                                            <span>Alteration Only</span>
                                        </button>
                                    </div>

                                    {/* Starch */}
                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-sm">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Starch</h3>
                                            {selItem.starch_charge > 0 && <span className="text-[9px] font-bold text-blue-600">+${selItem.starch_charge.toFixed(2)}</span>}
                                        </div>
                                        <div className={`grid grid-cols-5 gap-0.5 ${selItem.alteration_behavior === 'alteration_only' ? 'opacity-40 pointer-events-none' : ''}`}>
                                            {(['no_starch', 'light', 'medium', 'heavy', 'extra_heavy'] as const).map(key => {
                                                const label = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()).replace('No Starch', 'None').replace('Extra Heavy', 'Ex.Hv');
                                                const active = selItem.starch_level === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => updateItem(selectedItemIndex!, { starch_level: key })}
                                                        className={`px-0.5 py-1 text-[8px] font-bold uppercase rounded border transition-all ${active ? 'text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}
                                                        style={active ? { backgroundColor: '#3b82f6', borderColor: '#3b82f6' } : undefined}
                                                    >{label}</button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Alterations */}
                                    {alterationTypes.length > 0 && (
                                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="px-3 py-2.5">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Alterations</span>
                                                {selItem.alteration_id && (
                                                    <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700">
                                                        ✓ {selItem.alteration_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="px-3 pb-3 border-t border-gray-100 pt-2 flex flex-col gap-1 max-h-[80px] overflow-y-auto">
                                                {alterationTypes.map(alt => {
                                                    const isActive = selItem.alteration_id === alt.id;
                                                    return (
                                                        <button
                                                            key={alt.id}
                                                            type="button"
                                                            onClick={() => {
                                                                if (isActive) {
                                                                    updateItem(selectedItemIndex!, { alteration_id: null, alteration_name: null, alteration_price: 0 });
                                                                } else {
                                                                    updateItem(selectedItemIndex!, { alteration_id: alt.id, alteration_name: alt.name, alteration_price: alt.price });
                                                                }
                                                            }}
                                                            className="flex items-center justify-between w-full px-3 py-2 rounded-lg border text-left transition-all text-xs font-medium"
                                                            style={isActive ? { backgroundColor: '#7c3aed', color: '#fff', borderColor: '#7c3aed' } : { backgroundColor: '#faf5ff', color: '#6d28d9', borderColor: '#e9d5ff' }}
                                                        >
                                                            <span>{alt.name}</span>
                                                            <span className="text-[10px] font-bold opacity-80">+${Number(alt.price).toFixed(2)}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Size */}
                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-sm">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Size</h3>
                                            {selItem.size_charge > 0 && <span className="text-[9px] font-bold text-amber-600">+${selItem.size_charge.toFixed(2)}</span>}
                                        </div>
                                        <div className={`grid grid-cols-6 gap-0.5 ${selItem.alteration_behavior === 'alteration_only' ? 'opacity-40 pointer-events-none' : ''}`}>
                                            {(['none', 's', 'm', 'l', 'xl', 'xxl'] as const).map(key => {
                                                const active = (selItem.clothing_size || 'none') === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => updateItem(selectedItemIndex!, { clothing_size: key })}
                                                        className={`px-0.5 py-1 text-[8px] font-bold uppercase rounded border transition-all ${active ? 'text-white' : 'bg-white border-gray-200 text-gray-600'}`}
                                                        style={active ? { backgroundColor: '#6366f1', borderColor: '#6366f1' } : undefined}
                                                    >{key === 'none' ? 'None' : key.toUpperCase()}</button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Qty + Crease */}
                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-sm">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex-1">
                                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Qty</label>
                                                <input
                                                    type="number" min="1"
                                                    value={selItem.quantity}
                                                    onChange={e => updateItem(selectedItemIndex!, { quantity: parseInt(e.target.value) || 1 })}
                                                    className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs font-bold"
                                                />
                                            </div>
                                            <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
                                                <input
                                                    type="checkbox"
                                                    disabled={selItem.alteration_behavior === 'alteration_only'}
                                                    checked={selItem.crease && selItem.alteration_behavior !== 'alteration_only'}
                                                    onChange={e => updateItem(selectedItemIndex!, { crease: e.target.checked })}
                                                    className="rounded w-4 h-4 accent-blue-600 disabled:opacity-30"
                                                />
                                                <span className="text-[9px] text-gray-600 whitespace-nowrap">Crease</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Price Adjustment */}
                                    <UpchargeSelector
                                        currentCharge={selItem.additional_charge}
                                        onUpdate={v => updateItem(selectedItemIndex!, { additional_charge: v })}
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500 text-xs">Select an item to edit</div>
                            )}
                        </div>
                    </div>

                    {/* CENTER: CLOTHING GRID */}
                    <div className="lg:w-2/4">
                        {/* Search */}
                        <div className="mb-2 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs bg-white"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* View Toggle + Category Tabs */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                                <button onClick={() => setViewMode('grid')} className={`px-2 py-1 text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                                    <Grid size={12} />
                                </button>
                                <button onClick={() => setViewMode('list')} className={`px-2 py-1 text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                                    <List size={12} />
                                </button>
                            </div>
                            <button
                                onClick={() => setSelectedCategory('All')}
                                className="px-2 py-1 rounded-full text-xs font-bold transition-all border"
                                style={selectedCategory === 'All' ? { backgroundColor: '#3b82f6', color: '#fff', borderColor: '#3b82f6' } : { backgroundColor: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}
                            >All Items</button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className="px-2 py-1 rounded-full text-xs font-bold transition-all border"
                                    style={selectedCategory === cat ? { backgroundColor: '#3b82f6', color: '#fff', borderColor: '#3b82f6' } : { backgroundColor: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}
                                >{cat}</button>
                            ))}
                        </div>

                        {viewMode === 'grid' ? (
                            <ClothingGrid
                                clothingTypes={filteredClothing}
                                onAdd={addItemByTypeId}
                                onAddCustom={() => setShowCustomModal(true)}
                            />
                        ) : (
                            <div className="space-y-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <button
                                    onClick={() => setShowCustomModal(true)}
                                    className="flex items-center font-medium text-indigo-600"
                                >
                                    <PenTool className="h-4 w-4 mr-2" /> Add Custom Item
                                </button>
                                <div className="mt-3 space-y-1">
                                    {filteredClothing.map(ct => (
                                        <button
                                            key={ct.id}
                                            onClick={() => addItemByTypeId(ct.id)}
                                            className="w-full flex justify-between items-center p-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm"
                                        >
                                            <span className="font-medium">{ct.name}</span>
                                            <span className="text-blue-600 font-bold">${(ct.total_price || (ct.plant_price + ct.margin) || 0).toFixed(2)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: ITEMS CART */}
                    <div className="lg:w-1/4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-4 max-h-[90vh] flex flex-col overflow-hidden">
                            <div className="p-3 border-b flex items-center justify-between bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-900">Items ({items.length})</h3>
                                <div className="text-xs font-bold text-gray-700">${totalAmount.toFixed(2)}</div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedItemIndex(idx)}
                                        className="p-2 border rounded-lg cursor-pointer transition-all duration-200"
                                        style={selectedItemIndex === idx ? { borderColor: '#3b82f6', boxShadow: '0 0 0 1px #3b82f6', backgroundColor: '#3b82f608' } : undefined}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-semibold text-[11px] text-gray-900 truncate flex items-center gap-1">
                                                    {item.alteration_behavior === 'alteration_only' && (
                                                        <span className="flex-shrink-0 text-[7px] font-black bg-black text-white px-1 py-0.5 rounded leading-none">ALT</span>
                                                    )}
                                                    <span className="truncate">{item.name}</span>
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[9px] font-black uppercase text-gray-500">
                                                    <span className="bg-gray-100 px-1 rounded">Q:{item.quantity}</span>
                                                    {item.starch_level !== 'no_starch' && (
                                                        <span className="text-blue-700">ST:{item.starch_level[0].toUpperCase()}</span>
                                                    )}
                                                    {item.clothing_size !== 'none' && (
                                                        <span className="text-amber-700">SZ:{item.clothing_size.toUpperCase()}</span>
                                                    )}
                                                    {item.crease && <span className="text-emerald-700">CR</span>}
                                                    {item.alteration_name && (
                                                        <span className="text-purple-700">ALT:{item.alteration_name.substring(0, 3).toUpperCase()}</span>
                                                    )}
                                                    <span className="text-blue-600 ml-auto font-black text-[10px]">${item.item_total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <button onClick={e => removeItem(idx, e)} className="text-gray-400 hover:text-red-600 transition-colors">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {items.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <div className="mb-2 flex justify-center opacity-20"><Shirt size={32} /></div>
                                        <p className="text-[10px] font-medium uppercase tracking-wider">No items added yet</p>
                                    </div>
                                )}
                            </div>
                            {items.length > 0 && (
                                <div className="p-3 border-t bg-gray-50">
                                    <button
                                        onClick={() => setStep('review')}
                                        className="w-full py-2.5 px-4 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.98] shadow-sm bg-indigo-600"
                                    >
                                        <List className="h-4 w-4" /> Review Order
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CUSTOM ITEM MODAL */}
                {showCustomModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                            <h3 className="font-bold text-gray-900">Add Custom Item</h3>
                            <p className="text-sm text-gray-500">Enter details for an item not in the database.</p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg p-2 text-sm"
                                    placeholder="e.g., Vintage Scarf"
                                    value={customForm.name}
                                    onChange={e => setCustomForm({ ...customForm, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
                                    <input type="number" step="0.01" className="w-full border rounded-lg p-2 text-sm" placeholder="0.00" value={customForm.price} onChange={e => setCustomForm({ ...customForm, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Margin ($)</label>
                                    <input type="number" step="0.01" className="w-full border rounded-lg p-2 text-sm" placeholder="0.00" value={customForm.margin} onChange={e => setCustomForm({ ...customForm, margin: e.target.value })} />
                                </div>
                            </div>
                            <div className="text-right text-sm font-semibold text-gray-700">
                                Total: ${((parseFloat(customForm.price) || 0) + (parseFloat(customForm.margin) || 0)).toFixed(2)}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setShowCustomModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button
                                    onClick={addCustomItem}
                                    disabled={!customForm.name || !customForm.price}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700"
                                >Add Item</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // RENDER: STEP 3 — REVIEW (mirrors DropOff.tsx step === 'review')
    // ==========================================
    return (
        <div className="w-full max-w-full mx-auto font-sans flex flex-col">
            <div className="mb-3">
                <h2 className="text-lg font-bold text-white">Drop Off Clothes</h2>
                <StepIndicator />
            </div>

            <div className="max-w-[1360px] mx-auto bg-white p-5 rounded-xl shadow-sm border border-gray-200 w-full">
                <h3 className="text-xl font-bold mb-6 text-gray-900">Review Ticket</h3>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* LEFT 3: Items & Logistics */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Column 1: Customer, pickup, payment */}
                            <div className="space-y-4">
                                {/* Customer */}
                                <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="font-bold text-[10px] uppercase text-gray-500 tracking-widest">Customer Details</h4>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Name:</span>
                                        <span className="font-bold text-gray-900">{selectedCustomer?.first_name} {selectedCustomer?.last_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Phone:</span>
                                        <span className="font-bold text-gray-900">{selectedCustomer?.phone}</span>
                                    </div>
                                </div>

                                {/* Pickup date */}
                                <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="font-bold text-[10px] uppercase text-gray-500 tracking-widest">Schedule Pickup</h4>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-gray-600 text-[11px] font-bold">Target Pickup Date:</span>
                                        <input
                                            type="datetime-local"
                                            value={pickupDate}
                                            onChange={e => setPickupDate(e.target.value)}
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:ring-1 focus:ring-blue-500 outline-none w-full shadow-inner"
                                        />
                                    </div>
                                </div>

                                {/* Payment Calculator */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 shadow-sm">
                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                                        <Calculator className="w-4 h-4 text-gray-600" />
                                        <h4 className="font-bold text-gray-800 text-[10px] uppercase tracking-widest">Payment Calculator</h4>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Amount Given</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="number" step="0.01" min="0"
                                                value={tenderedAmount}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setTenderedAmount(val);
                                                    const num = parseFloat(val) || 0;
                                                    setPaidAmount(Math.min(num, finalTotal));
                                                }}
                                                className="w-full pl-9 pr-3 py-2 border-2 rounded-xl font-bold text-xl text-gray-900 focus:ring-0 shadow-inner border-indigo-100"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white p-2.5 rounded border border-gray-200 shadow-sm">
                                            <span className="block text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Change</span>
                                            <span className="block text-base font-black" style={(parseFloat(tenderedAmount) || 0) > finalTotal ? { color: '#6366f1' } : { color: '#d1d5db' }}>
                                                ${Math.max(0, (parseFloat(tenderedAmount) || 0) - finalTotal).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="bg-white p-2.5 rounded border border-gray-200 shadow-sm">
                                            <span className="block text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Due</span>
                                            <span className={`block text-base font-black ${(parseFloat(tenderedAmount) || 0) < finalTotal ? 'text-red-600' : 'text-gray-900'}`}>
                                                ${Math.max(0, finalTotal - (parseFloat(tenderedAmount) || 0)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Items table */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white shadow-sm h-full">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 text-[10px] font-black uppercase text-gray-600 tracking-wider">
                                    Ticket Items ({items.length} Items)
                                </div>
                                <div className="max-h-[500px] overflow-y-auto">
                                    <table className="w-full text-xs border-collapse">
                                        <thead className="bg-white text-gray-400 uppercase text-[9px] font-black border-b sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left">Specs</th>
                                                <th className="px-4 py-2.5 text-center">Qty</th>
                                                <th className="px-4 py-2.5 text-right">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                                            {item.alteration_behavior === 'alteration_only' && (
                                                                <span className="text-[7px] font-black bg-black text-white px-1 py-0.5 rounded leading-none">ALT</span>
                                                            )}
                                                            <span className="text-sm truncate max-w-[200px]">{item.name}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                            {item.starch_level !== 'no_starch' && <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase border border-blue-100">{item.starch_level.replace('_', ' ')}</span>}
                                                            {item.crease && <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase border border-emerald-100">Crease</span>}
                                                            {item.clothing_size && item.clothing_size !== 'none' && <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase border border-amber-100">Size {item.clothing_size}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-gray-700">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right font-black text-gray-900">${item.item_total.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT 1: Final Statement */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm h-full flex flex-col justify-between">
                            <div>
                                <h4 className="font-black text-[10px] uppercase text-gray-500 tracking-widest mb-4 border-b border-gray-200 pb-2.5">Final Statement</h4>
                                <div className="space-y-3">
                                    <div className="text-xs text-gray-600 flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="font-bold text-gray-900 text-sm">${totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 flex justify-between">
                                        <span>Environmental (4.7%):</span>
                                        <span className="font-bold text-gray-900 text-xs">${envCharge.toFixed(2)}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 flex justify-between pb-4 border-b border-gray-200">
                                        <span>Tax (8.25%):</span>
                                        <span className="font-bold text-gray-900 text-xs">${tax.toFixed(2)}</span>
                                    </div>
                                    <div className="text-2xl font-black flex justify-between items-center pt-4">
                                        <span className="text-gray-900">Total</span>
                                        <span className="text-indigo-600">${finalTotal.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <label className="block text-gray-700 font-bold mb-2 text-[10px] uppercase tracking-widest">Order Instructions</label>
                                    <textarea
                                        value={specialInstructions}
                                        onChange={e => setSpecialInstructions(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl h-36 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300 resize-none shadow-inner bg-white"
                                        placeholder="Add any general notes..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setStep('items')}
                                    className="px-5 py-3.5 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all uppercase text-[10px] tracking-widest"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmitTicket}
                                    disabled={submitting}
                                    className="flex-1 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black flex justify-center items-center hover:opacity-95 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 uppercase text-[10px] tracking-widest"
                                >
                                    {submitting ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : 'Confirm Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. PICK UP TAB
// ==========================================
const PickUpTab = ({ store, getHeaders, getProxyUrl, setError, showSuccess }: TabProps) => {
    const [ticketNumber, setTicketNumber] = useState('');
    const [ticketData, setTicketData] = useState<any>(null);
    const [checking, setChecking] = useState(false);
    const [amountPaid, setAmountPaid] = useState(0);
    const [processing, setProcessing] = useState(false);

    const handleValidate = async () => {
        if (!ticketNumber) return;
        setChecking(true);
        setTicketData(null);
        try {
            const res = await axios.get(getProxyUrl(`tickets/validate/${ticketNumber}`), { headers: getHeaders() });
            setTicketData(res.data);
            setAmountPaid(res.data.balance_due || 0);
        } catch { setError('Invalid ticket number'); }
        finally { setChecking(false); }
    };

    const handlePickup = async () => {
        if (!ticketData) return;
        setProcessing(true);
        try {
            await axios.put(getProxyUrl(`tickets/${ticketData.ticket_id}/pickup`), { amount_paid: amountPaid }, { headers: getHeaders() });
            showSuccess('Pickup successful!');
            setTicketData(null);
            setTicketNumber('');
        } catch { setError('Pickup failed'); }
        finally { setProcessing(false); }
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
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 text-xl font-black uppercase focus:border-indigo-500 outline-none placeholder:text-slate-600"
                        value={ticketNumber}
                        onChange={e => setTicketNumber(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleValidate()}
                    />
                    <button
                        onClick={handleValidate}
                        disabled={checking || !ticketNumber}
                        className="bg-indigo-600 hover:bg-indigo-500 px-8 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                    >
                        {checking ? <Loader2 className="animate-spin" /> : 'Check'}
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
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-lg font-black text-emerald-400 focus:border-emerald-500 outline-none"
                                    value={amountPaid}
                                    onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handlePickup}
                        disabled={processing}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl"
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
const RacksTab = ({ getHeaders, getProxyUrl, setError, showSuccess }: TabProps) => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [racks, setRacks] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [savingId, setSavingId] = useState<number | null>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const [rackInputs, setRackInputs] = useState<Record<number, string>>({});

    const fetchData = useCallback(async () => {
        setLocalLoading(true);
        try {
            const [ticketsRes, racksRes] = await Promise.all([
                axios.get(getProxyUrl('tickets'), { headers: getHeaders() }),
                axios.get(getProxyUrl('racks'), { headers: getHeaders() }),
            ]);
            setTickets(ticketsRes.data || []);
            setRacks(racksRes.data?.racks || []);
        } catch { setError('Failed to fetch racking data'); }
        finally { setLocalLoading(false); }
    }, [getProxyUrl, getHeaders, setError]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaveRack = async (ticketId: number, rack: string) => {
        setSavingId(ticketId);
        try {
            await axios.put(getProxyUrl(`tickets/${ticketId}/rack`), { rack_number: parseInt(rack, 10) }, { headers: getHeaders() });
            showSuccess('Rack assigned');
            fetchData();
        } catch { setError('Failed to assign rack'); }
        finally { setSavingId(null); }
    };

    const filtered = tickets
        .filter(t => t.ticket_number.toLowerCase().includes(search.toLowerCase()) || t.customer_name.toLowerCase().includes(search.toLowerCase()))
        .filter(t => t.status !== 'picked_up');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Rack Assignment</h2>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text" placeholder="Find ticket..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchData} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all">
                        <RefreshCw size={18} className={localLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                    <MapPin size={16} /> Rack Status Overview
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                    {racks.map(r => (
                        <div
                            key={r.id}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all ${r.is_occupied ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                            title={r.is_occupied ? `Ticket ID: ${r.ticket_id}` : 'Available'}
                        >
                            <span className="text-[10px] font-black">{r.number}</span>
                            {r.is_occupied && <Activity size={10} className="mt-1 animate-pulse" />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                        <tr>
                            <th className="px-6 py-4">Ticket</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Current Rack</th>
                            <th className="px-6 py-4 text-right">Assign Rack</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {filtered.map(t => (
                            <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 font-black text-indigo-300">{t.ticket_number}</td>
                                <td className="px-6 py-4">{t.customer_name}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded text-[10px] font-black uppercase">{t.status?.replace(/_/g, ' ')}</span>
                                </td>
                                <td className="px-6 py-4 font-black text-emerald-400">{t.rack_number || '—'}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <input
                                            type="number"
                                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-sm text-center font-black focus:border-indigo-500 outline-none"
                                            placeholder="#"
                                            value={rackInputs[t.id] || ''}
                                            onChange={e => setRackInputs(prev => ({ ...prev, [t.id]: e.target.value }))}
                                        />
                                        <button
                                            onClick={() => { if (rackInputs[t.id]) handleSaveRack(t.id, rackInputs[t.id]); }}
                                            disabled={savingId === t.id || !rackInputs[t.id]}
                                            className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-lg font-black text-xs uppercase tracking-widest disabled:opacity-50"
                                        >
                                            {savingId === t.id ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500 italic">No active tickets found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ==========================================
// 5. TICKETS TAB
// ==========================================
const TicketsTab = ({ getHeaders, getProxyUrl, setError }: TabProps) => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [search, setSearch] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    const fetchTickets = useCallback(async () => {
        setLocalLoading(true);
        try {
            const res = await axios.get(getProxyUrl('tickets'), { headers: getHeaders() });
            setTickets(res.data || []);
        } catch { setError('Failed to fetch tickets'); }
        finally { setLocalLoading(false); }
    }, [getProxyUrl, getHeaders, setError]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const filtered = tickets.filter(t =>
        t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
        t.customer_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">Orders</h2>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text" placeholder="Search tickets..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchTickets} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all">
                        <RefreshCw size={18} className={localLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                    {localLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 className="animate-spin mb-3 text-indigo-400" size={32} />
                            <p className="text-sm font-bold uppercase tracking-widest">Loading...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-900 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Ticket #</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filtered.map(t => (
                                    <tr
                                        key={t.id}
                                        onClick={() => setSelectedTicket(t)}
                                        className={`hover:bg-slate-700/30 transition-colors cursor-pointer ${selectedTicket?.id === t.id ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : ''}`}
                                    >
                                        <td className="px-6 py-4 font-black text-indigo-300">{t.ticket_number}</td>
                                        <td className="px-6 py-4 font-medium">{t.customer_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${t.status === 'ready_for_pickup' ? 'bg-emerald-400/10 text-emerald-400' : t.status === 'picked_up' ? 'bg-slate-600/30 text-slate-400' : 'bg-amber-400/10 text-amber-400'}`}>
                                                {t.status?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black">${t.total_amount?.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-500 italic">No tickets found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {selectedTicket && (
                    <div className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl p-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Ticket Details</p>
                                <h3 className="text-2xl font-black text-indigo-400">{selectedTicket.ticket_number}</h3>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Customer</p>
                                <p className="font-bold">{selectedTicket.customer_name}</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                                <span className={`text-xs font-black uppercase px-2 py-1 rounded-lg ${selectedTicket.status === 'ready_for_pickup' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'}`}>{selectedTicket.status?.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Pickup Date</p>
                                <p className="font-black text-slate-300">{selectedTicket.pickup_date ? new Date(selectedTicket.pickup_date).toLocaleDateString() : '—'}</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Rack Location</p>
                                <p className="font-black text-emerald-400">{selectedTicket.rack_number || 'NOT ASSIGNED'}</p>
                            </div>
                        </div>
                        {selectedTicket.items?.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Order Contents</p>
                                <div className="space-y-2">
                                    {selectedTicket.items.map((item: any) => (
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
                        )}
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
    );
};

// ==========================================
// 6. CUSTOMERS TAB
// ==========================================
const CustomersTab = ({ getHeaders, getProxyUrl, setError, showSuccess }: TabProps) => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', email: '', phone: '' });
    const [submitting, setSubmitting] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);

    const fetchCustomers = useCallback(async () => {
        setLocalLoading(true);
        try {
            const res = await axios.get(getProxyUrl('customers'), { headers: getHeaders() });
            setCustomers(res.data || []);
        } catch { setError('Failed to fetch customers'); }
        finally { setLocalLoading(false); }
    }, [getProxyUrl, getHeaders, setError]);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(getProxyUrl('customers'), {
                ...newCustomer,
                address: '',
                password: 'Password123!',
                email: newCustomer.email || null,
            }, { headers: getHeaders() });
            showSuccess('Customer created!');
            setShowForm(false);
            setNewCustomer({ first_name: '', last_name: '', email: '', phone: '' });
            fetchCustomers();
        } catch { setError('Failed to create customer'); }
        finally { setSubmitting(false); }
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
                    className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                    {showForm ? <X size={16} /> : <><UserPlus size={16} /> New Customer</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
                    {[
                        { ph: 'First Name', key: 'first_name', required: true },
                        { ph: 'Last Name', key: 'last_name', required: false },
                        { ph: 'Phone Number', key: 'phone', required: false },
                        { ph: 'Email (Optional)', key: 'email', required: false },
                    ].map(({ ph, key, required }) => (
                        <input
                            key={key}
                            required={required}
                            placeholder={ph}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none"
                            value={(newCustomer as any)[key]}
                            onChange={e => setNewCustomer({ ...newCustomer, [key]: e.target.value })}
                        />
                    ))}
                    <div className="lg:col-span-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-emerald-600 hover:bg-emerald-500 px-8 py-2 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : 'Register Customer'}
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
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {localLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-indigo-400" size={28} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(c => (
                            <div key={c.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 hover:border-slate-500 transition-all">
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
                        {filtered.length === 0 && (
                            <div className="col-span-3 text-center py-10 text-slate-500 italic">No customers found.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// MAIN EXPORT
// ==========================================
export default function PlatformAdminStoreProxy({ store, onExit }: PlatformAdminStoreProxyProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'dropoff' | 'pickup' | 'racks' | 'tickets' | 'customers'>('overview');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [printContent, setPrintContent] = useState('');
    const [plantHtmlState, setPlantHtmlState] = useState('');
    const [customerPlantHtmlState, setCustomerPlantHtmlState] = useState('');
    const [tagHtmlState, setTagHtmlState] = useState('');

    const centerReceiptItems = (html: string) => html
        .replace(/display:flex; justify-content:space-between; align-items:flex-start;/g, 'display:flex; flex-direction:column; align-items:center; justify-content:center;')
        .replace(/text-align:left;/g, 'text-align:center;')
        .replace(/text-align: right;/g, 'text-align:center;')
        .replace(/padding-left:0px;/g, 'padding-left:0px; text-align:center;');

    const openPrintPreview = async (detail: any) => {
        try {
            const orgAddress = await getOrgAddress();
            const customerHtml = centerReceiptItems(renderReceiptHtml(detail, undefined, orgAddress));
            const plantHtml = centerReceiptItems(renderPlantReceiptHtml(detail, undefined, orgAddress));
            const customerPlantHtml = centerReceiptItems(renderCustomerPlantReceiptHtml(detail, undefined, orgAddress));
            const tagHtml = generateTagHtml(detail);

            const combinedAll = `\n  <div class="page-break-receipt">${customerHtml}</div>\n  <div class="page-break-receipt">${plantHtml}</div>\n  <div class="page-break-receipt">${customerPlantHtml}</div>\n`;
            try { handlePrintJob(combinedAll); } catch {}

            setPrintContent(customerHtml);
            setPlantHtmlState(plantHtml);
            setCustomerPlantHtmlState(customerPlantHtml);
            setTagHtmlState(tagHtml);
            setShowPrintPreview(true);
        } catch (e) {
            console.error('Failed to open print preview', e);
        }
    };

    const getHeaders = () => {
        const token = localStorage.getItem('platformAdminToken');
        return { Authorization: `Bearer ${token}` };
    };

    const getProxyUrl = (resource: string) => {
        const sep = resource.includes('?') ? '&' : '?';
        return `${baseURL}/platform-admin/proxy/${resource}${sep}target_org_id=${store.id}`;
    };

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3000);
    };

    const tabProps: TabProps = { store, getHeaders, getProxyUrl, setError, showSuccess, openPrintPreview };

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab {...tabProps} />;
            case 'dropoff': return <DropOffTab {...tabProps} />;
            case 'pickup': return <PickUpTab {...tabProps} />;
            case 'racks': return <RacksTab {...tabProps} />;
            case 'tickets': return <TicketsTab {...tabProps} />;
            case 'customers': return <CustomersTab {...tabProps} />;
        }
    };

    const NAV = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'dropoff', label: 'Drop Off', icon: Package },
        { id: 'pickup', label: 'Pick Up', icon: Clock },
        { id: 'racks', label: 'Rack Manager', icon: MapPin },
        { id: 'tickets', label: 'Orders', icon: FileText },
        { id: 'customers', label: 'Customers', icon: Users },
    ];

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
                <button
                    onClick={onExit}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/20 active:scale-95"
                >
                    <X size={16} className="inline mr-2" /> Exit Session
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* SIDEBAR */}
                <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 space-y-2">
                    {NAV.map(item => (
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
                    {/* FEEDBACK */}
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

                    <PrintPreviewModal
                        isOpen={showPrintPreview}
                        onClose={() => setShowPrintPreview(false)}
                        content={printContent}
                        extraActions={(
                            <div className="flex gap-2">
                                <button onClick={() => { handlePrintJob(printContent); }} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Print Receipt</button>
                                <button onClick={() => { handlePrintJob(plantHtmlState); }} className="px-3 py-2 bg-slate-800 text-white rounded-lg">Print Plant</button>
                            </div>
                        )}
                    />

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