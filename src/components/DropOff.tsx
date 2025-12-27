import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Trash2, User, Phone, Calendar, Grid, List, Shirt, 
  Image as LucideImage, Mail, Printer, PenTool, Loader2, Settings 
} from 'lucide-react';
import axios from "axios";
import baseURL from "../lib/config";
import { Customer, ClothingType, TicketItem, Ticket } from '../types'; 
import Modal from './Modal';
import PrintPreviewModal from './PrintPreviewModal';
import renderReceiptHtml from '../lib/receiptTemplate';
import renderPlantReceiptHtml from '../lib/plantReceiptTemplate';
// --- IMPORTED TAG GENERATOR ---
import { generateTagHtml } from '../lib/tagTemplates'; 

// --- NEW CENTRAL IMAGE MAP FOR CORRELATION AND BETTER IMAGES ---
const CLOTHING_IMAGE_MAP: { [key: string]: string } = {
  // Add your item images here if needed
};
// -------------------------------------------------------------

// --- TYPE EXTENSIONS FOR MERGED LOGIC ---
interface ExtendedTicketItem extends TicketItem {
  instruction_charge?: number;
  starch_charge?: number;
  size_charge?: number; 
  clothing_size?: string; 
  alteration_behavior?: string;
  is_custom?: boolean; 
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

// --- HELPER COMPONENT: UPCHARGE BUTTONS ---
interface UpchargeProps {
  currentCharge: number;
  onUpdate: (amount: number) => void;
}

const UpchargeSelector = ({ currentCharge, onUpdate }: UpchargeProps) => {
  const handleAdd = (amount: number) => {
    const newVal = Math.max(0, currentCharge + amount);
    onUpdate(newVal);
  };

  return (
    <div className="flex flex-col mt-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Upcharge: <span className="text-red-600">${currentCharge.toFixed(2)}</span>
        </span>
        {currentCharge > 0 && (
             <button
              onClick={() => onUpdate(0)}
              className="text-[10px] text-red-400 hover:text-red-600 underline"
            >
              Reset
            </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* MINUS BUTTONS */}
        <div className="flex gap-1 bg-red-50 p-1 rounded">
            <button
                type="button"
                onClick={() => handleAdd(-1)}
                className="px-2 py-1 text-[10px] font-bold rounded bg-white border border-red-200 text-red-700 hover:bg-red-100"
            >
                -$1
            </button>
            <button
                type="button"
                onClick={() => handleAdd(-5)}
                className="px-2 py-1 text-[10px] font-bold rounded bg-white border border-red-200 text-red-700 hover:bg-red-100"
            >
                -$5
            </button>
        </div>

        {/* ADD BUTTONS */}
        <div className="flex gap-1 bg-green-50 p-1 rounded">
            <button
                type="button"
                onClick={() => handleAdd(1)}
                className="px-2 py-1 text-[10px] font-bold rounded bg-white border border-green-200 text-green-700 hover:bg-green-100"
            >
                +$1
            </button>
            <button
                type="button"
                onClick={() => handleAdd(5)}
                className="px-2 py-1 text-[10px] font-bold rounded bg-white border border-green-200 text-green-700 hover:bg-green-100"
            >
                +$5
            </button>
            <button
                type="button"
                onClick={() => handleAdd(10)}
                className="px-2 py-1 text-[10px] font-bold rounded bg-white border border-green-200 text-green-700 hover:bg-green-100"
            >
                +$10
            </button>
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
  const sortedTypes = useMemo(() => {
    return [...clothingTypes].sort((a, b) => a.name.localeCompare(b.name));
  }, [clothingTypes]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
      {sortedTypes.map((type) => {
        const imageUrl = CLOTHING_IMAGE_MAP[type.name] || type.image_url;
        return (
          <button
            key={type.id}
            onClick={() => addItemByTypeId(type.id)}
            className={`
              flex flex-col items-center justify-start 
              p-2 bg-white border border-gray-200 rounded-xl shadow-md 
              hover:shadow-lg hover:border-blue-400 
              transition-all duration-200 ease-in-out
              h-32 font-semibold text-sm 
              active:scale-[0.98]
            `}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={type.name}
                className="w-full h-8 object-contain rounded-lg mb-1"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-8 flex items-center justify-center bg-gray-100 rounded-lg mb-1';
                  fallback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off text-gray-400"><line x1="2" x2="22" y1="2" y2="22"></line><path d="M10 8h8"/><path d="M18.8 17.8a2 2 0 0 1-2.8 2.8H6a2 2 0 0 1-2-2V6c0-.5.1-1 .3-1.5"></path><path d="m2 15 3.3-3.3c.9-.9 2.2-1.3 3.3-1.3.4 0 .7.1 1 .3"></path></svg>`;
                  target.parentNode?.insertBefore(fallback, target);
                }}
              />
            ) : (
              <div className="w-full h-8 flex flex-col items-center justify-center bg-gray-100 rounded-lg mb-1">
                <Shirt className="w-6 h-6 text-gray-500" />
                <span className="text-xs text-gray-500 mt-1">No Image</span>
              </div>
            )}
            <span className="text-sm font-bold text-center mt-1 truncate w-full px-1">{type.name}</span>
            <span className="text-xs font-bold text-blue-600 mt-1">${type.total_price.toFixed(2)}</span>
          </button>
        );
      })}

      <button
        onClick={onAddCustomItem}
        className={`
          flex flex-col items-center justify-center 
          p-2 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl shadow-sm 
          hover:shadow-md hover:bg-indigo-100 hover:border-indigo-400
          transition-all duration-200 ease-in-out
          h-32 font-semibold text-sm 
          active:scale-[0.98] text-indigo-700
        `}
      >
        <div className="w-10 h-10 flex items-center justify-center bg-indigo-200 rounded-full mb-2">
          <PenTool className="w-5 h-5 text-indigo-700" />
        </div>
        <span className="text-sm font-bold text-center w-full px-1">Custom Item</span>
        <span className="text-xs text-indigo-500 mt-1">Add New</span>
      </button>
    </div>
  );
};

// --- MAIN DROPOFF COMPONENT ---
export default function DropOff() {
  const [step, setStep] = useState<'customer' | 'items' | 'review'>('customer');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '', email: '', address: '' });
  const [clothingTypes, setClothingTypes] = useState<ClothingType[]>([]);

  const [items, setItems] = useState<ExtendedTicketItem[]>([]);
  
  // Track selected item for Quick Starch Panel
  const [selectedTicketIndex, setSelectedTicketIndex] = useState<number | null>(null);

  // STARCH & SIZE PRICES STATE
  const [starchPrices, setStarchPrices] = useState({
    no_starch: 0.00, light: 0.00, medium: 0.00, heavy: 0.00, extra_heavy: 0.00 
  });
  const [sizePrices, setSizePrices] = useState({
    s: 0.00, m: 0.00, l: 0.00, xl: 0.00, xxl: 0.00
  });

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [pickupDate, setPickupDate] = useState<string>(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16));
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, message: '', title: '', type: 'error' as 'error' | 'success' });
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printContent, setPrintContent] = useState('');
  const [plantHtmlState, setPlantHtmlState] = useState('');
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

  useEffect(() => {
    fetchClothingTypes();
    fetchOrganizationSettings();
  }, []);

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
    } catch (err) {
        console.error("Failed to fetch organization settings:", err);
    }
  };

  const fetchClothingTypes = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const url = `${baseURL}/api/organizations/clothing-types`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && Array.isArray(response.data.clothing_types)) {
        setClothingTypes(response.data.clothing_types);
      } else {
        setClothingTypes([]);
      }
    } catch (error) {
      console.error('Failed to fetch clothing types:', error);
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
      
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          setModal({
            isOpen: true,
            title: "Unauthorized",
            message: "Your session has expired or you are unauthorized. Please log in again.",
            type: "error"
          });
      }
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
    }
  };

  const resetTicketState = () => {
    setStep('customer');
    setSelectedCustomer(null);
    setItems([]);
    setSelectedTicketIndex(null); 
    setSpecialInstructions('');
    setPaidAmount(0);
    setCustomerSearch('');
    setCustomers([]);
    setPickupDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16));
  };

  const addItem = () => {
    const ct = clothingTypes[0];
    const newItem = {
      clothing_type_id: ct?.id || 1,
      clothing_name: ct?.name || 'Select Item',
      quantity: 1,
      starch_level: 'no_starch', starch_charge: 0,
      clothing_size: 'm', size_charge: 0, 
      crease: 'no_crease', additional_charge: 0, instruction_charge: 0,
      alterations: '', item_instructions: '',
      plant_price: ct?.plant_price || 0, margin: ct?.margin || 0,
      item_total: (ct?.plant_price || 0) + (ct?.margin || 0),
      alteration_behavior: 'none', is_custom: false
    };
    
    setItems(prev => {
        const newItems = [...prev, newItem];
        setSelectedTicketIndex(newItems.length - 1);
        return newItems;
    });
  };

  const addItemByTypeId = (clothingTypeId: number) => {
    const ct = clothingTypes.find(type => type.id === clothingTypeId);
    if (!ct) return;

    const newItem = {
      clothing_type_id: ct.id,
      clothing_name: ct.name,
      quantity: 1,
      starch_level: 'no_starch', starch_charge: 0,
      clothing_size: 'm', size_charge: 0, 
      crease: 'no_crease', additional_charge: 0, instruction_charge: 0,
      alterations: '', item_instructions: '',
      plant_price: ct.plant_price, margin: ct.margin,
      item_total: ct.plant_price + ct.margin,
      alteration_behavior: 'none', is_custom: false
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
      clothing_size: 'm', size_charge: 0, 
      crease: 'no_crease', additional_charge: 0, instruction_charge: 0,
      alterations: '', item_instructions: '',
      plant_price: price, margin: margin,
      item_total: price + margin, 
      alteration_behavior: 'none', is_custom: true
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
    
    const qty = updatedItem.quantity || 0;

    // 1. Starch Calculation
    const selectedStarch = updatedItem.starch_level as keyof typeof starchPrices;
    const unitStarchPrice = starchPrices[selectedStarch] || 0;
    updatedItem.starch_charge = unitStarchPrice * qty;

    // 2. Size Calculation
    const selectedSize = (updatedItem.clothing_size || 'm') as keyof typeof sizePrices;
    const unitSizePrice = sizePrices[selectedSize] || 0;
    updatedItem.size_charge = unitSizePrice * qty;

    // 3. Base Price
    const clothingType = clothingTypes.find(ct => ct.id === updatedItem.clothing_type_id);
    let basePrice = 0;
    
    if (updatedItem.is_custom) {
       basePrice = (updatedItem.plant_price || 0) + (updatedItem.margin || 0);
    } else if (clothingType) {
       basePrice = clothingType.plant_price + clothingType.margin;
       updatedItem.plant_price = clothingType.plant_price;
       updatedItem.margin = clothingType.margin;
    }

    if (updatedItem.alteration_behavior === 'alteration_only') {
      basePrice = 0;
    }

    // 4. Final Total
    const altCharge = updatedItem.additional_charge || 0;
    const instCharge = updatedItem.instruction_charge || 0;
    const starchCharge = updatedItem.starch_charge || 0;
    const sizeCharge = updatedItem.size_charge || 0;

    updatedItem.item_total = (basePrice * qty) + altCharge + instCharge + starchCharge + sizeCharge;

    setItems(newItems);
  };

  const removeItem = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    if (selectedTicketIndex === index) setSelectedTicketIndex(null);
    if (selectedTicketIndex !== null && index < selectedTicketIndex) setSelectedTicketIndex(selectedTicketIndex - 1);
  };

  // --- UPDATED PRINT HANDLER (Centers content) ---
  const handlePrintJob = (htmlContent: string) => {
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);

    printFrame.contentDocument?.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
             /* Reset Page Margins but allow paper size to be flexible */
            @page { 
                margin: 0; 
            }

            @media print {
              html {
                width: 100%; /* Ensure container fills the paper width */
                margin: 0;
                padding: 0;
              }
              
              body {
                width: 55mm;    /* Restrict content to receipt width */
                margin: 0 auto; /* CENTER horizontally */
                padding: 0;
                font-family: sans-serif;
              }

              div { break-inside: avoid; }
              
              .page-break-receipt { 
                page-break-after: always; 
                break-after: page;
              }
            }
            
            /* Fallback style */
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
          alteration_behavior: item.alteration_behavior
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
      
      const customerHtml = renderReceiptHtml(newTicket as any);
      const plantHtml = renderPlantReceiptHtml(newTicket as any);
      // ✅ Use imported generator
      const tagHtml = generateTagHtml(newTicket); 

      setPrintContent(customerHtml);
      setPlantHtmlState(plantHtml);
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
    const combinedHtml = `
      <div class="page-break-receipt">${printContent}</div>
      <div class="page-break-receipt">${plantHtmlState}</div>
      <div>${tagHtmlState}</div>
    `;
    handlePrintJob(combinedHtml);
    setShowPrintPreview(false);
  }

  const handlePrintCustomer = () => {
    handlePrintJob(printContent);
    setShowPrintPreview(false);
  }

  const handlePrintPlant = () => {
    handlePrintJob(plantHtmlState);
    setShowPrintPreview(false);
  }

  const handlePrintTags = () => {
    handlePrintJob(tagHtmlState);
    setShowPrintPreview(false);
  }

  return (
    <div className="w-full max-w-full mx-auto px-4 py-4 min-h-screen bg-gray-100 font-sans">
      {/* HEADER & TITLE */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Drop Off Clothes</h2>
        
        <div className="flex items-center mt-2 space-x-4">
          <div className={`flex items-center ${step === 'customer' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'customer' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}>1</div>
            <span className="ml-2">Customer</span>
          </div>
          <div className={`flex items-center ${step === 'items' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'items' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}>2</div>
            <span className="ml-2">Items</span>
          </div>
          <div className={`flex items-center ${step === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'review' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}>3</div>
             <span className="ml-2">Review</span>
          </div>
        </div>
      </div>

      {/* STEP 1: CUSTOMER SELECTION */}
      {step === 'customer' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Select or Create Customer</h3>
          
          {!showNewCustomerForm ? (
            <div>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Existing Customers</h4>
                  <div className="space-y-2">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setStep('items');
                        }}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                         <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="font-medium">{customer.first_name} {customer.last_name}</span>
                            <Mail className="h-4 w-4 text-gray-400 ml-4 mr-2" />
                            <span className="text-gray-600">{customer.email}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {customerSearch.length >= 2 && customers.length === 0 && !loading && (
                 <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center text-amber-800">
                        <User className="h-5 w-5 mr-2" />
                        <span className="font-medium">No existing customer found</span>
                    </div>
                    <p className="text-amber-700 text-sm mt-1">No customer found with "{customerSearch}". Please create a new customer below.</p>
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
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Customer
              </button>
            </div>
          ) : (
            <div>
              <h4 className="font-medium mb-4">New Customer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
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
                  placeholder="Phone Number"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
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
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3">
             {/* ... Grid/List View ... */}
             {viewMode === 'grid' ? (
                <ClothingGrid 
                  clothingTypes={clothingTypes} 
                  addItemByTypeId={addItemByTypeId} 
                  onAddCustomItem={() => setShowCustomItemModal(true)} 
                />
             ) : (
                <div className="space-y-2">
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                      <button onClick={addItem} className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4">
                         <Plus className="h-4 w-4 mr-2" /> Add Default Item
                      </button>
                      <button onClick={() => setShowCustomItemModal(true)} className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium">
                         <PenTool className="h-4 w-4 mr-2" /> Add Custom Item
                      </button>
                  </div>
                </div>
             )}
          </div>

          <div className="lg:w-1/3">
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-4">
                {/* ... Cart Header ... */}
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-semibold">Current Ticket</h3>
                   <span className="text-sm text-gray-500">{items.length} Items</span>
                </div>

                {/* CONTROL PANEL CONTAINER */}
                <div className="space-y-3 mb-4">
                    
                    {/* 1. STARCH PANEL */}
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                Starch Level
                            </h3>
                            {/* Show Price Hint */}
                            {selectedTicketIndex !== null && items[selectedTicketIndex]?.starch_charge > 0 && (
                                <span className="text-[10px] text-blue-600 font-bold">
                                    +${items[selectedTicketIndex].starch_charge.toFixed(2)}
                                </span>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-5 gap-1">
                            {['no_starch', 'light', 'medium', 'heavy', 'extra_heavy'].map((key) => {
                                const levelDisplay = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()).replace('No Starch', 'None').replace('Extra Heavy', 'Ex.Hv');
                                const isActive = selectedTicketIndex !== null && items[selectedTicketIndex]?.starch_level === key;
                                
                                return (
                                    <button
                                    key={key}
                                    onClick={() => handleQuickStarchUpdate(key)}
                                    disabled={selectedTicketIndex === null}
                                    className={`
                                        px-1 py-1.5 text-[9px] font-bold uppercase rounded border transition-all
                                        ${isActive 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }
                                        disabled:opacity-40 disabled:cursor-not-allowed
                                    `}
                                    >
                                    {levelDisplay}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. CLOTHING SIZE PANEL */}
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                Clothing Size
                            </h3>
                            {/* Show Price Hint */}
                            {selectedTicketIndex !== null && items[selectedTicketIndex]?.size_charge > 0 && (
                                <span className="text-[10px] text-purple-600 font-bold">
                                    +${items[selectedTicketIndex].size_charge.toFixed(2)}
                                </span>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-5 gap-1">
                            {['s', 'm', 'l', 'xl', 'xxl'].map((key) => {
                                const isActive = selectedTicketIndex !== null && (items[selectedTicketIndex]?.clothing_size || 'm') === key;
                                
                                return (
                                    <button
                                    key={key}
                                    onClick={() => handleQuickSizeUpdate(key)}
                                    disabled={selectedTicketIndex === null}
                                    className={`
                                        px-1 py-1.5 text-[10px] font-bold uppercase rounded border transition-all
                                        ${isActive 
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }
                                        disabled:opacity-40 disabled:cursor-not-allowed
                                    `}
                                    >
                                    {key.toUpperCase()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>
                
                {/* ITEMS LIST */}
                <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto">
                   {items.map((item, index) => (
                      <div 
                        key={index} 
                        // Click to Select
                        onClick={() => setSelectedTicketIndex(index)}
                        className={`
                          p-2 border rounded-lg cursor-pointer transition-all duration-200
                          ${selectedTicketIndex === index 
                             ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' 
                             : 'border-gray-200 bg-white hover:bg-gray-50'
                          }
                        `}
                      >
                         {/* Row 1: Name and Delete */}
                         <div className="flex justify-between items-center mb-1">
                            <h4 className="font-medium text-sm text-gray-900 truncate pr-2">
                                {item.clothing_name}
                                {item.is_custom && <span className="ml-1 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1 rounded">C</span>}
                            </h4>
                            <button onClick={(e) => removeItem(index, e)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                         </div>

                         {/* Row 2: Controls (Qty, Tags, Total) */}
                         <div className="flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                            
                            <div className="flex items-center gap-2">
                                {/* Compact Quantity */}
                                <div className="flex items-center bg-gray-100 rounded px-1.5 py-0.5 border border-gray-200">
                                   <span className="text-gray-500 text-[10px] mr-1">Qty</span>
                                   <input 
                                      type="number" 
                                      min="1" 
                                      value={item.quantity} 
                                      onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 0 })}
                                      className="w-6 bg-transparent border-none p-0 text-center font-semibold focus:ring-0 text-xs"
                                      onClick={(e) => setSelectedTicketIndex(index)}
                                   />
                                </div>

                                {/* Size Badge */}
                                <span className={`
                                    px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border
                                    ${item.clothing_size && item.clothing_size !== 'm' 
                                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                        : 'bg-gray-50 text-gray-400 border-gray-200'}
                                `}>
                                   {(item.clothing_size || 'M').toUpperCase()}
                                </span>

                                {/* Starch Badge (Only show if not None) */}
                                {item.starch_level !== 'no_starch' && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] border bg-blue-50 text-blue-700 border-blue-100">
                                        {item.starch_level.replace('_', ' ').substring(0, 3).toUpperCase()}
                                    </span>
                                )}

                                {/* Crease Checkbox */}
                                <label className="flex items-center gap-1 cursor-pointer ml-1">
                                    <input 
                                      type="checkbox" 
                                      checked={item.crease === 'crease'} 
                                      onChange={(e) => updateItem(index, { crease: e.target.checked ? 'crease' : 'no_crease' })}
                                      className="rounded text-blue-600 w-3 h-3"
                                    />
                                    <span className="text-[9px] text-gray-500">Crease</span>
                                </label>
                            </div>

                            {/* Total Price */}
                            <span className="font-semibold text-gray-900">
                                ${item.item_total.toFixed(2)}
                            </span>
                         </div>

                         {/* ROW 3: UPCHARGE BUTTONS */}
                         <UpchargeSelector 
                            currentCharge={item.additional_charge || 0}
                            onUpdate={(newAmount) => {
                                // 1. Remove ANY existing price tags like (+$5), (+$10)
                                const cleanNote = (item.item_instructions || '').replace(/\s*\(\+\$\d+(\.\d+)?\)/g, '').trim();
                                
                                // 2. Add the single new total tag only if > 0
                                const newNote = newAmount > 0 
                                  ? `${cleanNote} (+$${newAmount})` 
                                  : cleanNote;

                                updateItem(index, { 
                                    additional_charge: newAmount,
                                    item_instructions: newNote
                                });
                            }} 
                         />

                      </div>
                   ))}
                   
                   {items.length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-sm">
                         No items added yet
                      </div>
                   )}
                </div>

                <div className="border-t pt-4 space-y-2">
                   <div className="flex justify-between"><span>Subtotal:</span><span>${totalAmount.toFixed(2)}</span></div>
                   <div className="flex justify-between text-gray-500 text-sm"><span>Env. Charge (4.7%):</span><span>${envCharge.toFixed(2)}</span></div>
                   <div className="flex justify-between text-gray-500 text-sm"><span>Tax (8.25%):</span><span>${tax.toFixed(2)}</span></div>
                   <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total:</span><span>${finalTotal.toFixed(2)}</span></div>
                </div>

                <div className="mt-6 flex gap-3">
                   <button onClick={() => setStep('customer')} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Back</button>
                   <button onClick={() => setStep('review')} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" disabled={items.length === 0}>Review</button>
                </div>
             </div>
          </div>
        </div>
      )}
      
      {/* STEP 3: REVIEW */}
      {step === 'review' && (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
           <h3 className="text-xl font-bold mb-6">Review Ticket</h3>
           
           <div className="mb-6 space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">Customer:</span><span className="font-medium">{selectedCustomer?.first_name} {selectedCustomer?.last_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Phone:</span><span className="font-medium">{selectedCustomer?.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Pickup Date:</span><input type="datetime-local" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="border rounded px-2 py-1" /></div>
           </div>
           
           <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Special Instructions (Ticket Level)</label>
              <textarea 
                value={specialInstructions} 
                onChange={(e) => setSpecialInstructions(e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg h-24"
                placeholder="Any general notes for this order..."
              />
           </div>

           <div className="mb-6">
               <label className="block text-gray-700 font-medium mb-2">Amount Paid Today ($)</label>
               <input 
                 type="number" 
                 step="0.01"
                 value={paidAmount} 
                 onChange={(e) => setPaidAmount(parseFloat(e.target.value))} 
                 className="w-full px-3 py-2 border rounded-lg font-mono"
               />
           </div>

           <div className="flex gap-4">
              <button onClick={() => setStep('items')} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Back to Items</button>
              <button onClick={createTicket} disabled={loading} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex justify-center items-center">
                 {loading ? <Loader2 className="animate-spin mr-2" /> : 'Create Ticket'}
              </button>
           </div>
        </div>
      )}

      {/* MODAL FOR ALERTS */}
      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
        title={modal.title}
      >
        {modal.type === 'success' ? <div className="text-green-600 font-medium">{modal.message}</div> : <div className="text-red-600">{modal.message}</div>}
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
                    onChange={(e) => setCustomItemForm({...customItemForm, name: e.target.value})}
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
                        onChange={(e) => setCustomItemForm({...customItemForm, price: e.target.value})}
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
                        onChange={(e) => setCustomItemForm({...customItemForm, margin: e.target.value})}
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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                    Add Item
                </button>
            </div>
        </div>
      </Modal>

      <PrintPreviewModal 
        isOpen={showPrintPreview} 
        onClose={() => setShowPrintPreview(false)} 
        onPrint={() => {}} 
        content={printContent} 
        hideDefaultButton={true} 
        extraActions={(
          <>
            <button onClick={handlePrintCustomer} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
              <Printer size={18} /> Print Customer Only
            </button>
            <button onClick={handlePrintPlant} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2">
              <Printer size={18} /> Print Plant Only
            </button>
            {tagHtmlState && (
              <button onClick={handlePrintTags} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 flex items-center gap-2">
                <Printer size={18} /> Print Tags Only
              </button>
            )}
            <button onClick={handlePrintAll} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2">
              <Printer size={18} /> Print All
            </button>
          </>
        )}
      />
    </div>
  );
}