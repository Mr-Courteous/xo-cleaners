import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, User, Phone, Calendar, Grid, List, Shirt, ImageOf, Mail, Printer } from 'lucide-react';
import axios from "axios";
import baseURL from "../lib/config";
import { Customer, ClothingType, TicketItem } from '../types';
import Modal from './Modal';
import PrintPreviewModal from './PrintPreviewModal';
import renderReceiptHtml from '../lib/receiptTemplate';
import renderPlantReceiptHtml from '../lib/plantReceiptTemplate';

// --- NEW CENTRAL IMAGE MAP FOR CORRELATION AND BETTER IMAGES ---
const CLOTHING_IMAGE_MAP: { [key: string]: string } = {
  // Add your item images here
};
// -------------------------------------------------------------

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

// --- GRID VIEW COMPONENT ---
interface ClothingGridProps {
  clothingTypes: ClothingType[];
  addItemByTypeId: (clothingTypeId: number) => void;
}

const ClothingGrid: React.FC<ClothingGridProps> = ({ clothingTypes, addItemByTypeId }) => {
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

  // Note: Ensure your TicketItem type in '../types' includes 'alterations?: string'
  const [items, setItems] = useState<TicketItem[]>([]);

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [pickupDate, setPickupDate] = useState<string>(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16));
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    message: '',
    title: '',
    type: 'error' as 'error' | 'success'
  });
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printContent, setPrintContent] = useState('');
  const [plantHtmlState, setPlantHtmlState] = useState('');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      return (savedMode === 'grid' || savedMode === 'list') ? savedMode : 'grid';
    }
    return 'grid';
  });

  const [additionalChargeInputIndex, setAdditionalChargeInputIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchClothingTypes();
  }, []);

  const saveViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    }
  };

  const fetchClothingTypes = async () => {
    try {
      const organizationId = localStorage.getItem("organizationId");
      const token = localStorage.getItem("accessToken");

      if (!organizationId || !token) {
        console.error("Missing Auth details");
        return;
      }

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
        password: "1234567890",
      };

      const response = await axios.post(`${baseURL}/api/organizations/register-customer`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSelectedCustomer(response.data);
      setShowNewCustomerForm(false);
      setStep("items");
    } catch (error: any) {
      console.error("Failed to create customer:", error);
    }
  };

  const addItem = () => {
    const ct = clothingTypes[0];
    setItems([...items, {
      clothing_type_id: ct?.id || 1,
      clothing_name: ct?.name || 'Select Item',
      quantity: 1,
      starch_level: 'no_starch',
      crease: 'no_crease',
      additional_charge: 0,
      alterations: '', // <--- INIT NEW FIELD
      item_instructions: '',
      plant_price: ct?.plant_price || 0,
      margin: ct?.margin || 0,
      item_total: (ct?.plant_price || 0) + (ct?.margin || 0),
    }]);
    saveViewMode('list');
  };

  const addItemByTypeId = (clothingTypeId: number) => {
    const ct = clothingTypes.find(type => type.id === clothingTypeId);
    if (!ct) return;

    setItems([...items, {
      clothing_type_id: ct.id,
      clothing_name: ct.name,
      quantity: 1,
      starch_level: 'no_starch',
      crease: 'no_crease',
      additional_charge: 0,
      alterations: '', // <--- INIT NEW FIELD
      item_instructions: '',
      plant_price: ct.plant_price,
      margin: ct.margin,
      item_total: ct.plant_price + ct.margin,
    }]);
  };

  const updateItem = (index: number, updates: any) => {
    const newItems = [...items];
    const oldItem = newItems[index];
    newItems[index] = { ...oldItem, ...updates };

    const clothingType = clothingTypes.find(ct => ct.id === newItems[index].clothing_type_id);

    // Recalculate price logic
    if (clothingType) {
      const basePrice = clothingType.plant_price + clothingType.margin;
      const quantity = newItems[index].quantity || 0;
      const additionalCharge = newItems[index].additional_charge || 0;
      newItems[index].plant_price = clothingType.plant_price;
      newItems[index].margin = clothingType.margin;
      newItems[index].item_total = (basePrice * quantity) + additionalCharge;
    } else if ('clothing_type_id' in updates) {
      newItems[index].item_total = 0;
    }

    // Force recalc if qty/charge changes
    if ('quantity' in updates || 'additional_charge' in updates) {
      if (clothingType) {
        const basePrice = clothingType.plant_price + clothingType.margin;
        const quantity = newItems[index].quantity || 0;
        const additionalCharge = newItems[index].additional_charge || 0;
        newItems[index].item_total = (basePrice * quantity) + additionalCharge;
      }
    }

    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

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
              .page-break { 
                page-break-before: always; 
                break-before: page;
                display: block; 
                height: 0; 
                overflow: hidden;
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

    try {
      setLoading(true);
      const mapStarchLevel = (val: any) => {
        if (!val) return 'none';
        const s = String(val).toLowerCase();
        if (s === 'no_starch' || s === 'none') return 'none';
        if (s === 'light' || s === 'low') return 'low';
        if (s === 'medium' || s === 'med') return 'medium';
        if (s === 'heavy' || s === 'high') return 'high';
        return 'none';
      };

      // 1. Prepare Payload
      const ticketData = {
        customer_id: Number(selectedCustomer!.id),
        items: itemsWithValidQuantity.map(item => ({
          clothing_type_id: Number(item.clothing_type_id),
          quantity: Number(item.quantity) || 0,
          starch_level: mapStarchLevel(item.starch_level),
          crease: item.crease === true || item.crease === 'crease',
          additional_charge: Number(item.additional_charge) || 0.0,
          alterations: item.alterations || null, // <--- MAP NEW FIELD HERE
          item_instructions: item.item_instructions || null,
        })),
        special_instructions: specialInstructions,
        pickup_date: pickupDate ? new Date(pickupDate).toISOString() : null,
        paid_amount: Number(paidAmount) || 0.0,
      };

      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication token not found.");

      // 2. Send Request
      const response = await axios.post(
        `${baseURL}/api/organizations/tickets`,
        ticketData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newTicket = response.data;

      // 3. Generate Receipts
      const customerHtml = renderReceiptHtml(newTicket as any);
      const plantHtml = renderPlantReceiptHtml(newTicket as any);

      setPrintContent(customerHtml);
      setPlantHtmlState(plantHtml);

      setShowPrintPreview(true);
      setModal({ isOpen: true, title: 'Ticket Created', type: 'success', message: 'Ticket created successfully.' });
      setLoading(false);

    } catch (error: any) {
      setLoading(false);
      console.error('Failed to create ticket:', error);
      const errorMessage = error.response?.data?.detail ||
        (error instanceof Error ? error.message : 'Failed to create ticket. Please try again.');

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

  const getClothingTypeById = (id: number) => clothingTypes.find(ct => ct.id === id);

  return (
    <div className="w-full max-w-full mx-auto px-4 py-4 min-h-screen bg-gray-100 font-sans">
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
                        onClick={() => { setSelectedCustomer(customer); setStep('items'); }}
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
              <button onClick={() => setShowNewCustomerForm(true)} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Create New Customer</button>
            </div>
          ) : (
            <div>
              <h4 className="font-medium mb-4">New Customer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                <input type="text" placeholder="First Name *" value={newCustomer.first_name} onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <input type="text" placeholder="Last Name" value={newCustomer.last_name} onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <input type="tel" placeholder="Phone Number *" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <input type="email" placeholder="Email *" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <input type="text" placeholder="Address" value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2 lg:col-span-4" />
              </div>
              <div className="flex space-x-4">
                <button onClick={() => setShowNewCustomerForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                <button onClick={createCustomer} disabled={!newCustomer.first_name || !newCustomer.phone || !newCustomer.email} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Create Customer</button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'items' && selectedCustomer && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add Clothing Items</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Customer: <span className="font-medium">{selectedCustomer.name}</span></span>
              <button onClick={() => saveViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} title="Grid View"><Grid className="h-5 w-5" /></button>
              <button onClick={() => saveViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} title="List View"><List className="h-5 w-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="xl:col-span-1 lg:order-1">
              {viewMode === 'grid' && clothingTypes.length > 0 && (
                <div>
                  <ClothingGrid clothingTypes={clothingTypes} addItemByTypeId={addItemByTypeId} />
                  <div className="mt-4 text-center text-sm text-gray-500">Click on an item above to add it to the ticket list on the right.</div>
                </div>
              )}
              {viewMode === 'list' && (
                <button onClick={addItem} className="w-full border-2 border-dashed border-gray-300 py-4 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors mb-4">
                  <Plus className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                  <span className="text-gray-600">Add Clothing Item (Manual)</span>
                </button>
              )}
            </div>

            <div className="xl:col-span-1 lg:order-2">
              <h4 className="text-md font-semibold mb-2">Current Ticket ({items.length} Items)</h4>
              {items.length === 0 && <div className="p-4 text-center text-gray-500 border border-dashed rounded-lg">No items added yet. Select or add an item.</div>}

              {items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-2 mb-2 text-sm font-semibold text-gray-700 border-b border-gray-300">
                  <div className="col-span-3">Item Type</div>
                  <div className="col-span-1 text-center">Qty</div>
                  <div className="col-span-3 text-center">Starch</div>
                  <div className="col-span-2 text-center">Crease</div>
                  <div className="col-span-1 text-center">Addtl</div>
                  <div className="col-span-1 text-center">Total</div>
                  <div className="col-span-1"></div>
                </div>
              )}

              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-gray-200 rounded-lg items-center bg-white">
                    {/* Item Type */}
                    <div className="col-span-3 flex flex-col">
                      <span className="font-medium text-sm truncate">{item.clothing_name}</span>
                      <span className="text-xs text-gray-500">${((getClothingTypeById(item.clothing_type_id)?.total_price) || item.item_total).toFixed(2)}</span>
                    </div>

                    {/* Quantity */}
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={String(item.quantity || '')}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const val = digits === '' ? 0 : parseInt(digits, 10);
                        updateItem(index, { quantity: val });
                      }}
                      className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 col-span-1 text-center"
                      required
                      placeholder="Qty"
                    />

                    {/* Starch Buttons */}
                    <div className="flex space-x-1 col-span-3">
                      {['no_starch', 'light', 'medium', 'heavy'].map(level => (
                        <button
                          key={level}
                          onClick={() => updateItem(index, { starch_level: level as any })}
                          title={level.replace('_', ' ')}
                          className={`flex-1 text-xs py-2 rounded-md transition-colors font-medium border ${item.starch_level === level ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                        >
                          {level === 'no_starch' ? 'None' : (level === 'light' ? 'Light' : level === 'medium' ? 'Med' : 'Hvy')}
                        </button>
                      ))}
                    </div>

                    {/* Crease Toggle */}
                    <button
                      onClick={() => updateItem(index, { crease: item.crease === 'crease' ? 'no_crease' : 'crease' as any })}
                      className={`w-full text-xs py-2 rounded-md transition-colors font-medium col-span-2 border ${item.crease === 'crease' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {item.crease === 'crease' ? 'Crease' : 'No Crease'}
                    </button>

                    {/* Additional Charge */}
                    <div className="relative col-span-1">
                      {additionalChargeInputIndex === index ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.additional_charge === 0 ? '' : String(item.additional_charge)}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                            updateItem(index, { additional_charge: parseFloat(cleaned) || 0 });
                          }}
                          onBlur={() => {
                            if (!item.additional_charge || item.additional_charge === 0) {
                              setAdditionalChargeInputIndex(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setAdditionalChargeInputIndex(null);
                              updateItem(index, { additional_charge: parseFloat((e.target as HTMLInputElement).value) || 0 });
                            }
                          }}
                          placeholder="Amt"
                          autoFocus
                          className="w-full px-1 py-2 border border-gray-300 rounded-md text-sm text-center"
                        />
                      ) : (
                        <button
                          onClick={() => setAdditionalChargeInputIndex(index)}
                          className={`w-full text-xs py-2 rounded transition-colors font-medium truncate ${item.additional_charge > 0 ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          {item.additional_charge > 0 ? `$${item.additional_charge.toFixed(2)}` : 'Add'}
                        </button>
                      )}
                    </div>

                    {/* Total */}
                    <div className="px-1 py-2 bg-gray-50 rounded-lg text-center font-medium text-sm col-span-1">
                      ${item.item_total.toFixed(2)}
                    </div>

                    {/* Trash */}
                    <button onClick={() => removeItem(index)} className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors col-span-1 flex justify-center">
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* --- NEW ALTERATIONS FIELD FOR EACH ITEM --- */}
                    <div className="col-span-1 md:col-span-12 mt-1">
                      {/* Alterations */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          placeholder="Add Alterations (e.g., Hem 2 inches, Sew button)..."
                          value={item.alterations || ''} // Default to empty string if undefined
                          onChange={(e) => updateItem(index, { alterations: e.target.value })}
                          className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 bg-gray-50"
                        />
                      </div>
                      {/* Instructions */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          placeholder="Special Instructions for this item..."
                          value={item.item_instructions || ''}
                          onChange={(e) => updateItem(index, { item_instructions: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 placeholder-gray-400 bg-blue-50"
                        />
                      </div>
                    </div>
                    {/* ------------------------------------------- */}

                  </div>
                ))}
              </div>

              {items.length > 0 && (
                <div className="flex justify-end mt-4">
                  <div className="w-full max-w-xs p-4 bg-gray-50 rounded-lg shadow-inner border border-gray-200">
                    <div className="flex justify-between mb-1">
                      <div className="text-sm text-gray-700">SubTotal:</div>
                      <div className="text-sm font-medium text-gray-800">${totalAmount.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm text-gray-700">Env Charge (4.7%):</div>
                      <div className="text-sm font-medium text-gray-800">${envCharge.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between border-b pb-2 mb-2">
                      <div className="text-sm text-gray-700">Tax (8.25%):</div>
                      <div className="text-sm font-medium text-gray-800">${tax.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-xl font-bold text-blue-600">TOTAL:</div>
                      <div className="text-xl font-bold text-blue-600">${finalTotal.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
              <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Any special handling instructions..." />
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setStep('customer')} className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">Back</button>
              <button
                onClick={() => {
                  const isValid = items.every(item => item.quantity > 0);
                  if (isValid) {
                    setStep('review');
                  } else {
                    setModal({ isOpen: true, title: 'Required Fields Missing', message: 'Please ensure all items have a quantity greater than zero.', type: 'error' });
                  }
                }}
                disabled={items.length === 0 || loading}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Review Order
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'review' && selectedCustomer && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Review Order</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Customer Information</h4>
              <p><strong>Name:</strong> {selectedCustomer.name}</p>
              <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
              {selectedCustomer.email && <p><strong>Email:</strong> {selectedCustomer.email}</p>}
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <label htmlFor="pickup-date" className="block font-medium mb-2">**Scheduled Pickup Date & Time**</label>
              <input type="datetime-local" id="pickup-date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" required />
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium mb-2">Items</h4>
            <div className="space-y-2">
              {items.map((item, index) => {
                const clothingType = getClothingTypeById(item.clothing_type_id);
                return (
                  <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <div>
                      <span className="font-medium">{clothingType?.name || item.clothing_name}</span>
                      <span className="text-gray-600 ml-2">×{item.quantity}</span>
                      <div className="text-sm text-gray-500">
                        {item.starch_level !== 'no_starch' && item.starch_level !== 'none' && `${item.starch_level} starch`}
                        {item.starch_level !== 'no_starch' && item.crease === 'crease' && item.starch_level !== 'none' && ', '}
                        {item.crease === 'crease' && 'with crease'}
                        {item.additional_charge > 0 && `, Addtl: $${item.additional_charge.toFixed(2)}`}
                        {/* Show Alterations in Review */}
                        {item.alterations &&
                          <div className="text-purple-600 italic mt-1">Alterations: {item.alterations}</div>
                        }
                      </div>
                    </div>
                    <span className="font-medium">${item.item_total.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {specialInstructions && (
            <div className="mb-6 p-4 bg-amber-50 rounded-lg">
              <h4 className="font-medium mb-2">Special Instructions</h4>
              <p className="text-gray-700">{specialInstructions}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button onClick={() => setStep('items')} className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">Back to Items</button>
            <div>
              <div className="text-sm text-gray-600 mb-1">SubTotal: ${totalAmount.toFixed(2)}</div>
              <div className="text-sm text-gray-600 mb-1">Env Charge (4.7%): ${envCharge.toFixed(2)}</div>
              <div className="text-sm text-gray-600 mb-1">Tax (8.25%): ${tax.toFixed(2)}</div>
              <div className="text-2xl font-bold text-blue-600 mb-2">Total: ${finalTotal.toFixed(2)}</div>
              <div className="text-sm text-gray-600 mb-1">
                <label className="block mb-1">Paid Amount:</label>
                <input type="number" min="0" step="0.01" max={finalTotal} value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="text-lg font-semibold text-gray-800">Balance: ${(finalTotal - paidAmount).toFixed(2)}</div>
            </div>
            <button onClick={createTicket} disabled={loading} className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{loading ? 'Generating...' : 'Generate Ticket'}</button>
          </div>
        </div>
      )}

      <Modal isOpen={modal.isOpen} onClose={() => { setModal({ isOpen: false, message: '', title: '', type: 'error' }); if (modal.type === 'success') { setSelectedCustomer(null); setItems([]); setSpecialInstructions(''); setPaidAmount(0); setStep('customer'); setCustomerSearch(''); setCustomers([]); setPickupDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16)); } }} title={modal.title}>
        {modal.type === 'success' ? <div dangerouslySetInnerHTML={{ __html: plantHtmlState || modal.message }} /> : <div>{modal.message}</div>}
      </Modal>

      <PrintPreviewModal isOpen={showPrintPreview} onClose={() => setShowPrintPreview(false)} onPrint={() => { }} content={printContent} hideDefaultButton={true} extraActions={(
        <>
          <button onClick={() => { const combinedHtml = `${printContent}<div class="page-break"></div>${plantHtmlState}`; handlePrintJob(combinedHtml); }} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"><Printer size={18} /> Print Receipts (All)</button>
          <button onClick={() => { handlePrintJob(plantHtmlState); }} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"><Printer size={18} /> Print Plant Only</button>
        </>
      )} />
    </div>
  );
}