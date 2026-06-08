import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
    X, Plus, Trash2, Loader2, Search, Shirt, PenTool,
    Calculator, DollarSign, List, Save, ChevronDown, ChevronUp
} from 'lucide-react';
import baseURL from '../lib/config';

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────
interface AlterationType {
    id: number;
    name: string;
    price: number;
}

interface ClothingType {
    id: number;
    name: string;
    plant_price: number;
    margin: number;
    total_price: number;
    pieces: number;
    image_url?: string;
    category?: string;
}

export interface EditItem {
    // identity
    clothing_type_id: number | null;
    clothing_name: string;
    is_custom: boolean;

    // quantity
    quantity: number;

    // pricing
    plant_price: number;
    margin: number;
    item_total: number;

    // options
    starch_level: string;
    starch_charge: number;
    clothing_size: string;
    size_charge: number;
    crease: string;

    // charges
    additional_charge: number;
    instruction_charge: number;

    // alteration
    alteration_behavior: string;
    alteration_id: number | null;
    alteration_name: string | null;
    alteration_price: number;

    // notes
    alterations: string;
    item_instructions: string;
}

interface OrgSettings {
    starch_price_light?: number;
    starch_price_medium?: number;
    starch_price_heavy?: number;
    starch_price_extra_heavy?: number;
    size_price_s?: number;
    size_price_m?: number;
    size_price_l?: number;
    size_price_xl?: number;
    size_price_xxl?: number;
}

interface Ticket {
    id: number;
    ticket_number: string;
    customer_name: string;
    customer_phone?: string;
    special_instructions?: string;
    pickup_date?: string;
    paid_amount?: number;
    total_amount: number;
    status: string;
    items?: any[];
}

interface Props {
    ticket: Ticket;
    colors: { primaryColor: string; secondaryColor: string; brandColor?: string };
    onClose: () => void;
    onSaved: () => void;
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function blankItem(ct?: ClothingType): EditItem {
    return {
        clothing_type_id: ct?.id ?? null,
        clothing_name: ct?.name ?? 'Custom Item',
        is_custom: !ct,
        quantity: 1,
        plant_price: ct?.plant_price ?? 0,
        margin: ct?.margin ?? 0,
        item_total: ct ? ct.plant_price + ct.margin : 0,
        starch_level: 'no_starch',
        starch_charge: 0,
        clothing_size: 'none',
        size_charge: 0,
        crease: 'no_crease',
        additional_charge: 0,
        instruction_charge: 0,
        alteration_behavior: 'none',
        alteration_id: null,
        alteration_name: null,
        alteration_price: 0,
        alterations: '',
        item_instructions: '',
    };
}

const authHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}` };
};

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────

/** Collapsible alteration picker */
const AlterationPanel: React.FC<{
    alterationTypes: AlterationType[];
    activeAlt: AlterationType | null;
    altPrice: number;
    onSelect: (a: AlterationType) => void;
    onClear: () => void;
}> = ({ alterationTypes, activeAlt, altPrice, onSelect, onClear }) => {
    const [open, setOpen] = useState(false);
    if (!alterationTypes.length) return null;
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Alterations</span>
                    {activeAlt
                        ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700">✓ {activeAlt.name}</span>
                        : <span className="text-[9px] text-gray-400 italic">None selected</span>}
                </div>
                <div className="flex items-center gap-2">
                    {altPrice > 0 && <span className="text-[10px] font-bold text-purple-600">+${altPrice.toFixed(2)}</span>}
                    {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </div>
            </button>
            {open && (
                <div className="px-3 pb-3 border-t border-gray-100">
                    <div className="mt-2 flex flex-col gap-1 max-h-[90px] overflow-y-auto">
                        {alterationTypes.map(alt => {
                            const isActive = activeAlt?.id === alt.id;
                            return (
                                <button
                                    key={alt.id}
                                    type="button"
                                    onClick={() => { onSelect(alt); setOpen(false); }}
                                    className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg border text-left text-xs font-medium transition-all"
                                    style={isActive
                                        ? { backgroundColor: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }
                                        : { backgroundColor: '#faf5ff', color: '#6d28d9', borderColor: '#e9d5ff' }}
                                >
                                    <span>{alt.name}</span>
                                    <span className="text-[10px] font-bold opacity-80">+${Number(alt.price).toFixed(2)}</span>
                                </button>
                            );
                        })}
                    </div>
                    {activeAlt && (
                        <button
                            type="button"
                            onClick={() => { onClear(); setOpen(false); }}
                            className="mt-2 w-full py-1.5 text-[10px] font-semibold text-red-500 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            ✕ Clear Alteration
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

/** +/− upcharge buttons */
const UpchargeSelector: React.FC<{
    currentCharge: number;
    onUpdate: (v: number) => void;
}> = ({ currentCharge, onUpdate }) => (
    <div className="flex flex-col mt-2 pt-2 border-t border-gray-100">
        <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Price Adj:{' '}
                <span className={currentCharge > 0 ? 'text-green-600' : currentCharge < 0 ? 'text-red-600' : 'text-gray-400'}>
                    {currentCharge > 0 ? '+' : ''}{currentCharge.toFixed(2)}
                </span>
            </span>
            {currentCharge !== 0 && (
                <button onClick={() => onUpdate(0)} className="text-[10px] text-gray-400 hover:text-red-600 underline">Reset</button>
            )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1 bg-green-50 p-1 rounded">
                {[0.10, 0.50, 1.00, 5.00].map(inc => (
                    <button
                        key={`p${inc}`}
                        type="button"
                        onClick={() => onUpdate(Math.round((currentCharge + inc) * 100) / 100)}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-white border border-green-200 text-green-700 hover:bg-green-100"
                    >
                        +${inc.toFixed(2)}
                    </button>
                ))}
            </div>
            <div className="flex gap-1 bg-red-50 p-1 rounded">
                {[0.10, 0.50, 1.00, 5.00].map(inc => (
                    <button
                        key={`m${inc}`}
                        type="button"
                        onClick={() => onUpdate(Math.round((currentCharge - inc) * 100) / 100)}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-white border border-red-200 text-red-700 hover:bg-red-100"
                    >
                        −${inc.toFixed(2)}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

/** Clothing grid (same as DropOff) */
const ClothingGrid: React.FC<{
    clothingTypes: ClothingType[];
    onAdd: (id: number) => void;
    onAddCustom: () => void;
    colors: { primaryColor: string; secondaryColor: string };
}> = ({ clothingTypes, onAdd, onAddCustom, colors }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
        {clothingTypes.map(type => (
            <button
                key={type.id}
                onClick={() => onAdd(type.id)}
                className="flex flex-col items-center justify-start p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 transition-all h-24 text-xs active:scale-[0.98]"
            >
                {type.image_url
                    ? <img src={type.image_url} alt={type.name} className="w-full h-8 object-contain rounded mb-0.5" onError={e => (e.currentTarget.style.display = 'none')} />
                    : <div className="w-full h-8 flex items-center justify-center bg-gray-100 rounded mb-0.5"><Shirt className="w-4 h-4 text-gray-400" /></div>}
                <span className="text-xs font-semibold text-center mt-0.5 line-clamp-2 w-full px-0.5 leading-tight">{type.name}</span>
                <span className="text-xs font-bold mt-auto" style={{ color: colors.primaryColor }}>${(type.total_price || type.plant_price + type.margin).toFixed(2)}</span>
            </button>
        ))}
        <button
            onClick={onAddCustom}
            className="flex flex-col items-center justify-center p-1.5 rounded-lg h-24 text-xs active:scale-[0.98] hover:shadow-md transition-all"
            style={{ backgroundColor: `${colors.secondaryColor}12`, border: `2px dashed ${colors.secondaryColor}44`, color: colors.secondaryColor }}
        >
            <div className="w-8 h-8 flex items-center justify-center rounded-full mb-1" style={{ backgroundColor: `${colors.secondaryColor}22` }}>
                <PenTool className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">Custom</span>
        </button>
    </div>
);

// ─────────────────────────────────────────────
//  Main Modal
// ─────────────────────────────────────────────
export default function TicketEditModal({ ticket, colors, onClose, onSaved }: Props) {
    // ── data ──
    const [clothingTypes, setClothingTypes] = useState<ClothingType[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [alterationTypes, setAlterationTypes] = useState<AlterationType[]>([]);
    const [starchPrices, setStarchPrices] = useState({ no_starch: 0, light: 0, medium: 0, heavy: 0, extra_heavy: 0 });
    const [sizePrices, setSizePrices] = useState<Record<string, number>>({ none: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0 });

    // ── ticket fields ──
    const [items, setItems] = useState<EditItem[]>([]);
    const [specialInstructions, setSpecialInstructions] = useState(ticket.special_instructions ?? '');
    const [pickupDate, setPickupDate] = useState(
        ticket.pickup_date ? new Date(ticket.pickup_date).toISOString().substring(0, 16) : new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 16)
    );
    const [paidAmount, setPaidAmount] = useState(String(ticket.paid_amount ?? 0));
    const [tenderedAmount, setTenderedAmount] = useState('');

    // ── UI state ──
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);          // initial fetch
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customForm, setCustomForm] = useState({ name: '', price: '', margin: '' });
    const [step, setStep] = useState<'items' | 'review'>('items');

    // ─────────────────────────────────────────────
    //  Initial data fetch
    // ─────────────────────────────────────────────
    useEffect(() => {
        Promise.all([
            fetchClothingTypes(),
            fetchAlterationTypes(),
            fetchOrgSettings(),
        ]).then(() => setLoading(false)).catch(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Once clothing types are loaded, map existing ticket items
    useEffect(() => {
        if (clothingTypes.length === 0 && !loading) return;
        if (ticket.items && ticket.items.length > 0) {
            const mapped: EditItem[] = ticket.items.map((i: any) => ({
                clothing_type_id: i.clothing_type_id ?? null,
                clothing_name: i.clothing_name || i.custom_name || 'Custom Item',
                is_custom: i.clothing_type_id == null,
                quantity: i.quantity || 1,
                plant_price: Number(i.plant_price) || 0,
                margin: Number(i.margin) || 0,
                item_total: Number(i.item_total) || 0,
                starch_level: i.starch_level || 'no_starch',
                starch_charge: Number(i.starch_charge) || 0,
                clothing_size: i.clothing_size || 'none',
                size_charge: Number(i.size_charge) || 0,
                crease: i.crease === true || i.crease === 'crease' ? 'crease' : 'no_crease',
                additional_charge: Number(i.additional_charge) || 0,
                instruction_charge: Number(i.instruction_charge) || 0,
                alteration_behavior: i.alteration_behavior || 'none',
                alteration_id: i.alteration_id ?? null,
                alteration_name: i.alteration_name ?? null,
                alteration_price: Number(i.alteration_price) || 0,
                alterations: i.alterations || '',
                item_instructions: i.item_instructions || '',
            }));
            setItems(mapped);
            if (mapped.length > 0) setSelectedIdx(0);
        }
        // Only run once clothing types & alteration types finish loading
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clothingTypes, alterationTypes]);

    const fetchClothingTypes = async () => {
        const res = await axios.get(`${baseURL}/api/organizations/clothing-types`, { headers: authHeaders() });
        if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
            const flat = Object.values(res.data).flat() as ClothingType[];
            setClothingTypes(flat);
            setCategories(Object.keys(res.data).sort());
        } else if (Array.isArray(res.data)) {
            setClothingTypes(res.data);
        }
    };

    const fetchAlterationTypes = async () => {
        const res = await axios.get(`${baseURL}/api/organizations/alteration-types`, { headers: authHeaders() });
        if (Array.isArray(res.data)) setAlterationTypes(res.data);
    };

    const fetchOrgSettings = async () => {
        try {
            const res = await axios.get(`${baseURL}/api/settings`, { headers: authHeaders() });
            if (res.data) {
                setStarchPrices({
                    no_starch: 0,
                    light: parseFloat(res.data.starch_price_light) || 0,
                    medium: parseFloat(res.data.starch_price_medium) || 0,
                    heavy: parseFloat(res.data.starch_price_heavy) || 0,
                    extra_heavy: parseFloat(res.data.starch_price_extra_heavy) || 0,
                });
                setSizePrices({
                    none: 0,
                    s: parseFloat(res.data.size_price_s) || 0,
                    m: parseFloat(res.data.size_price_m) || 0,
                    l: parseFloat(res.data.size_price_l) || 0,
                    xl: parseFloat(res.data.size_price_xl) || 0,
                    xxl: parseFloat(res.data.size_price_xxl) || 0,
                });
            }
        } catch { /* use defaults */ }
    };

    // ─────────────────────────────────────────────
    //  Filtered clothing types
    // ─────────────────────────────────────────────
    const filteredTypes = useMemo(() => {
        let list = clothingTypes.filter(t => t && t.name);
        if (selectedCategory !== 'All') list = list.filter(t => t.category === selectedCategory);
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(t => t.name.toLowerCase().includes(q));
        }
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [clothingTypes, selectedCategory, searchTerm]);

    // ─────────────────────────────────────────────
    //  Core item updater — mirrors DropOff.updateItem exactly
    // ─────────────────────────────────────────────
    const updateItem = useCallback((idx: number, patch: Partial<EditItem>) => {
        setItems(prev => {
            const next = [...prev];
            const item = { ...next[idx], ...patch };

            const isAltOnly = item.alteration_behavior === 'alteration_only';
            const qty = item.quantity || 0;

            // 1. Starch
            const starchKey = item.starch_level as keyof typeof starchPrices;
            item.starch_charge = isAltOnly ? 0 : (starchPrices[starchKey] || 0) * qty;

            // 2. Size
            const sizeKey = item.clothing_size || 'none';
            item.size_charge = (isAltOnly || sizeKey === 'none') ? 0 : (sizePrices[sizeKey] || 0) * qty;

            // 3. Base price
            let basePrice = 0;
            if (item.is_custom) {
                basePrice = isAltOnly ? 0 : (item.plant_price + item.margin);
            } else {
                const ct = clothingTypes.find(c => c.id === item.clothing_type_id);
                if (ct) {
                    basePrice = isAltOnly ? 0 : ct.total_price;
                    if (!patch.plant_price) item.plant_price = ct.plant_price;
                    if (!patch.margin) item.margin = ct.margin;
                }
            }

            // 4. Clamp discount
            const rawAlt = item.additional_charge || 0;
            const baseValue = (basePrice * qty) + item.instruction_charge + item.starch_charge + item.size_charge + (item.alteration_price || 0);
            item.additional_charge = Math.max(rawAlt, -baseValue);

            // 5. Final total
            if (isAltOnly) {
                item.item_total = Math.max(0, item.additional_charge + (item.alteration_price || 0));
            } else {
                item.item_total = Math.max(0,
                    basePrice * qty
                    + item.additional_charge
                    + item.instruction_charge
                    + item.starch_charge
                    + item.size_charge
                    + (item.alteration_price || 0)
                );
            }

            next[idx] = item;
            return next;
        });
    }, [starchPrices, sizePrices, clothingTypes]);

    // ─────────────────────────────────────────────
    //  Add items
    // ─────────────────────────────────────────────
    const addItemByTypeId = (id: number) => {
        const ct = clothingTypes.find(t => t.id === id);
        if (!ct) return;
        const item = blankItem(ct);
        setItems(prev => {
            const next = [...prev, item];
            setSelectedIdx(next.length - 1);
            return next;
        });
    };

    const handleAddCustom = () => {
        const name = customForm.name.trim() || 'Custom Item';
        const price = parseFloat(customForm.price) || 0;
        const margin = parseFloat(customForm.margin) || 0;
        const item: EditItem = {
            ...blankItem(),
            clothing_type_id: null,
            clothing_name: name,
            is_custom: true,
            plant_price: price,
            margin,
            item_total: price + margin,
        };
        setItems(prev => {
            const next = [...prev, item];
            setSelectedIdx(next.length - 1);
            return next;
        });
        setCustomForm({ name: '', price: '', margin: '' });
        setShowCustomModal(false);
    };

    const removeItem = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setItems(prev => prev.filter((_, i) => i !== idx));
        setSelectedIdx(prev => {
            if (prev === idx) return null;
            if (prev !== null && idx < prev) return prev - 1;
            return prev;
        });
    };

    // ─────────────────────────────────────────────
    //  Totals
    // ─────────────────────────────────────────────
    const totalAmount = useMemo(() => items.reduce((s, i) => s + i.item_total, 0), [items]);
    const finalTotal = totalAmount; // No tax in ticket management (matches backend)

    // ─────────────────────────────────────────────
    //  Save
    // ─────────────────────────────────────────────
    const handleSave = async () => {
        if (items.length === 0) { setError('Ticket must have at least one item.'); return; }

        const mapStarch = (v: string) => {
            if (!v || v === 'no_starch') return 'none';
            if (v === 'extra_heavy') return 'high';
            if (v === 'heavy') return 'high';
            if (v === 'light') return 'low';
            return v; // medium
        };

        setSaving(true);
        setError(null);
        try {
            const payload = {
                special_instructions: specialInstructions || null,
                pickup_date: pickupDate ? new Date(pickupDate).toISOString() : null,
                paid_amount: parseFloat(paidAmount) || 0,
                items: items.map(i => ({
                    clothing_type_id: i.is_custom ? null : i.clothing_type_id,
                    custom_name: i.is_custom ? i.clothing_name : null,
                    quantity: i.quantity,
                    unit_price: i.plant_price,
                    margin: i.margin,
                    starch_level: mapStarch(i.starch_level),
                    starch_charge: i.starch_charge,
                    clothing_size: i.clothing_size || 'none',
                    size_charge: i.size_charge,
                    crease: i.crease === 'crease',
                    alterations: i.alterations || null,
                    item_instructions: i.item_instructions || null,
                    additional_charge: i.additional_charge,
                    instruction_charge: i.instruction_charge,
                    alteration_behavior: i.alteration_behavior,
                    item_total: i.item_total,
                    alteration_id: i.alteration_id || null,
                    alteration_name: i.alteration_name || null,
                    alteration_price: i.alteration_price || 0,
                })),
            };

            await axios.put(
                `${baseURL}/api/organizations/tickets/${ticket.id}/full-edit`,
                payload,
                { headers: authHeaders() }
            );

            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to save ticket.');
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────────
    //  Render helpers for selected item panel
    // ─────────────────────────────────────────────
    const sel = selectedIdx !== null ? items[selectedIdx] : null;

    // ─────────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 overflow-hidden">
            <div className="relative flex flex-col w-full max-w-[1400px] m-2 bg-gray-100 rounded-2xl shadow-2xl overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">
                            Edit Ticket <span style={{ color: colors.primaryColor }}>#{ticket.ticket_number}</span>
                        </h2>
                        <p className="text-xs text-gray-500">{ticket.customer_name}</p>
                    </div>

                    {/* Step tabs */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setStep('items')}
                            className="px-4 py-1.5 rounded-md text-xs font-bold transition-all"
                            style={step === 'items' ? { backgroundColor: colors.primaryColor, color: '#fff' } : { color: '#6b7280' }}
                        >
                            1 · Items
                        </button>
                        <button
                            onClick={() => items.length > 0 && setStep('review')}
                            className="px-4 py-1.5 rounded-md text-xs font-bold transition-all disabled:opacity-40"
                            style={step === 'review' ? { backgroundColor: colors.primaryColor, color: '#fff' } : { color: '#6b7280' }}
                            disabled={items.length === 0}
                        >
                            2 · Review & Save
                        </button>
                    </div>

                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* ── Error banner ── */}
                {error && (
                    <div className="mx-4 mt-2 flex-shrink-0 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 flex justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)}><X size={14} /></button>
                    </div>
                )}

                {/* ── Loading overlay ── */}
                {loading && (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin h-8 w-8" style={{ color: colors.primaryColor }} />
                    </div>
                )}

                {/* ══════════════════════════════════
            STEP 1: ITEMS
        ══════════════════════════════════ */}
                {!loading && step === 'items' && (
                    <div className="flex-1 flex gap-3 p-3 overflow-hidden min-h-0">

                        {/* LEFT: Edit Panel */}
                        <div className="w-64 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-xs font-bold text-gray-700 mb-2">Edit Selected Item</h3>

                                {sel && selectedIdx !== null ? (
                                    <div className="space-y-2">
                                        {/* Item name badge */}
                                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 truncate">{sel.clothing_name}</p>
                                                <p className="text-[10px] text-gray-400">Total: ${sel.item_total.toFixed(2)}</p>
                                            </div>
                                            <button onClick={(e) => removeItem(selectedIdx, e)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        {/* Service mode */}
                                        <div
                                            className="p-2 rounded-lg border text-sm"
                                            style={sel.alteration_behavior === 'alteration_only'
                                                ? { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' }
                                                : { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}
                                        >
                                            <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Service Mode</div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newBehavior = sel.alteration_behavior === 'alteration_only' ? 'none' : 'alteration_only';
                                                    updateItem(selectedIdx, {
                                                        alteration_behavior: newBehavior,
                                                        starch_level: newBehavior === 'alteration_only' ? 'no_starch' : sel.starch_level,
                                                        clothing_size: newBehavior === 'alteration_only' ? 'none' : sel.clothing_size,
                                                        crease: newBehavior === 'alteration_only' ? 'no_crease' : sel.crease,
                                                    });
                                                }}
                                                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border-2 font-bold text-xs transition-all"
                                                style={sel.alteration_behavior === 'alteration_only'
                                                    ? { backgroundColor: '#7c3aed', borderColor: '#7c3aed', color: '#fff' }
                                                    : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#6b7280' }}
                                            >
                                                <div className={`w-3 h-3 rounded border flex items-center justify-center ${sel.alteration_behavior === 'alteration_only' ? 'bg-white border-white' : 'border-gray-300'}`}>
                                                    {sel.alteration_behavior === 'alteration_only' && <div className="w-1.5 h-1.5 bg-purple-600 rounded-sm" />}
                                                </div>
                                                Alteration Only
                                            </button>
                                        </div>

                                        {/* Starch */}
                                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Starch</span>
                                                {sel.starch_charge > 0 && <span className="text-[9px] font-bold" style={{ color: colors.primaryColor }}>+${sel.starch_charge.toFixed(2)}</span>}
                                            </div>
                                            <div className={`grid grid-cols-5 gap-0.5 ${sel.alteration_behavior === 'alteration_only' ? 'opacity-40 pointer-events-none' : ''}`}>
                                                {(['no_starch', 'light', 'medium', 'heavy', 'extra_heavy'] as const).map(key => {
                                                    const labels: Record<string, string> = { no_starch: 'None', light: 'Light', medium: 'Med', heavy: 'Heavy', extra_heavy: 'Ex.Hv' };
                                                    const isActive = sel.starch_level === key;
                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={() => updateItem(selectedIdx, { starch_level: key })}
                                                            className="px-0.5 py-1 text-[8px] font-bold uppercase rounded border transition-all"
                                                            style={isActive ? { backgroundColor: colors.primaryColor, color: '#fff', borderColor: colors.primaryColor } : {}}
                                                        >
                                                            {labels[key]}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Alterations */}
                                        <AlterationPanel
                                            alterationTypes={alterationTypes}
                                            activeAlt={sel.alteration_id ? (alterationTypes.find(a => a.id === sel.alteration_id) ?? null) : null}
                                            altPrice={sel.alteration_price || 0}
                                            onSelect={alt => updateItem(selectedIdx, { alteration_id: alt.id, alteration_name: alt.name, alteration_price: alt.price })}
                                            onClear={() => updateItem(selectedIdx, { alteration_id: null, alteration_name: null, alteration_price: 0 })}
                                        />

                                        {/* Size */}
                                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Size</span>
                                                {sel.size_charge > 0 && <span className="text-[9px] font-bold" style={{ color: colors.secondaryColor }}>+${sel.size_charge.toFixed(2)}</span>}
                                            </div>
                                            <div className={`grid grid-cols-6 gap-0.5 ${sel.alteration_behavior === 'alteration_only' ? 'opacity-40 pointer-events-none' : ''}`}>
                                                {['none', 's', 'm', 'l', 'xl', 'xxl'].map(key => {
                                                    const isActive = (sel.clothing_size || 'none') === key;
                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={() => updateItem(selectedIdx, { clothing_size: key })}
                                                            className="px-0.5 py-1 text-[8px] font-bold uppercase rounded border transition-all"
                                                            style={isActive ? { backgroundColor: colors.secondaryColor, color: '#fff', borderColor: colors.secondaryColor } : {}}
                                                        >
                                                            {key === 'none' ? 'Std' : key.toUpperCase()}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Qty & Crease */}
                                        <div className="bg-white p-2 rounded-lg border border-gray-200 flex items-center gap-3">
                                            <div className="flex-1">
                                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Qty</label>
                                                <input
                                                    type="number" min="1"
                                                    value={sel.quantity}
                                                    onChange={e => updateItem(selectedIdx, { quantity: parseInt(e.target.value) || 1 })}
                                                    className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs font-bold"
                                                />
                                            </div>
                                            <label className="flex items-center gap-1 cursor-pointer flex-shrink-0 mt-3">
                                                <input
                                                    type="checkbox"
                                                    checked={sel.crease === 'crease' && sel.alteration_behavior !== 'alteration_only'}
                                                    disabled={sel.alteration_behavior === 'alteration_only'}
                                                    onChange={e => updateItem(selectedIdx, { crease: e.target.checked ? 'crease' : 'no_crease' })}
                                                    className="rounded w-4 h-4 disabled:opacity-30"
                                                    style={{ accentColor: colors.primaryColor }}
                                                />
                                                <span className="text-[9px] text-gray-600">Crease</span>
                                            </label>
                                        </div>

                                        {/* Price adjustment */}
                                        <UpchargeSelector
                                            currentCharge={sel.additional_charge || 0}
                                            onUpdate={v => updateItem(selectedIdx, { additional_charge: v })}
                                        />

                                        {/* Notes */}
                                        <div className="bg-white p-2 rounded-lg border border-gray-200 space-y-2">
                                            <div>
                                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Item Notes</label>
                                                <input
                                                    type="text"
                                                    value={sel.item_instructions}
                                                    onChange={e => updateItem(selectedIdx, { item_instructions: e.target.value })}
                                                    placeholder="e.g. Handle with care"
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Alteration Notes</label>
                                                <input
                                                    type="text"
                                                    value={sel.alterations}
                                                    onChange={e => updateItem(selectedIdx, { alterations: e.target.value })}
                                                    placeholder="e.g. Hem trousers"
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-xs">
                                        <Shirt size={28} className="mx-auto mb-2 opacity-20" />
                                        Select an item to edit
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CENTER: Clothing grid */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Search + Categories */}
                            <div className="mb-2 flex-shrink-0">
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1"
                                        style={{ '--tw-ring-color': colors.primaryColor } as any}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {['All', ...categories].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className="px-2 py-1 rounded-full text-[10px] font-bold border transition-all"
                                            style={selectedCategory === cat
                                                ? { backgroundColor: colors.primaryColor, color: '#fff', borderColor: colors.primaryColor }
                                                : { backgroundColor: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}
                                        >
                                            {cat === 'All' ? 'All Items' : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="flex-1 overflow-y-auto">
                                <ClothingGrid
                                    clothingTypes={filteredTypes}
                                    onAdd={addItemByTypeId}
                                    onAddCustom={() => setShowCustomModal(true)}
                                    colors={colors}
                                />
                            </div>
                        </div>

                        {/* RIGHT: Item list */}
                        <div className="w-56 flex-shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between flex-shrink-0">
                                <span className="text-xs font-bold text-gray-700">Items ({items.length})</span>
                                <span className="text-xs font-bold text-gray-700">${totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                                {items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedIdx(idx)}
                                        className="p-2 border rounded-lg cursor-pointer transition-all relative"
                                        style={selectedIdx === idx
                                            ? { borderColor: colors.primaryColor, backgroundColor: `${colors.primaryColor}10`, boxShadow: `0 0 0 1px ${colors.primaryColor}` }
                                            : item.additional_charge > 0 ? { borderColor: '#22c55e', backgroundColor: '#f0fdf4' }
                                                : item.additional_charge < 0 ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' }
                                                    : {}}
                                    >
                                        {item.additional_charge > 0 && <span className="absolute -top-1.5 -right-1.5 text-[7px] font-black bg-green-500 text-white px-1 py-0.5 rounded">UP</span>}
                                        {item.additional_charge < 0 && <span className="absolute -top-1.5 -right-1.5 text-[7px] font-black bg-red-500 text-white px-1 py-0.5 rounded">DISC</span>}
                                        <div className="flex items-start justify-between gap-1">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-bold text-gray-900 truncate flex items-center gap-1">
                                                    {item.alteration_behavior === 'alteration_only' && (
                                                        <span className="text-[7px] font-black bg-black text-white px-1 py-0.5 rounded leading-none flex-shrink-0">ALT</span>
                                                    )}
                                                    {item.clothing_name}
                                                </p>
                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                    <span className="text-[8px] bg-gray-100 text-gray-600 px-1 rounded font-bold">×{item.quantity}</span>
                                                    {item.starch_level !== 'no_starch' && <span className="text-[8px] text-blue-600 font-bold">ST</span>}
                                                    {item.clothing_size !== 'none' && <span className="text-[8px] text-amber-600 font-bold">{item.clothing_size.toUpperCase()}</span>}
                                                    {item.crease === 'crease' && <span className="text-[8px] text-emerald-600 font-bold">CR</span>}
                                                    {item.alteration_name && <span className="text-[8px] text-purple-600 font-bold">ALT</span>}
                                                    <span className="text-[9px] font-black text-blue-600 ml-auto">${item.item_total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <button onClick={e => removeItem(idx, e)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {items.length === 0 && (
                                    <div className="text-center py-6 text-gray-400 text-[10px]">
                                        <Shirt size={24} className="mx-auto mb-1 opacity-20" />
                                        No items yet
                                    </div>
                                )}
                            </div>
                            {items.length > 0 && (
                                <div className="p-2 border-t bg-gray-50 flex-shrink-0">
                                    <button
                                        onClick={() => setStep('review')}
                                        className="w-full py-2 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-95 transition-all"
                                        style={{ backgroundColor: colors.secondaryColor }}
                                    >
                                        <List size={14} /> Review & Save
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════
            STEP 2: REVIEW & SAVE
        ══════════════════════════════════ */}
                {!loading && step === 'review' && (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">

                            {/* Items table */}
                            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-gray-600 tracking-wider">Items ({items.length})</span>
                                    <button onClick={() => setStep('items')} className="text-xs font-bold text-blue-600 hover:underline">← Edit Items</button>
                                </div>
                                <div className="overflow-y-auto max-h-[360px]">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-white border-b text-[9px] font-black uppercase text-gray-400">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left">Item</th>
                                                <th className="px-4 py-2.5 text-center">Qty</th>
                                                <th className="px-4 py-2.5 text-right">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2.5">
                                                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                                            {item.alteration_behavior === 'alteration_only' && (
                                                                <span className="text-[8px] font-black bg-black text-white px-1 py-0.5 rounded leading-none">ALT</span>
                                                            )}
                                                            {item.clothing_name}
                                                        </div>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {item.starch_level !== 'no_starch' && <span className="text-[8px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-100">{item.starch_level.replace('_', ' ')}</span>}
                                                            {item.crease === 'crease' && <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-100">Crease</span>}
                                                            {item.clothing_size && item.clothing_size !== 'none' && <span className="text-[8px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-100">Size {item.clothing_size.toUpperCase()}</span>}
                                                            {item.alteration_name && <span className="text-[8px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold border border-purple-100">{item.alteration_name}</span>}
                                                            {item.additional_charge > 0 && <span className="text-[8px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-bold border border-green-200">+${item.additional_charge.toFixed(2)}</span>}
                                                            {item.additional_charge < 0 && <span className="text-[8px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold border border-red-200">${item.additional_charge.toFixed(2)}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center font-bold text-gray-700">{item.quantity}</td>
                                                    <td className="px-4 py-2.5 text-right font-black text-gray-900">${item.item_total.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right: Logistics + totals */}
                            <div className="space-y-4">
                                {/* Ticket settings */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                                    <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-wider pb-1 border-b">Ticket Settings</h4>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">Pickup Date</label>
                                        <input
                                            type="datetime-local"
                                            value={pickupDate}
                                            onChange={e => setPickupDate(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">Special Instructions</label>
                                        <textarea
                                            value={specialInstructions}
                                            onChange={e => setSpecialInstructions(e.target.value)}
                                            placeholder="Any notes..."
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none"
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                {/* Payment calculator */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                                    <div className="flex items-center gap-2 pb-1 border-b">
                                        <Calculator size={14} className="text-gray-500" />
                                        <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Payment</h4>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">Amount Tendered</label>
                                        <div className="relative">
                                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="number" step="0.01" min="0"
                                                value={tenderedAmount}
                                                onChange={e => {
                                                    setTenderedAmount(e.target.value);
                                                    const v = parseFloat(e.target.value) || 0;
                                                    setPaidAmount(String(Math.min(v, finalTotal)));
                                                }}
                                                placeholder="0.00"
                                                className="w-full pl-8 pr-3 py-2 border-2 rounded-xl text-lg font-black focus:outline-none"
                                                style={{ borderColor: `${colors.primaryColor}33` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-gray-50 p-2 rounded border">
                                            <span className="block text-[8px] text-gray-500 uppercase font-bold">Change</span>
                                            <span className="block text-sm font-black" style={(parseFloat(tenderedAmount) || 0) > finalTotal ? { color: colors.secondaryColor } : { color: '#d1d5db' }}>
                                                ${Math.max(0, (parseFloat(tenderedAmount) || 0) - finalTotal).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded border">
                                            <span className="block text-[8px] text-gray-500 uppercase font-bold">Due</span>
                                            <span className={`block text-sm font-black ${(parseFloat(tenderedAmount) || 0) < finalTotal ? 'text-red-600' : 'text-gray-900'}`}>
                                                ${Math.max(0, finalTotal - (parseFloat(tenderedAmount) || 0)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Total & Save */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-bold text-gray-700">New Total</span>
                                        <span className="text-2xl font-black" style={{ color: colors.secondaryColor }}>${finalTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setStep('items')}
                                            className="px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1 py-2.5 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-50 shadow"
                                            style={{ backgroundColor: colors.secondaryColor }}
                                        >
                                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            {saving ? 'Saving…' : 'Save All Changes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Item Modal */}
            {showCustomModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
                        <h3 className="font-bold text-sm mb-4">Add Custom Item</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Item Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={customForm.name}
                                    onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Vintage Scarf"
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Base Price ($)</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={customForm.price}
                                        onChange={e => setCustomForm(f => ({ ...f, price: e.target.value }))}
                                        placeholder="0.00"
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Margin ($)</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={customForm.margin}
                                        onChange={e => setCustomForm(f => ({ ...f, margin: e.target.value }))}
                                        placeholder="0.00"
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="text-right text-xs font-bold text-gray-600">
                                Total: ${((parseFloat(customForm.price) || 0) + (parseFloat(customForm.margin) || 0)).toFixed(2)}
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <button onClick={() => setShowCustomModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                                <button
                                    onClick={handleAddCustom}
                                    disabled={!customForm.name || !customForm.price}
                                    className="px-4 py-2 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                                    style={{ backgroundColor: colors.secondaryColor }}
                                >
                                    Add Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}