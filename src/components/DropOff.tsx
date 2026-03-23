import React, { useState, useEffect, useMemo } from 'react';
import { useColors } from '../state/ColorsContext';
import { useSidebar } from '../state/SidebarContext';
import {
  Plus, Search, Trash2, User, Phone, Calendar, Grid, List, Shirt,
  Image as LucideImage, Mail, Printer, PenTool, Loader2, Settings,
  Calculator, DollarSign, X, Menu
} from 'lucide-react';
import axios from "axios";
import baseURL from "../lib/config";
import { Customer, ClothingType, TicketItem, Ticket } from '../types';
import Modal from './Modal';
import PrintPreviewModal from './PrintPreviewModal';
import renderReceiptHtml from '../lib/receiptTemplate';
import renderPlantReceiptHtml from '../lib/plantReceiptTemplate';
import renderCustomerPlantReceiptHtml from '../lib/customerPlantReceiptTemplate';
// --- IMPORTED TAG GENERATOR ---
import { generateTagHtml } from '../lib/tagTemplates';
import { getOrgAddress } from '../lib/getOrgAddress';

// --- NEW CENTRAL IMAGE MAP FOR CORRELATION AND BETTER IMAGES ---
const CLOTHING_IMAGE_MAP: { [key: string]: string } = {
  // Add your item images here if needed
};
// -------------------------------------------------------------

// --- TYPE EXTENSIONS FOR MERGED LOGIC ---
interface AlterationType {
  id: number;
  name: string;
  price: number;
}

interface ExtendedTicketItem extends TicketItem {
  instruction_charge?: number;
  starch_charge?: number;
  size_charge?: number;
  clothing_size?: string;
  alteration_behavior?: string;
  is_custom?: boolean;
  alteration_id?: number | null;
  alteration_name?: string | null;
  alteration_price?: number;
}

interface TicketWithItems extends Ticket {
  items: Array<ExtendedTicketItem & {
    clothing_name: string;
    starch_level: string;
    clothing_size: string;
    crease: string;
    quantity: number;
  }>;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("No access token found. Please log in again.");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const RECEIPT_STORAGE_KEY = 'receiptConfig';
const VIEW_MODE_STORAGE_KEY = 'dropOffViewMode';

// Floating Sidebar Toggle Button
const SidebarToggleButton: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { colors } = useColors();

  return (
    <button
      onClick={toggleSidebar}
      className="p-1.5 rounded-md hover:bg-gray-200 transition-colors duration-150"
      style={{ color: colors.primaryColor }}
      title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
    >
      {isSidebarOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
    </button>
  );
};

interface AlterationPanelProps {
  alterationTypes: AlterationType[];
  activeAlt: AlterationType | null;
  altPrice: number;
  disabled: boolean;
  onSelect: (alt: AlterationType) => void;
  onClear: () => void;
}

const AlterationPanel: React.FC<AlterationPanelProps> = ({
  alterationTypes, activeAlt, altPrice, disabled, onSelect, onClear
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Alterations</span>
          {activeAlt ? (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
              ✓ {activeAlt.name}
            </span>
          ) : (
            <span className="text-[9px] text-gray-400 italic">None selected</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {altPrice > 0 && (
            <span className="text-[10px] font-bold" style={{ color: '#7c3aed' }}>+${altPrice.toFixed(2)}</span>
          )}
          <span className="text-gray-400 text-[10px]">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <div className="mt-2 flex flex-col gap-1 max-h-[80px] overflow-y-auto custom-scrollbar">
            {alterationTypes.map((alt) => {
              const isActive = activeAlt?.id === alt.id;
              return (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => { onSelect(alt); setOpen(false); }}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg border text-left transition-all text-xs font-medium"
                  style={
                    isActive
                      ? { backgroundColor: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }
                      : { backgroundColor: '#faf5ff', color: '#6d28d9', borderColor: '#e9d5ff' }
                  }
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

// --- HELPER COMPONENT: UPCHARGE BUTTONS ---
interface UpchargeProps {
  currentCharge: number;
  onUpdate: (amount: number) => void;
  disabled?: boolean;
}

const UpchargeSelector = ({ currentCharge, onUpdate, disabled }: UpchargeProps) => {
  const handleAdd = (amount: number) => {
    // if (disabled) return; // Keep it enabled for manual overrides
    const newVal = currentCharge + amount;
    // round to cents
    onUpdate(Math.round(newVal * 100) / 100);
  };

  const increments = [0.10, 0.20, 0.30, 0.50];

  return (
    <div className="flex flex-col mt-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Price Adjustment: <span className={currentCharge >= 0 ? "text-red-600" : "text-green-600"}>
            $ {Math.abs(currentCharge).toFixed(2)}
          </span>
        </span>
        {currentCharge !== 0 && (
          <button
            onClick={() => onUpdate(0)}
            className="text-[10px] text-gray-400 hover:text-red-600 underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* DISCOUNTS (Minus) */}
        <div className="flex gap-1 bg-green-50 p-1 rounded">
          {[0.10, 0.50, 1.00, 5.00].map((inc) => (
            <button
              key={`minus-${inc}`}
              type="button"
              onClick={() => handleAdd(-inc)}
              className="px-2 py-1 text-[10px] font-bold rounded bg-white border border-green-200 text-green-700 hover:bg-green-100"
            >
              ${inc.toFixed(2)}
            </button>
          ))}
        </div>

        {/* EXTRA CHARGES (Plus) */}
        <div className="flex gap-1 bg-red-50 p-1 rounded">
          {[0.10, 0.50, 1.00, 5.00].map((inc) => (
            <button
              key={`plus-${inc}`}
              type="button"
              onClick={() => handleAdd(inc)}
              className="px-2 py-1 text-[10px] font-bold rounded bg-white border border-red-200 text-red-700 hover:bg-red-100"
            >
              ${inc.toFixed(2)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- GRID VIEW COMPONENT ---
interface ClothingGridProps {
  clothingTypes: ClothingType[];
  addItemByTypeId: (clothingTypeId: number) => void;
  onAddCustomItem: () => void;
}

const ClothingGrid: React.FC<ClothingGridProps> = ({ clothingTypes, addItemByTypeId, onAddCustomItem }) => {
  const { colors } = useColors();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-2 p-3 bg-gray-50 rounded-lg">
      {clothingTypes.map((type) => {
        return (
          <button
            key={type.id}
            onClick={() => addItemByTypeId(type.id)}
            className={`
              flex flex-col items-center justify-start 
              p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm 
              hover:shadow-md hover:border-blue-400 
              transition-all duration-200 ease-in-out
              h-24 font-semibold text-xs 
              active:scale-[0.98]
            `}
          >
            {type.image_url ? (
              <img
                src={type.image_url}
                alt={type.name}
                className="w-full h-5 object-contain rounded-lg mb-0.5"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  // Fallback icon logic if needed, but the Shirt icon block below is cleaner as an alternative
                  e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                }}
              />
            ) : (
              <div className="w-full h-5 flex flex-col items-center justify-center bg-gray-100 rounded-lg mb-0.5">
                <Shirt className="w-4 h-4 text-gray-500" />
              </div>
            )}

            {/* Invisible fallback container that shows if image fails */}
            {/* <div className="fallback-icon hidden w-full h-5 flex flex-col items-center justify-center bg-gray-100 rounded-lg mb-0.5 absolute top-2 left-0 right-0 mx-auto">
              <Shirt className="w-4 h-4 text-gray-500" />
            </div> */}
            <span className="text-xs font-semibold text-center mt-0.5 line-clamp-2 w-full px-0.5 leading-tight">{type.name}</span>
            <span className="text-xs font-bold mt-auto" style={{ color: colors.primaryColor }}>${(type.total_price || (type.plant_price + type.margin) || 0).toFixed(2)}</span>
          </button>
        );
      })}

      <button
        onClick={onAddCustomItem}
        className={
          "flex flex-col items-center justify-center p-1.5 rounded-lg shadow-sm transition-all duration-200 ease-in-out h-24 font-semibold text-xs active:scale-[0.98] hover:shadow-md hover:opacity-95"
        }
        style={{ backgroundColor: `${colors.secondaryColor}12`, border: `2px dashed ${colors.secondaryColor}33`, color: colors.secondaryColor }}
      >
        <div className="w-8 h-8 flex items-center justify-center rounded-full mb-1" style={{ backgroundColor: `${colors.secondaryColor}22` }}>
          <PenTool className="w-3.5 h-3.5" style={{ color: colors.secondaryColor }} />
        </div>
        <span className="text-xs font-bold text-center w-full px-0.5">Custom</span>
        <span className="text-[10px] mt-0.5" style={{ color: colors.secondaryColor }}>{'Add'}</span>
      </button>
    </div>
  );
};

// --- MAIN DROPOFF COMPONENT ---
export default function DropOff() {
  const [step, setStep] = useState<'customer' | 'items' | 'review'>('customer');
  const { colors } = useColors();
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '', email: '', address: '' });

  // State for all clothing types (flat array from grouped response)
  const [clothingTypes, setClothingTypes] = useState<ClothingType[]>([]);
  // State for available categories dynamically derived from response
  const [categories, setCategories] = useState<string[]>([]);
  // NEW: State for selected category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  // NEW: State for search term filtering
  const [searchTerm, setSearchTerm] = useState('');

  const [items, setItems] = useState<ExtendedTicketItem[]>([]);
  const [alterationTypes, setAlterationTypes] = useState<AlterationType[]>([]);

  // Track selected item for Quick Starch Panel
  const [selectedTicketIndex, setSelectedTicketIndex] = useState<number | null>(null);

  // STARCH & SIZE PRICES STATE
  const [starchPrices, setStarchPrices] = useState({
    no_starch: 0.00, light: 0.00, medium: 0.00, heavy: 0.00, extra_heavy: 0.00
  });
  const [sizePrices, setSizePrices] = useState<{ [key: string]: number }>({
    s: 0.00, m: 0.00, l: 0.00, xl: 0.00, xxl: 0.00, none: 0.00
  });

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  // NEW: State for the actual cash/amount tendered by user for change calc
  const [tenderedAmount, setTenderedAmount] = useState<string>('');

  const [pickupDate, setPickupDate] = useState<string>(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16));
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState({ isOpen: false, message: '', title: '', type: 'error' as 'error' | 'success' });
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printContent, setPrintContent] = useState('');
  const [plantHtmlState, setPlantHtmlState] = useState('');
  const [customerPlantHtmlState, setCustomerPlantHtmlState] = useState('');
  const [tagHtmlState, setTagHtmlState] = useState('');
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemForm, setCustomItemForm] = useState({ name: '', price: '', margin: '' });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      return (savedMode === 'grid' || savedMode === 'list') ? savedMode : 'grid';
    }
    return 'grid';
  });

  // --- MEMOIZED FILTERING ---
  const filteredClothingTypes = useMemo(() => {
    // Filter out any undefined/null items and ensure they have names
    let validItems = clothingTypes.filter((item) => item && item.name);

    // Apply category filter
    if (selectedCategory !== 'All') {
      validItems = validItems.filter((item) => item.category === selectedCategory);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      validItems = validItems.filter((item) =>
        item.name.toLowerCase().includes(searchLower)
      );
    }

    return validItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [clothingTypes, selectedCategory, searchTerm]);


  useEffect(() => {
    fetchClothingTypes();
    fetchOrganizationSettings();
    fetchAlterationTypes();
  }, []);

  const fetchAlterationTypes = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${baseURL}/api/organizations/alteration-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setAlterationTypes(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch alteration types:", err);
    }
  };

  const fetchOrganizationSettings = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${baseURL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setStarchPrices({
          no_starch: 0.00,
          light: parseFloat(res.data.starch_price_light) || 0.00,
          medium: parseFloat(res.data.starch_price_medium) || 0.00,
          heavy: parseFloat(res.data.starch_price_heavy) || 0.00,
          extra_heavy: parseFloat(res.data.starch_price_extra_heavy) || 0.00
        });
        setSizePrices({
          s: parseFloat(res.data.size_price_s) || 0.00,
          m: parseFloat(res.data.size_price_m) || 0.00,
          l: parseFloat(res.data.size_price_l) || 0.00,
          xl: parseFloat(res.data.size_price_xl) || 0.00,
          xxl: parseFloat(res.data.size_price_xxl) || 0.00
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch organization settings:", err);
      const errorMsg = err.response?.data?.detail || "Failed to load pricing settings. Using defaults.";
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    }
  };

  const fetchClothingTypes = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const url = `${baseURL}/api/organizations/clothing-types`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        // New grouped object format: { "Category": [...items], ... }
        const flatItems = Object.values(response.data).flat() as ClothingType[];
        const categoryList = Object.keys(response.data).sort();

        setClothingTypes(flatItems);
        setCategories(categoryList);
        // Set initial category to 'All'
        setSelectedCategory('All');
        console.log("Fetched clothing types (grouped):", response.data);
      } else if (Array.isArray(response.data)) {
        // Fallback for old array format
        setClothingTypes(response.data);
        setCategories([]);
        setSelectedCategory('All');
      } else {
        setClothingTypes([]);
        setCategories([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch clothing types:', error);
      const errorMsg = error.response?.data?.detail || "Failed to load clothing types. Please refresh the page.";
      setError(errorMsg);
      setModal({
        isOpen: true,
        title: "Load Error",
        message: errorMsg,
        type: "error"
      });
    }
  };

  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Missing authentication details.");

      const response = await axios.get(
        `${baseURL}/api/organizations/customers?search=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error("Failed to search customers:", error);
      setCustomers([]);

      let errorMsg = "Failed to search customers.";
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMsg = "Your session has expired. Please log in again.";
      } else if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      }

      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Missing authentication details.");

      const payload = {
        email: newCustomer.email,
        first_name: newCustomer.first_name,
        last_name: newCustomer.last_name,
        address: newCustomer.address,
        phone: newCustomer.phone,
        password: "1234567890",
      };

      const response = await axios.post(`${baseURL}/api/organizations/register-customers`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSelectedCustomer(response.data);
      setShowNewCustomerForm(false);
      setStep("items");
    } catch (error: any) {
      console.error("Failed to create customer:", error);
      const errorMsg = error.response?.data?.detail || "Failed to create customer. Please check your information and try again.";
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    }
  };

  const resetTicketState = () => {
    setStep('customer');
    setSelectedCustomer(null);
    setItems([]);
    setSelectedTicketIndex(null);
    setSpecialInstructions('');
    setPaidAmount(0);
    setTenderedAmount('');
    setCustomerSearch('');
    setCustomers([]);
    setPickupDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16));
  };

  const handleProceedToReview = () => {
    const missingAlterations = items.filter(
      (item) => item.alteration_behavior === 'alteration_only' && !item.alteration_id
    );

    if (missingAlterations.length > 0) {
      setModal({
        isOpen: true,
        title: 'Missing Alteration Type',
        message: `Please select an alteration type for items: ${missingAlterations.map(i => i.clothing_name).join(', ')}`,
        type: 'error'
      });
      return;
    }
    setStep('review');
  };

  const handleQuickAlterationUpdate = (altType: AlterationType | null) => {
    if (selectedTicketIndex === null) return;
    if (!altType) {
      // Deselect / clear alteration
      updateItem(selectedTicketIndex, {
        alteration_id: null,
        alteration_name: null,
        alteration_price: 0,
      });
    } else {
      const current = items[selectedTicketIndex];
      // Toggle off if same alteration is clicked again
      if (current?.alteration_id === altType.id) {
        updateItem(selectedTicketIndex, {
          alteration_id: null,
          alteration_name: null,
          alteration_price: 0,
        });
      } else {
        updateItem(selectedTicketIndex, {
          alteration_id: altType.id,
          alteration_name: altType.name,
          alteration_price: altType.price,
        });
      }
    }
  };

  const addItem = () => {
    // Grab the first item from the flat array as a default
    const ct = clothingTypes.length > 0 ? clothingTypes[0] : null;

    const newItem = {
      clothing_type_id: ct?.id || 1,
      clothing_name: ct?.name || 'Select Item',
      quantity: 1,
      starch_level: 'no_starch', starch_charge: 0,
      clothing_size: 'none', size_charge: 0,
      crease: 'no_crease', additional_charge: 0, instruction_charge: 0,
      alterations: '', item_instructions: '',
      plant_price: ct?.plant_price || 0, margin: ct?.margin || 0,
      item_total: (ct?.plant_price || 0) + (ct?.margin || 0),
      alteration_behavior: 'none', is_custom: false,
      alteration_id: null, alteration_name: null, alteration_price: 0
    };

    setItems(prev => {
      const newItems = [...prev, newItem];
      setSelectedTicketIndex(newItems.length - 1);
      return newItems;
    });
  };

  const addItemByTypeId = (clothingTypeId: number) => {
    // Find type from flat array
    const ct = clothingTypes.find(t => t.id === clothingTypeId);

    if (!ct) return;

    const newItem = {
      clothing_type_id: ct.id,
      clothing_name: ct.name,
      quantity: 1,
      starch_level: 'no_starch', starch_charge: 0,
      clothing_size: 'none', size_charge: 0,
      crease: 'no_crease', additional_charge: 0, instruction_charge: 0,
      alterations: '', item_instructions: '',
      plant_price: ct.plant_price, margin: ct.margin,
      item_total: ct.plant_price + ct.margin,
      alteration_behavior: 'none', is_custom: false,
      alteration_id: null, alteration_name: null, alteration_price: 0
    };

    setItems(prev => {
      const newItems = [...prev, newItem];
      setSelectedTicketIndex(newItems.length - 1);
      return newItems;
    });
  };

  const handleAddCustomItem = () => {
    const name = customItemForm.name.trim() || 'Custom Item';
    const price = parseFloat(customItemForm.price) || 0;
    const margin = parseFloat(customItemForm.margin) || 0;

    const newItem = {
      clothing_type_id: -1,
      clothing_name: name,
      quantity: 1,
      starch_level: 'no_starch', starch_charge: 0,
      clothing_size: 'none', size_charge: 0,
      crease: 'no_crease', additional_charge: 0, instruction_charge: 0,
      alterations: '', item_instructions: '',
      plant_price: price, margin: margin,
      item_total: price + margin,
      alteration_behavior: 'none', is_custom: true,
      alteration_id: null, alteration_name: null, alteration_price: 0
    };

    setItems(prev => {
      const newItems = [...prev, newItem];
      setSelectedTicketIndex(newItems.length - 1);
      return newItems;
    });

    setCustomItemForm({ name: '', price: '', margin: '' });
    setShowCustomItemModal(false);
  };

  const handleQuickStarchUpdate = (levelKey: string) => {
    if (selectedTicketIndex === null) return;
    updateItem(selectedTicketIndex, { starch_level: levelKey });
  };

  const handleQuickSizeUpdate = (sizeKey: string) => {
    if (selectedTicketIndex === null) return;
    updateItem(selectedTicketIndex, { clothing_size: sizeKey });
  };

  const updateItem = (index: number, updates: any) => {
    const newItems = [...items];
    const oldItem = newItems[index];
    const updatedItem = { ...oldItem, ...updates };
    newItems[index] = updatedItem;

    const isAltOnly = updatedItem.alteration_behavior === 'alteration_only';
    const qty = updatedItem.quantity || 0;

    // 1. Starch Calculation
    const selectedStarch = updatedItem.starch_level as keyof typeof starchPrices;
    const unitStarchPrice = isAltOnly ? 0 : (starchPrices[selectedStarch] || 0);
    updatedItem.starch_charge = unitStarchPrice * qty;

    // 2. Size Calculation
    const selectedSize = (updatedItem.clothing_size || 'none');
    const unitSizePrice = (isAltOnly || selectedSize === 'none') ? 0 : (sizePrices[selectedSize] || 0);
    updatedItem.size_charge = unitSizePrice * qty;

    // 3. Base Price
    const clothingType = clothingTypes.find(ct => ct.id === updatedItem.clothing_type_id);
    let basePrice = 0;

    if (updatedItem.is_custom) {
      basePrice = (updatedItem.plant_price || 0) + (updatedItem.margin || 0);
    } else if (clothingType) {
      basePrice = clothingType.total_price;
      updatedItem.plant_price = clothingType.plant_price;
      updatedItem.margin = clothingType.margin;
    }

    if (isAltOnly) {
      basePrice = 0;
    }

    // 4. Final Total
    const altCharge = updatedItem.additional_charge || 0;
    const instCharge = updatedItem.instruction_charge || 0;
    const starchCharge = updatedItem.starch_charge || 0;
    const sizeCharge = updatedItem.size_charge || 0;
    const alterationCharge = updatedItem.alteration_price || 0;

    const totalBeforeFloor = (basePrice * qty) + altCharge + instCharge + starchCharge + sizeCharge + alterationCharge;
    updatedItem.item_total = Math.max(0, totalBeforeFloor);

    setItems(newItems);
  };

  const removeItem = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    if (selectedTicketIndex === index) setSelectedTicketIndex(null);
    if (selectedTicketIndex !== null && index < selectedTicketIndex) setSelectedTicketIndex(selectedTicketIndex - 1);
  };

  // --- Printing Logic ---
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
              .page-break-receipt { 
                page-break-after: always; 
                break-after: page;
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

  const createTicket = async () => {
    const itemsWithValidQuantity = items.filter(item => item.quantity > 0);
    if (itemsWithValidQuantity.length === 0) {
      setModal({
        isOpen: true,
        title: 'No Items',
        message: 'The ticket must contain at least one item with a quantity greater than zero.',
        type: 'error'
      });
      return;
    }

    const missingAlterations = items.filter(
      (item) => item.alteration_behavior === 'alteration_only' && !item.alteration_id
    );

    if (missingAlterations.length > 0) {
      setModal({
        isOpen: true,
        title: 'Missing Alteration Type',
        message: `Please select an alteration type for items: ${missingAlterations.map(i => i.clothing_name).join(', ')}`,
        type: 'error'
      });
      return;
    }

    try {
      setLoading(true);

      const mapStarchLevel = (val: any) => {
        if (!val) return 'none';
        const s = String(val).toLowerCase();

        if (s === 'no_starch' || s === 'none') return 'none';
        if (s === 'light' || s === 'low') return 'low';
        if (s === 'medium' || s === 'med') return 'medium';
        if (s === 'heavy' || s === 'high') return 'high';
        if (s === 'extra_heavy') return 'high';
        return 'none';
      };

      const ticketData = {
        customer_id: Number(selectedCustomer!.id),
        items: itemsWithValidQuantity.map(item => ({
          clothing_type_id: item.is_custom || item.clothing_type_id === -1 ? null : Number(item.clothing_type_id),
          custom_name: item.is_custom ? item.clothing_name : null,
          unit_price: Number(item.plant_price) || 0.0,
          margin: item.is_custom ? Number(item.margin) : 0.0,

          quantity: Number(item.quantity) || 0,

          starch_level: mapStarchLevel(item.starch_level),
          clothing_size: item.clothing_size || 'm',
          size_charge: item.size_charge || 0.0,

          crease: item.crease === 'crease',

          additional_charge: Number(item.additional_charge) || 0.0,
          instruction_charge: Number(item.instruction_charge) || 0.0,
          starch_charge: Number(item.starch_charge) || 0.0,

          alterations: item.alterations || null,
          item_instructions: item.item_instructions || null,
          alteration_behavior: item.alteration_behavior,

          // --- Per-item alteration ---
          alteration_id: item.alteration_id || null,
          alteration_name: item.alteration_name || null,
          alteration_price: Number(item.alteration_price) || 0.0,
        })),
        special_instructions: specialInstructions,
        pickup_date: pickupDate ? new Date(pickupDate).toISOString() : null,
        paid_amount: Number(paidAmount) || 0.0,
      };

      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication token not found.");

      const response = await axios.post(
        `${baseURL}/api/organizations/tickets`,
        ticketData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newTicket = response.data as TicketWithItems;

      console.log("newticket data:", newTicket);

      if (!newTicket.items || newTicket.items.length === 0) {
        const ticketDetails = await axios.get(`${baseURL}/api/organizations/tickets/${newTicket.id}`, { headers: { Authorization: `Bearer ${token}` } });
        newTicket.items = ticketDetails.data.items || [];
      }

      const customerHtml = renderReceiptHtml(newTicket as any, undefined, await getOrgAddress());
      const plantHtml = renderPlantReceiptHtml(newTicket as any, undefined, await getOrgAddress());
      const customerPlantHtml = renderCustomerPlantReceiptHtml(newTicket as any, undefined, await getOrgAddress());
      // ✅ Use imported generator
      const tagHtml = generateTagHtml(newTicket);

      // build a combined document containing all three receipts in the order
      // normal -> plant -> customer/plant so that the printer can spit them out
      // back-to-back with page breaks between each copy.
      const combinedAll = `
        <div class="page-break-receipt">${customerHtml}</div>
        <div class="page-break-receipt">${plantHtml}</div>
        <div class="page-break-receipt">${customerPlantHtml}</div>
      `;

      // automatically kick off a print job as soon as the ticket is created
      // (user will still see the preview and can re‑print if needed)
      handlePrintJob(combinedAll);

      // store the individual pieces for the preview modal (tags not shown here)
      setPrintContent(customerHtml);
      setPlantHtmlState(plantHtml);
      setCustomerPlantHtmlState(customerPlantHtml);
      setTagHtmlState(tagHtml);

      setShowPrintPreview(true);
      setModal({ isOpen: true, title: 'Ticket Created', type: 'success', message: 'Ticket created successfully.' });
      setLoading(false);

      resetTicketState();

    } catch (error: any) {
      setLoading(false);
      console.error('Failed to create ticket:', error);

      let errorMessage = 'Failed to create ticket. Please try again.';
      if (error.response && error.response.data) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => `${err.loc[1]}: ${err.msg}`).join('. ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setModal({ isOpen: true, title: 'Error', message: errorMessage, type: 'error' });
    }
  };

  const { totalAmount, envCharge, tax, finalTotal } = useMemo(() => {
    const sum = items.reduce((subtotal, item) => subtotal + item.item_total, 0);
    const env = sum * 0.047;
    const t = sum * 0.0825;
    const final = sum + env + t;
    return { totalAmount: sum, envCharge: env, tax: t, finalTotal: final };
  }, [items]);

  const handlePrintAll = () => {
    // include normal receipt, plant copy, and customer/plant copy
    const combinedHtml = `
      <div class="page-break-receipt">${printContent}</div>
      <div class="page-break-receipt">${plantHtmlState}</div>
      <div class="page-break-receipt">${customerPlantHtmlState}</div>
    `;
    handlePrintJob(combinedHtml);
    // keep preview open so user can choose another option
  }

  const handlePrintCustomer = () => {
    handlePrintJob(printContent);
    // preview remains open
  }

  const handlePrintPlant = () => {
    handlePrintJob(plantHtmlState);
    // preview remains open
  }

  const handlePrintTags = () => {
    handlePrintJob(tagHtmlState);
    // preview remains open
  }

  return (
    <div className="w-full max-w-full mx-auto px-3 py-1 bg-gray-100 font-sans flex flex-col relative" style={{ minHeight: '100vh' }}>
      {/* ERROR BANNER */}
      {error && (
        <div className="mb-1 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-red-800 text-xs font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            {/* <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg> */}
          </button>
        </div>
      )}

      {/* HEADER & TITLE */}
      <div className="mb-1.5">
        <div className="flex items-center gap-2">
          <SidebarToggleButton />
          <h2 className="text-lg font-bold text-gray-900">Drop Off Clothes</h2>
        </div>

        <div className="flex items-center mt-0.5 space-x-2">
          <div className={`flex items-center ${step === 'customer' ? '' : 'text-gray-400'}`} style={step === 'customer' ? { color: colors.primaryColor } : undefined}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${step === 'customer' ? '' : 'bg-gray-100'}`} style={step === 'customer' ? { backgroundColor: `${colors.primaryColor}12`, color: colors.primaryColor } : undefined}>1</div>
            <span className="ml-0.5 text-xs">Customer</span>
          </div>
          <div className={`flex items-center ${step === 'items' ? '' : 'text-gray-400'}`} style={step === 'items' ? { color: colors.primaryColor } : undefined}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${step === 'items' ? '' : 'bg-gray-100'}`} style={step === 'items' ? { backgroundColor: `${colors.primaryColor}12`, color: colors.primaryColor } : undefined}>2</div>
            <span className="ml-0.5 text-xs">Items</span>
          </div>
          <div className={`flex items-center ${step === 'review' ? '' : 'text-gray-400'}`} style={step === 'review' ? { color: colors.primaryColor } : undefined}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${step === 'review' ? '' : 'bg-gray-100'}`} style={step === 'review' ? { backgroundColor: `${colors.primaryColor}12`, color: colors.primaryColor } : undefined}>3</div>
            <span className="ml-0.5 text-xs">Review</span>
          </div>
        </div>
      </div>

      {/* STEP 1: CUSTOMER SELECTION */}
      {step === 'customer' && (
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex-1 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-2">Select or Create Customer</h3>

          {!showNewCustomerForm ? (
            <div>
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                  <input
                    type="text"
                    placeholder="Search by name or phone number..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      searchCustomers(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {customers.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-medium mb-1 text-sm">Existing Customers</h4>
                  <div className="space-y-1">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setStep('items');
                        }}
                        className="p-2 border border-gray-200 rounded-lg cursor-pointer transition-colors text-sm"
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = `${colors.primaryColor}08`; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = ''; }}
                      >
                        <div className="flex items-center">
                          <User className="h-3 w-3 text-gray-400 mr-2" />
                          <span className="font-medium">{customer.first_name} {customer.last_name}</span>
                          <Mail className="h-3 w-3 text-gray-400 ml-4 mr-2" />
                          <span className="text-gray-600 text-xs">{customer.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {customerSearch.length >= 2 && customers.length === 0 && !loading && (
                <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: `${colors.secondaryColor}12`, border: `1px solid ${colors.secondaryColor}22` }}>
                  <div className="flex items-center" style={{ color: colors.secondaryColor }}>
                    <User className="h-5 w-5 mr-2" />
                    <span className="font-medium">No existing customer found</span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: colors.secondaryColor }}>{`No customer found with "${customerSearch}". Please create a new customer below.`}</p>
                </div>
              )}

              <button
                onClick={() => {
                  // AUTO-POPULATE LOGIC
                  const term = customerSearch.trim();
                  const prefill = { first_name: '', last_name: '', phone: '', email: '', address: '' };

                  if (term) {
                    const isEmail = term.includes('@');
                    // Simple phone check: allowed chars and at least 3 digits
                    const isPhone = /^[\d\-\+\(\)\s\.]+$/.test(term) && (term.match(/\d/g) || []).length > 3;

                    if (isEmail) {
                      prefill.email = term;
                    } else if (isPhone) {
                      prefill.phone = term;
                    } else {
                      // Assume Name
                      const nameParts = term.split(' ');
                      prefill.first_name = nameParts[0];
                      if (nameParts.length > 1) {
                        prefill.last_name = nameParts.slice(1).join(' ');
                      }
                    }
                  }

                  // If we have an email but no first name, derive a friendly first name from the email local-part
                  if (!prefill.first_name && prefill.email) {
                    const local = prefill.email.split('@')[0] || '';
                    // Capitalize first segment
                    const part = local.split(/[\.\-_]/)[0] || local;
                    prefill.first_name = part ? part.charAt(0).toUpperCase() + part.slice(1) : '';
                  }

                  setNewCustomer(prefill);
                  setShowNewCustomerForm(true);
                }}
                className="w-full py-2 px-4 rounded-lg hover:opacity-95 transition-colors text-white"
                style={{ backgroundColor: colors.primaryColor }}
              >
                Create New Customer
              </button>
            </div>
          ) : (
            <div>
              <h4 className="font-medium mb-3 text-sm">New Customer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="First Name"
                  value={newCustomer.first_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={newCustomer.last_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="123-456-7890"
                  value={newCustomer.phone}
                  onChange={(e) => {
                    // Strip all non-digit characters
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    // Format as XXX-XXX-XXXX
                    let formatted = digits;
                    if (digits.length > 6) {
                      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
                    } else if (digits.length > 3) {
                      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                    }
                    setNewCustomer({ ...newCustomer, phone: formatted });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2 lg:col-span-4"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowNewCustomerForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={createCustomer}
                  className="py-2 px-4 rounded-lg hover:opacity-95 text-white"
                  style={{ backgroundColor: colors.primaryColor }}
                  // Allow creation when either phone OR email is present; first_name is optional (can be filled later)
                  disabled={!(newCustomer.email || newCustomer.phone)}
                >
                  Create Customer
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: ITEMS SELECTION */}
      {step === 'items' && (
        <div className="flex flex-col lg:flex-row gap-3">
          {/* TOP-LEFT: CONTROL PANELS */}
          <div className="lg:w-1/4 order-last lg:order-first">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 sticky top-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-sm font-bold mb-3 text-gray-900">Edit Item</h3>

              {selectedTicketIndex !== null && items[selectedTicketIndex] ? (
                <div className="space-y-2">
                  {/* Selected Item Header */}
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs text-gray-900 truncate">{items[selectedTicketIndex]?.clothing_name}</h4>
                        <p className="text-[11px] text-gray-500">Total: ${items[selectedTicketIndex]?.item_total.toFixed(2)}</p>
                      </div>
                      <button onClick={(e) => removeItem(selectedTicketIndex, e)} className="text-gray-400 hover:text-red-600 flex-shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 0. SERVICE MODE PANEL */}
                  <div className="bg-blue-50 p-2 rounded-lg shadow-sm border border-blue-200 text-sm" style={items[selectedTicketIndex]?.alteration_behavior === 'alteration_only' ? { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' } : {}}>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Service Mode</h3>
                      {items[selectedTicketIndex]?.alteration_behavior === 'alteration_only' && <span className="text-[8px] font-bold text-purple-700 uppercase">Alt Only</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const item = items[selectedTicketIndex!];
                        const isAltOnly = item.alteration_behavior === 'alteration_only';
                        const newBehavior = isAltOnly ? 'none' : 'alteration_only';
                        updateItem(selectedTicketIndex!, {
                          alteration_behavior: newBehavior,
                          starch_level: newBehavior === 'alteration_only' ? 'no_starch' : item.starch_level,
                          clothing_size: newBehavior === 'alteration_only' ? 'none' : item.clothing_size,
                          crease: newBehavior === 'alteration_only' ? 'no_crease' : item.crease
                        });
                      }}
                      className={`w-full flex items-center justify-center gap-1 py-1 rounded-lg border-2 transition-all font-bold text-xs ${items[selectedTicketIndex]?.alteration_behavior === 'alteration_only'
                        ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600'
                        }`}
                    >
                      <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${items[selectedTicketIndex]?.alteration_behavior === 'alteration_only'
                        ? 'bg-white border-white'
                        : 'border-gray-300 bg-white'
                        }`}>
                        {items[selectedTicketIndex]?.alteration_behavior === 'alteration_only' && <div className="w-1.5 h-1.5 bg-purple-600 rounded-sm" />}
                      </div>
                      <span>Alteration Only</span>
                    </button>
                  </div>

                  {/* 1. STARCH PANEL */}
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Starch</h3>
                      {items[selectedTicketIndex]?.starch_charge > 0 && <span className="text-[9px] font-bold" style={{ color: colors.primaryColor }}>+${items[selectedTicketIndex]?.starch_charge.toFixed(2)}</span>}
                    </div>
                    <div className={`grid grid-cols-5 gap-0.5 ${items[selectedTicketIndex]?.alteration_behavior === 'alteration_only' ? 'opacity-40 pointer-events-none' : ''}`}>
                      {['no_starch', 'light', 'medium', 'heavy', 'extra_heavy'].map((key) => {
                        const levelDisplay = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()).replace('No Starch', 'None').replace('Extra Heavy', 'Ex.Hv');
                        const isActive = items[selectedTicketIndex]?.starch_level === key;
                        return (
                          <button
                            key={key}
                            onClick={() => handleQuickStarchUpdate(key)}
                            disabled={items[selectedTicketIndex]?.alteration_behavior === 'alteration_only'}
                            className={`px-0.5 py-1 text-[8px] font-bold uppercase rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
                            style={isActive ? { backgroundColor: colors.primaryColor, color: '#fff', borderColor: colors.primaryColor } : undefined}
                          >
                            {levelDisplay}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. ALTERATIONS PANEL */}
                  {alterationTypes.length > 0 && (() => {
                    const activeAlt = items[selectedTicketIndex]?.alteration_id
                      ? alterationTypes.find(a => a.id === items[selectedTicketIndex]?.alteration_id)
                      : null;
                    return (
                      <AlterationPanel
                        alterationTypes={alterationTypes}
                        activeAlt={activeAlt || null}
                        altPrice={items[selectedTicketIndex]?.alteration_price || 0}
                        disabled={false}
                        onSelect={(alt) => handleQuickAlterationUpdate(alt)}
                        onClear={() => handleQuickAlterationUpdate(null)}
                      />
                    );
                  })()}

                  {/* 3. CLOTHING SIZE PANEL */}
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Size</h3>
                      {items[selectedTicketIndex]?.size_charge > 0 && <span className="text-[9px] font-bold" style={{ color: colors.secondaryColor }}>+${items[selectedTicketIndex]?.size_charge.toFixed(2)}</span>}
                    </div>
                    <div className={`grid grid-cols-6 gap-0.5 ${items[selectedTicketIndex]?.alteration_behavior === 'alteration_only' ? 'opacity-40 pointer-events-none' : ''}`}>
                      {['none', 's', 'm', 'l', 'xl', 'xxl'].map((key) => {
                        const isActive = (items[selectedTicketIndex]?.clothing_size || 'none') === key;
                        const label = key === 'none' ? 'None' : key.toUpperCase();
                        return (
                          <button
                            key={key}
                            onClick={() => handleQuickSizeUpdate(key)}
                            disabled={items[selectedTicketIndex]?.alteration_behavior === 'alteration_only'}
                            className={`px-0.5 py-1 text-[8px] font-bold uppercase rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
                            style={isActive ? { backgroundColor: colors.secondaryColor, color: '#fff', borderColor: colors.secondaryColor } : undefined}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. QUANTITY & CREASE */}
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={items[selectedTicketIndex]?.quantity || 1}
                          onChange={(e) => updateItem(selectedTicketIndex!, { quantity: parseInt(e.target.value) || 1 })}
                          className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs font-bold"
                        />
                      </div>
                      <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          disabled={items[selectedTicketIndex]?.alteration_behavior === 'alteration_only'}
                          checked={items[selectedTicketIndex]?.crease === 'crease' && items[selectedTicketIndex]?.alteration_behavior !== 'alteration_only'}
                          onChange={(e) => updateItem(selectedTicketIndex!, { crease: e.target.checked ? 'crease' : 'no_crease' })}
                          className="rounded w-4 h-4 disabled:opacity-30"
                          style={{ accentColor: colors.primaryColor }}
                        />
                        <span className="text-[9px] text-gray-600 whitespace-nowrap">Crease</span>
                      </label>
                    </div>
                  </div>

                  {/* 5. PRICE ADJUSTMENT */}
                  <UpchargeSelector
                    disabled={false}
                    currentCharge={items[selectedTicketIndex]?.additional_charge || 0}
                    onUpdate={(newAmount) => updateItem(selectedTicketIndex!, { additional_charge: newAmount })}
                  />
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-xs">Select an item to edit</div>
              )}
            </div>
          </div>

          {/* CENTER: CLOTHING GRID */}
          <div className="lg:w-2/4">
            {/* SEARCH BAR */}
            <div className="mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* CATEGORY TABS */}
            <div className="flex flex-wrap gap-1 mb-3">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-2 py-1 rounded-full text-xs font-bold transition-all border`}
                style={
                  selectedCategory === 'All'
                    ? { backgroundColor: colors.primaryColor, color: '#fff', borderColor: colors.primaryColor }
                    : { backgroundColor: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }
                }
              >
                All Items
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded-full text-xs font-bold transition-all border`}
                  style={
                    selectedCategory === cat
                      ? { backgroundColor: colors.primaryColor, color: '#fff', borderColor: colors.primaryColor }
                      : { backgroundColor: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>

            {viewMode === 'grid' ? (
              <ClothingGrid
                clothingTypes={filteredClothingTypes}
                addItemByTypeId={addItemByTypeId}
                onAddCustomItem={() => setShowCustomItemModal(true)}
              />
            ) : (
              <div className="space-y-2">
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                  <button onClick={addItem} className="flex items-center font-medium mb-4" style={{ color: colors.primaryColor }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Default Item
                  </button>
                  <button onClick={() => setShowCustomItemModal(true)} className="flex items-center font-medium" style={{ color: colors.secondaryColor }}>
                    <PenTool className="h-4 w-4 mr-2" /> Add Custom Item
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4 max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-3 border-b flex items-center justify-between bg-gray-50">
                <h3 className="text-sm font-bold text-gray-900">Items ({items.length})</h3>
                <div className="text-xs font-bold text-gray-700">${totalAmount.toFixed(2)}</div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedTicketIndex(index)}
                    className={`p-2 border rounded-lg cursor-pointer transition-all duration-200 group relative`}
                    style={selectedTicketIndex === index ? { borderColor: colors.primaryColor, boxShadow: `0 0 0 1px ${colors.primaryColor}`, backgroundColor: `${colors.primaryColor}12` } : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-[11px] text-gray-900 truncate flex items-center gap-1">
                          {item.alteration_behavior === 'alteration_only' && (
                            <span className="flex-shrink-0 text-[7px] font-black bg-black text-white px-1 py-0.5 rounded leading-none">ALT</span>
                          )}
                          <span className="truncate">{item.clothing_name}</span>
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1 rounded">Q:{item.quantity}</span>
                          <span className="text-[10px] font-bold text-blue-600">${item.item_total.toFixed(2)}</span>
                        </div>
                        {/* ITEM DETAILS CHIPS */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.starch_level !== 'no_starch' && (
                            <span className="text-[8px] font-black text-blue-700 bg-blue-50 px-1 rounded uppercase border border-blue-100">
                              {item.starch_level.replace('_', ' ')}
                            </span>
                          )}
                          {item.crease === 'crease' && (
                            <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1 rounded uppercase border border-emerald-100">
                              Crease
                            </span>
                          )}
                          {item.alteration_name && (
                            <span className="text-[8px] font-black text-purple-700 bg-purple-50 px-1 rounded uppercase border border-purple-100">
                              {item.alteration_name}
                            </span>
                          )}
                          {item.clothing_size && item.clothing_size !== 'none' && (
                            <span className="text-[8px] font-black text-amber-700 bg-amber-50 px-1 rounded uppercase border border-amber-100">
                              Size: {item.clothing_size}
                            </span>
                          )}
                          {item.additional_charge !== 0 && (
                            <span className={`text-[8px] font-black px-1 rounded uppercase border ${item.additional_charge > 0 ? 'text-rose-700 bg-rose-50 border-rose-100' : 'text-green-700 bg-green-50 border-green-100'}`}>
                              Adj: {item.additional_charge > 0 ? '+' : ''}{item.additional_charge.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={(e) => removeItem(index, e)} className="text-gray-400 hover:text-red-600 transition-colors">
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
                    onClick={handleProceedToReview}
                    className="w-full py-2.5 px-4 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.98] shadow-sm"
                    style={{ backgroundColor: colors.secondaryColor }}
                  >
                    <List className="h-4 w-4" />
                    Review Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW */}
      {step === 'review' && (
        <div className="max-w-[1360px] mx-auto bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold mb-6 text-gray-900">Review Ticket</h3>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left side: Items & Logistics (Span 3) */}
            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* COLUMN 1: CUSTOMER & LOGISTICS */}
                  <div className="space-y-4">
                    <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                      <h4 className="font-bold text-[10px] uppercase text-gray-500 tracking-widest">Customer Details</h4>
                      <div className="flex justify-between items-center text-sm"><span className="text-gray-600 font-medium">Name:</span><span className="font-bold text-gray-900">{selectedCustomer?.first_name} {selectedCustomer?.last_name}</span></div>
                      <div className="flex justify-between items-center text-sm"><span className="text-gray-600 font-medium">Phone:</span><span className="font-bold text-gray-900">{selectedCustomer?.phone}</span></div>
                    </div>
                    <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                      <h4 className="font-bold text-[10px] uppercase text-gray-500 tracking-widest">Schedule Pickup</h4>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-600 text-[11px] font-bold">Target Pickup Date:</span>
                        <input type="datetime-local" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:ring-1 focus:ring-blue-500 outline-none w-full shadow-inner" />
                      </div>
                    </div>

                  {/* PAYMENT CALCULATOR */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                      <Calculator className="w-4 h-4 text-gray-600" />
                      <h4 className="font-bold text-gray-800 text-[10px] uppercase tracking-widest">Payment Calculator</h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Amount Given</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={tenderedAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTenderedAmount(val);
                              const numVal = parseFloat(val) || 0;
                              const cappedPayment = Math.min(numVal, finalTotal);
                              setPaidAmount(cappedPayment);
                            }}
                            className="w-full pl-9 pr-3 py-2 border-2 rounded-xl font-bold text-xl text-gray-900 focus:ring-0 shadow-inner"
                            style={{ borderColor: `${colors.primaryColor}22` }}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-2.5 rounded border border-gray-200 shadow-sm">
                          <span className="block text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Change</span>
                          <span className="block text-base font-black" style={(parseFloat(tenderedAmount) || 0) > finalTotal ? { color: colors.secondaryColor } : { color: '#d1d5db' }}>
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
                </div>

                {/* COLUMN 2: WIDER ITEMS TABLE */}
                <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white shadow-sm h-full">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center text-[10px] font-black uppercase text-gray-600 tracking-wider">
                    <span>Order Details ({items.length})</span>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
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
                                  <span className="text-[8px] font-black bg-black text-white px-1 py-1 rounded shrink-0 uppercase text-[7px] leading-none">ALT</span>
                                )}
                                <span className="text-sm truncate max-w-[200px]">{item.clothing_name}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {item.starch_level !== 'no_starch' && <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase border border-blue-100">{item.starch_level.replace('_', ' ')}</span>}
                                {item.crease === 'crease' && <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase border border-emerald-100">Crease</span>}
                                {item.clothing_size && item.clothing_size !== 'none' && <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase border border-amber-100">Size {item.clothing_size}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-bold text-gray-700 text-sm">{item.quantity}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-gray-900 text-sm">
                              ${item.item_total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            {/* Right Column: Summary & Finalize */}
            <div className="space-y-6 lg:col-span-1">
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-[10px] uppercase text-gray-500 tracking-widest mb-4 border-b border-gray-200 pb-2.5">Final Statement</h4>
                  <div className="space-y-3">
                    <div className="text-xs text-gray-600 flex justify-between"><span>Subtotal:</span> <span className="font-bold text-gray-900 text-sm">${totalAmount.toFixed(2)}</span></div>
                    <div className="text-xs text-gray-600 flex justify-between"><span>Environmental (4.7%):</span> <span className="font-bold text-gray-900 text-xs">${envCharge.toFixed(2)}</span></div>
                    <div className="text-xs text-gray-600 flex justify-between pb-4 border-b border-gray-200"><span>Tax (8.25%):</span> <span className="font-bold text-gray-900 text-xs">${tax.toFixed(2)}</span></div>
                    <div className="text-2xl font-black flex justify-between items-center pt-4">
                      <span className="text-gray-900">Total</span>
                      <span style={{ color: colors.secondaryColor }}>${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <label className="block text-gray-700 font-bold mb-2 text-[10px] uppercase tracking-widest">Order Instructions</label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
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
                    onClick={createTicket} 
                    disabled={loading} 
                    className="flex-1 px-5 py-3.5 text-white rounded-xl font-black flex justify-center items-center hover:opacity-95 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 uppercase text-[10px] tracking-widest" 
                    style={{ backgroundColor: colors.secondaryColor }}
                  >
                    {loading ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : 'Confirm Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR ALERTS */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
      >
        {modal.type === 'success' ? <div style={{ color: colors.secondaryColor, fontWeight: 600 }}>{modal.message}</div> : <div style={{ color: '#dc2626' }}>{modal.message}</div>}
      </Modal>

      {/* CUSTOM ITEM MODAL */}
      <Modal
        isOpen={showCustomItemModal}
        onClose={() => setShowCustomItemModal(false)}
        title="Add Custom Item"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Enter details for an item not in the database.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2"
              placeholder="e.g., Vintage Scarf"
              value={customItemForm.name}
              onChange={(e) => setCustomItemForm({ ...customItemForm, name: e.target.value })}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded-lg p-2"
                placeholder="0.00"
                value={customItemForm.price}
                onChange={(e) => setCustomItemForm({ ...customItemForm, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Margin ($)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded-lg p-2"
                placeholder="0.00"
                value={customItemForm.margin}
                onChange={(e) => setCustomItemForm({ ...customItemForm, margin: e.target.value })}
              />
            </div>
          </div>

          <div className="text-right text-sm font-semibold text-gray-700 mt-2">
            Total: ${((parseFloat(customItemForm.price) || 0) + (parseFloat(customItemForm.margin) || 0)).toFixed(2)}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowCustomItemModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button
              onClick={handleAddCustomItem}
              disabled={!customItemForm.name || !customItemForm.price}
              className="px-4 py-2 text-white rounded-lg disabled:opacity-50 hover:opacity-95"
              style={{ backgroundColor: colors.secondaryColor }}
            >
              Add Item
            </button>
          </div>
        </div>
      </Modal>

      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onPrint={() => { }}
        content={printContent}
        note="The machine will automatically print the normal receipt, plant copy, and customer/plant copy. Use ‘Print Tags Only’ when you need tags."
        hideDefaultButton={true}
        extraActions={(
          <>
            <button onClick={handlePrintCustomer} className="px-4 py-2 text-white rounded flex items-center gap-2 hover:opacity-95" style={{ backgroundColor: colors.primaryColor }}>
              <Printer size={18} /> Print Customer Only
            </button>
            <button onClick={handlePrintPlant} className="px-4 py-2 text-white rounded flex items-center gap-2 hover:opacity-95" style={{ backgroundColor: colors.secondaryColor }}>
              <Printer size={18} /> Print Plant Copy
            </button>
            <button onClick={handlePrintTags} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 flex items-center gap-2">
              <Printer size={18} /> Print Tags Only
            </button>
            <button onClick={handlePrintAll} className="px-4 py-2 text-white rounded flex items-center gap-2 hover:opacity-95" style={{ backgroundImage: `linear-gradient(to right, ${colors.primaryColor}, ${colors.secondaryColor})` }}>
              <Printer size={18} /> Print All
            </button>
          </>
        )}
      />
    </div>
  );
}