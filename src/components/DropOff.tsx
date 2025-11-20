import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, User, Phone, Calendar, Grid, List, Shirt, ImageOf, Mail } from 'lucide-react';
import axios from "axios";
import baseURL from "../lib/config"; import { Customer, ClothingType, TicketItem } from '../types';
import Modal from './Modal';
import PrintPreviewModal from './PrintPreviewModal';
import renderReceiptHtml from '../lib/receiptTemplate';

// --- NEW CENTRAL IMAGE MAP FOR CORRELATION AND BETTER IMAGES ---
// NOTE: You MUST update the key (exact item name) and value (your image URL)
// to ensure perfect correlation and high-quality images.
const CLOTHING_IMAGE_MAP: { [key: string]: string } = {
  // Use your exact API item names as keys
  // 'Dress Shirt': 'https://picsum.photos/id/102/100/100', 
  // 'Pants': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiKqkojYBYCv9xg6eBwqABdQwmNJ3mFSKleQ&s', 
  // 'Suit Jacket': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHKM-2zVwwB_3TGXu35m3KA8SYPcU5_79Izw&s', 
  // 'Skirt': 'https://picsum.photos/id/237/100/100', 
  // 'Tie': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTs2qi5Gj_rYMq5sM-m60FqHgGcf3Sbw300g&s', 
  // 'Blouse': 'https://picsum.photos/id/1025/100/100', 
  // 'Dress': 'https://images.stockcake.com/public/b/a/2/ba2a2bda-8fcb-443c-ab35-64c3a094eead_medium/elegant-dress-display-stockcake.jpg',
  // 'Shirt': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrJxvXDE1JULd7pnLNLdPton0Ns-wK6pAeQA&s',
  // Add more of your items here...
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
const VIEW_MODE_STORAGE_KEY = 'dropOffViewMode'; // ADDED: Key for persistence

// --- NEW COMPONENT: MODERN GRID VIEW FOR CLOTHING TYPES ---
interface ClothingGridProps {
  clothingTypes: ClothingType[];
  addItemByTypeId: (clothingTypeId: number) => void;
}

const ClothingGrid: React.FC<ClothingGridProps> = ({ clothingTypes, addItemByTypeId }) => {
  const sortedTypes = useMemo(() => {
    return [...clothingTypes].sort((a, b) => a.name.localeCompare(b.name));
  }, [clothingTypes]);

  return (
    // ⭐ UPDATED: Expanded grid columns to fill the wider area.
    // Since the parent is now 50% of a 100% screen, we can fit more columns comfortably.
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
      {sortedTypes.map((type) => {
        // Get the image URL from the map. Fallback to a type-specific URL if available, or null.
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
              h-32 font-semibold text-sm // Overall button height kept at h-32
              active:scale-[0.98]
            `}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={type.name}
                // ⭐ MODIFIED: Reduced image size (h-8) and used object-contain
                className="w-full h-8 object-contain rounded-lg mb-1"
                // Handle image loading errors gracefully with a fallback UI
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Replace broken image with a clean fallback icon div
                  target.style.display = 'none'; // Hide the broken image
                  const fallback = document.createElement('div');
                  // ⭐ MODIFIED: Fallback div height (h-8)
                  fallback.className = 'w-full h-8 flex items-center justify-center bg-gray-100 rounded-lg mb-1';
                  fallback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off text-gray-400"><line x1="2" x2="22" y1="2" y2="22"></line><path d="M10 8h8"/><path d="M18.8 17.8a2 2 0 0 1-2.8 2.8H6a2 2 0 0 1-2-2V6c0-.5.1-1 .3-1.5"></path><path d="m2 15 3.3-3.3c.9-.9 2.2-1.3 3.3-1.3.4 0 .7.1 1 .3"></path></svg>`;
                  target.parentNode?.insertBefore(fallback, target);
                }}
              />
            ) : (
              // Fallback to a generic icon if no URL is found in the map
              // ⭐ MODIFIED: Fallback div height (h-8)
              <div className="w-full h-8 flex flex-col items-center justify-center bg-gray-100 rounded-lg mb-1">
                <Shirt className="w-6 h-6 text-gray-500" />
                <span className="text-xs text-gray-500 mt-1">No Image</span>
              </div>
            )}

            {/* Item Name */}
            <span className="text-sm font-bold text-center mt-1 truncate w-full px-1">{type.name}</span>
            {/* Price */}
            <span className="text-xs font-bold text-blue-600 mt-1">${type.total_price.toFixed(2)}</span>
          </button>
        );
      })}
    </div>
  );
};
// --------------------------------------------------


export default function DropOff() {
  const [step, setStep] = useState<'customer' | 'items' | 'review'>('customer');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '', email: '', address: '' });
  const [clothingTypes, setClothingTypes] = useState<ClothingType[]>([]);
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
  // --- MODIFIED: VIEW MODE STATE WITH PERSISTENCE LOGIC ---
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      // Only return savedMode if it is one of the valid options, otherwise 'grid'
      return (savedMode === 'grid' || savedMode === 'list') ? savedMode : 'grid';
    }
    return 'grid'; // Default for non-browser environments
  });
  // --- ADDED: State to manage the active additional charge input field ---
  const [additionalChargeInputIndex, setAdditionalChargeInputIndex] = useState<number | null>(null);
  // ------------------------------------

  useEffect(() => {
    console.log('Fetching clothing types...');
    fetchClothingTypes();
  }, []);

  // --- NEW FUNCTION: saveViewMode for Persistence ---
  const saveViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    }
  };
  // --------------------------------------------------

  const fetchClothingTypes = async () => {
    try {
      // 1. Get organizationId and token
      const organizationId = localStorage.getItem("organizationId");
      const token = localStorage.getItem("accessToken");

      if (!organizationId) {
        console.error("Failed to fetch clothing types: Organization ID is missing.");
        return;
      }
      if (!token) {
        console.error("Failed to fetch clothing types: No auth token found.");
        return;
      }

      // 2. Build the correct URL for the CLOTHING-TYPES endpoint
      const url = `${baseURL}/api/organizations/clothing-types`;

      // 3. Make the API call
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 4. Your backend returns { ..., clothing_types: [...] }
      if (response.data && Array.isArray(response.data.clothing_types)) {
        // The API already provides plant_price, margin, and total_price.
        // No extra processing is needed.
        setClothingTypes(response.data.clothing_types);
        console.log('Clothing types fetched:', response.data.clothing_types);
      } else {
        console.error("Data received is not in the expected format:", response.data);
        setClothingTypes([]); // Set to empty array on unexpected format
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

      // 1. You no longer need organizationId from localStorage.
      // The token is all you need for the backend to identify the organization.
      if (!token) {
        console.error("Missing authentication token.");
        throw new Error("Missing authentication details.");
      }

      // 2. The URL is now /customers (not /{orgId}/customers/search)
      // 3. The query param is 'search', not 'query'
      const response = await axios.get(
        `${baseURL}/api/organizations/customers?search=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 4. The backend returns a direct array, not an object.
      // So you should use response.data, not response.data.customers.
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

      // --- THIS PAYLOAD NOW MATCHES THE FORM AND THE BACKEND ---
      const payload = {
        email: newCustomer.email,
        first_name: newCustomer.first_name,
        last_name: newCustomer.last_name,
        address: newCustomer.address,
        password: "1234567890", // default password
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


  // --- MODIFIED: addItem now uses the new saveViewMode function ---
  const addItem = () => {
    const ct = clothingTypes[0];
    setItems([...items, {
      clothing_type_id: ct?.id || 1,
      clothing_name: ct?.name || 'Select Item',
      quantity: 1, // Default to 1 for better UX
      starch_level: 'no_starch', // Default to no_starch
      crease: 'no_crease', // Default to no_crease
      additional_charge: 0,
      plant_price: ct?.plant_price || 0,
      margin: ct?.margin || 0,
      item_total: (ct?.plant_price || 0) + (ct?.margin || 0),
    }]);
    saveViewMode('list'); // Switch to list view and save preference when manually adding
  };

  // --- NEW FUNCTION: addItemByTypeId for Grid View ---
  const addItemByTypeId = (clothingTypeId: number) => {
    const ct = clothingTypes.find(type => type.id === clothingTypeId);
    if (!ct) return;

    // Check if item already exists in the list to avoid duplicates right away
    // Instead of incrementing (which might be complex), we'll add a new line
    // Or, find the last item of this type and increment its quantity. Let's do a new line for simplicity.
    setItems([...items, {
      clothing_type_id: ct.id,
      clothing_name: ct.name,
      quantity: 1, // Grid view means selecting one item
      starch_level: 'no_starch', // Default to no_starch
      crease: 'no_crease', // Default to no_crease
      additional_charge: 0,
      plant_price: ct.plant_price,
      margin: ct.margin,
      item_total: ct.plant_price + ct.margin,
    }]);
  };
  // ----------------------------------------------------

  const updateItem = (index: number, updates: Partial<TicketItem>) => {
    const newItems = [...items];
    const oldItem = newItems[index];
    newItems[index] = { ...oldItem, ...updates };

    const clothingType = clothingTypes.find(ct => ct.id === newItems[index].clothing_type_id);
    if (clothingType) {
      // Recalculate prices based on the new clothing type and quantity
      const basePrice = clothingType.plant_price + clothingType.margin;
      const quantity = newItems[index].quantity || 0;
      const additionalCharge = newItems[index].additional_charge || 0;

      newItems[index].plant_price = clothingType.plant_price;
      newItems[index].margin = clothingType.margin;
      // Total is (Base Price * Quantity) + Additional Charge
      newItems[index].item_total = (basePrice * quantity) + additionalCharge;
    } else if ('clothing_type_id' in updates) {
      // If clothing_type_id was updated but not found, set item_total to 0 to prevent issues
      newItems[index].item_total = 0;
    }

    // Ensure total is recalculated if quantity or additional_charge changes even without type change
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

  const createTicket = async () => {
    // ... (omitted content for brevity)

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
      // Normalize values to match backend Pydantic models
      const mapStarchLevel = (val: any) => {
        if (!val) return 'none';
        const s = String(val).toLowerCase();
        if (s === 'no_starch' || s === 'none') return 'none';
        if (s === 'light' || s === 'low') return 'low';
        if (s === 'medium' || s === 'med') return 'medium';
        if (s === 'heavy' || s === 'high') return 'high';
        return 'none';
      };

      const ticketData = {
        customer_id: Number(selectedCustomer.id),
        items: itemsWithValidQuantity.map(item => ({
          clothing_type_id: Number(item.clothing_type_id),
          quantity: Number(item.quantity) || 0,
          // convert frontend strings to backend enum values
          starch_level: mapStarchLevel(item.starch_level),
          // backend expects a boolean for 'crease'
          crease: item.crease === true || item.crease === 'crease',
          additional_charge: Number(item.additional_charge) || 0.0,
        })),
        special_instructions: specialInstructions,
        pickup_date: pickupDate ? new Date(pickupDate).toISOString() : null,

        // Ensure paid_amount is a number
        paid_amount: Number(paidAmount) || 0.0,
      };
      console.log("Sent payload:", ticketData);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      // =================================================================
      // 3. (FIXED) Use axios.post to call the correct endpoint
      //    The user's hint "api/organizations" means the router prefix is
      //    /api/organizations and the ticket route is /tickets
      // =================================================================
      const response = await axios.post(
        `${baseURL}/api/organizations/tickets`, // ✅ Correct, prefixed URL
        ticketData,                            // The data payload
        {
          headers: {
            Authorization: `Bearer ${token}` // Send the auth token
          }
        }

      );

      // 4. Get the real ticket data from the API response
      const newTicket = response.data;

      // =================================================================
      // 5. Receipt Generation (This part is now safe to run)
      //    It correctly uses the `newTicket` object as the source of truth.
      // =================================================================

      // Calculate totals for receipt generation from the API response
      const receiptConfig = JSON.parse(localStorage.getItem(RECEIPT_STORAGE_KEY) || '{}');
      const taxRate = parseFloat(receiptConfig.tax_rate) || 0.0825;
      const envChargeRate = parseFloat(receiptConfig.env_charge_rate) || 0.047;
      const total = itemsWithValidQuantity.reduce((sum, item) => sum + item.item_total, 0);

      const subtotal = newTicket.total_amount;
      const envCharge = subtotal * envChargeRate;
      const tax = subtotal * taxRate;
      const finalTotal = subtotal + envCharge + tax;
      const totalPaid = newTicket.paid_amount;
      const balance = finalTotal - totalPaid;
      const totalPieces = newTicket.items.reduce((sum, item) => sum + item.quantity, 0);
      const now = new Date();
      const ticketDetails = newTicket; // Assumed alias for newTicket, backend should return customer_phone


      // Use centralized receipt renderer so DropOff and TicketManagement match exactly
      const html = renderReceiptHtml(newTicket as any);
      // store rendered HTML for plant-print and modal preview
      setPlantHtmlState(html);
      // Prepare preview content for customer receipt
      setPrintContent(html);
      setShowPrintPreview(true);
      // Show a concise success modal; the modal children render the styled receipt when success
      setModal({ isOpen: true, title: 'Ticket Created', type: 'success', message: 'Ticket created successfully.' });
      setLoading(false);

    } catch (error) {
      setLoading(false); // Turn off loading on error
      console.error('Failed to create ticket:', error);

      const errorMessage = error.response?.data?.detail ||
        (error instanceof Error ? error.message : 'Failed to create ticket. Please try again.');

      setModal({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
        type: 'error'
      });
    }
  };

  // Re-calculate totals every time `items` changes
  const { totalAmount, envCharge, tax, finalTotal } = useMemo(() => {
    const sum = items.reduce((subtotal, item) => subtotal + item.item_total, 0);
    // Use the hardcoded rates from the component's review step (lines 377-380) for consistency
    const env = sum * 0.047;
    const t = sum * 0.0825;
    const final = sum + env + t;
    return {
      totalAmount: sum,
      envCharge: env,
      tax: t,
      finalTotal: final
    };
  }, [items]);

  // A helper function to find the clothing type by ID for the dropdown/list view display
  const getClothingTypeById = (id: number) => clothingTypes.find(ct => ct.id === id);


  return (
    // ⭐ MODIFIED: Use 100% Width (w-full) with small padding (px-4) to use the whole page
    <div className="w-full max-w-full mx-auto px-4 py-4 min-h-screen bg-gray-100 font-sans">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Drop Off Clothes</h2>
        <div className="flex items-center mt-2 space-x-4">
          <div className={`flex items-center ${step === 'customer' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'customer' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
              }`}>1</div>
            <span className="ml-2">Customer</span>
          </div>
          <div className={`flex items-center ${step === 'items' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'items' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
              }`}>2</div>
            <span className="ml-2">Items</span>
          </div>
          <div className={`flex items-center ${step === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'review' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
              }`}>3</div>
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
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setStep('items');
                        }}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center">
                          {/* Main Icon */}
                          <User className="h-4 w-4 text-gray-400 mr-2" />

                          {/* UPDATED: Use first_name and last_name */}
                          <span className="font-medium">
                            {customer.first_name} {customer.last_name}
                          </span>

                          {/* UPDATED: Use email instead of phone, as phone isn't in the API response */}
                          {/* Make sure to import an 'Email' or 'Mail' icon */}
                          <Mail className="h-4 w-4 text-gray-400 ml-4 mr-2" />
                          <span className="text-gray-600">{customer.email}</span>

                          {/* REMOVED: last_visit_date is not provided by the API */}

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
                  <p className="text-amber-700 text-sm mt-1">
                    No customer found with "{customerSearch}". Please create a new customer below.
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowNewCustomerForm(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Customer
              </button>
            </div>
          ) : (
            <div>
              <h4 className="font-medium mb-4">New Customer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                {/* --- CHANGED --- */}
                <input
                  type="text"
                  placeholder="First Name *"
                  value={newCustomer.first_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {/* --- CHANGED --- */}
                <input
                  type="text"
                  placeholder="Last Name"
                  value={newCustomer.last_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {/* --- CHANGED (placeholder) --- */}
                <input
                  type="email"
                  placeholder="Email *"
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
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowNewCustomerForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createCustomer}
                  // --- CHANGED (validation logic) ---
                  disabled={!newCustomer.first_name || !newCustomer.phone || !newCustomer.email}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Customer
                </button>
              </div>
            </div>)}
        </div>
      )}

      {step === 'items' && selectedCustomer && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add Clothing Items</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Customer: <span className="font-medium">{selectedCustomer.name}</span>
              </span>
              {/* --- VIEW MODE TOGGLE BUTTONS (NOW WITH PERSISTENCE) --- */}
              <button
                onClick={() => saveViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                title="Grid View"
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => saveViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                title="List View"
              >
                <List className="h-5 w-5" />
              </button>
              {/* -------------------------------------------------------- */}
            </div>
          </div>

          {/* --- MODIFIED: 50/50 WIDE LAYOUT --- */}
          {/* ⭐ UPDATED: Used grid-cols-2 so both sides get equal space (50% each) to satisfy 'at least equal' */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

            {/* COLUMN 1: ITEM SELECTION UI (GRID or MANUAL ADD) */}
            {/* ⭐ UPDATED: Now takes 50% of the 100% width screen */}
            <div className="xl:col-span-1 lg:order-1">
              {viewMode === 'grid' && clothingTypes.length > 0 && (
                <div>
                  <ClothingGrid clothingTypes={clothingTypes} addItemByTypeId={addItemByTypeId} />
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Click on an item above to add it to the ticket list on the right.
                  </div>
                </div>
              )}

              {viewMode === 'list' && (
                <button
                  onClick={addItem}
                  className="w-full border-2 border-dashed border-gray-300 py-4 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors mb-4"
                >
                  <Plus className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                  <span className="text-gray-600">Add Clothing Item (Manual)</span>
                </button>
              )}
            </div>

            {/* COLUMN 2: CURRENT TICKET ITEMS LIST */}
            {/* ⭐ UPDATED: Now takes 50% of the 100% width screen */}
            <div className="xl:col-span-1 lg:order-2">
              <h4 className="text-md font-semibold mb-2">Current Ticket ({items.length} Items)</h4>
              {items.length === 0 && (
                <div className="p-4 text-center text-gray-500 border border-dashed rounded-lg">
                  No items added yet. Select or add an item.
                </div>
              )}

              {/* --- MODIFICATION START: ADDED COLUMN HEADERS FOR ITEM LIST --- */}
              {items.length > 0 && (
                // ⭐ MODIFIED: Responsive headers
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
              {/* --- MODIFICATION END --- */}

              {/* Added max-h and overflow-y for scrolling on long lists */}
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                {items.map((item, index) => (
                    // Grid column configuration for item line
                    // ⭐ UPDATED: Fits nicely in the 50% width container
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-gray-200 rounded-lg items-center">
                      {/* Item Type Display (NOT a dropdown) */}
                      <div className="col-span-3 flex flex-col">
                        <span className="font-medium text-sm truncate">{item.clothing_name}</span>
                        <span className="text-xs text-gray-500">${((getClothingTypeById(item.clothing_type_id)?.total_price) || item.item_total).toFixed(2)}</span>
                      </div>

                    {/* Quantity Input (text field to avoid number spinner) */}
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={String(item.quantity || '')}
                      onChange={(e) => {
                        // Allow typing but sanitize to digits only for calculation
                        const digits = e.target.value.replace(/\D/g, '');
                        const val = digits === '' ? 0 : parseInt(digits, 10);
                        updateItem(index, { quantity: val });
                      }}
                      className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 col-span-1 text-center"
                      required
                      placeholder="Qty"
                    />

                    {/* --- MODIFIED: Starch Buttons (Increased size via col-span-3) --- */}
                    <div className="flex space-x-1 col-span-3">
                      {/* The 'none' value is implicitly 'no_starch' for functionality */}
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
                    {/* ---------------------------------- */}

                    {/* --- MODIFIED: Crease Toggle Button --- */}
                    <button
                      onClick={() => updateItem(index, { crease: item.crease === 'crease' ? 'no_crease' : 'crease' as any })}
                      className={`w-full text-xs py-2 rounded-md transition-colors font-medium col-span-2 border ${item.crease === 'crease' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {item.crease === 'crease' ? 'Crease' : 'No Crease'}
                    </button>
                    {/* ---------------------------------- */}

                    {/* --- MODIFIED: Additional Charge Quick Input/Button --- */}
                    <div className="relative col-span-1">
                      {additionalChargeInputIndex === index ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.additional_charge === 0 ? '' : String(item.additional_charge)}
                          onChange={(e) => {
                            // sanitize to allow numbers and decimal point
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
                          className={`
                                    w-full text-xs py-2 rounded transition-colors font-medium truncate
                                    ${item.additional_charge > 0 ?
                              'bg-amber-500 text-white shadow-md' :
                              'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }
                                `}
                        >
                          {item.additional_charge > 0 ? `$${item.additional_charge.toFixed(2)}` : 'Add'}
                        </button>
                      )}
                    </div>
                    {/* ---------------------------------------------------- */}

                    {/* Total Display */}
                    <div className="px-1 py-2 bg-gray-50 rounded-lg text-center font-medium text-sm col-span-1">
                      ${item.item_total.toFixed(2)}
                    </div>

                    {/* Trash Button */}
                    <button
                      onClick={() => removeItem(index)}
                      className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors col-span-1 flex justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* ⭐ NEW BLOCK: Totals Summary placed below item list but before footer */}
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
              {/* ------------------------------------------------------------------ */}
            </div>

          </div>
          {/* --- END OF MODIFIED: WIDE LAYOUT --- */}


          <div className="mt-6"> {/* Moved instructions and footer outside the grid to span full width */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Any special handling instructions..."
              />
            </div>

            {/* ⭐ MODIFIED: Removed totals block from the footer */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep('customer')}
                className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              {/* NOTE: Totals Summary block was removed from here */}
              <button
                onClick={() => {
                  // Validate all required fields
                  const isValid = items.every(item =>
                    item.quantity > 0 &&
                    // NOTE: 'none' is no longer a valid starch/crease value after implementing buttons.
                    // The initial defaults are 'no_starch' and 'no_crease', which are valid.
                    true // Validation is implicitly handled by the item defaults
                  );
                  if (isValid) {
                    setStep('review');
                  } else {
                    setModal({
                      isOpen: true,
                      title: 'Required Fields Missing',
                      message: 'Please ensure all items have a quantity greater than zero.',
                      type: 'error'
                    });
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

            {/* --- EDITED: ADDED PICKUP DATE INPUT --- */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label htmlFor="pickup-date" className="block font-medium mb-2">
                **Scheduled Pickup Date & Time**
              </label>
              <input
                type="datetime-local"
                id="pickup-date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>
            {/* ------------------------------------- */}
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
                        {item.additional_charge > 0 && `, Additional charge: $${item.additional_charge.toFixed(2)}`}
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
            <button
              onClick={() => setStep('items')}
              className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Items
            </button>
            <div>
              <div className="text-sm text-gray-600 mb-1">SubTotal: ${totalAmount.toFixed(2)}</div>
              <div className="text-sm text-gray-600 mb-1">Env Charge (4.7%): ${envCharge.toFixed(2)}</div>
              <div className="text-sm text-gray-600 mb-1">Tax (8.25%): ${tax.toFixed(2)}</div>
              <div className="text-2xl font-bold text-blue-600 mb-2">Total: ${finalTotal.toFixed(2)}</div>
              <div className="text-sm text-gray-600 mb-1">
                <label className="block mb-1">Paid Amount:</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={finalTotal}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-lg font-semibold text-gray-800">Balance: ${(finalTotal - paidAmount).toFixed(2)}</div>
            </div>
            <button
              onClick={createTicket}
              disabled={loading}
              className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Ticket'}
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={() => {
          setModal({ isOpen: false, message: '', title: '', type: 'error' });
          if (modal.type === 'success') {
            // Only reset the form if it was a successful ticket creation
            setSelectedCustomer(null);
            setItems([]);
            setSpecialInstructions('');
            setPaidAmount(0); // Reset paid amount
            setStep('customer');
            setCustomerSearch('');
            setCustomers([]);
            // Keep pickupDate as default or calculate a new default
            setPickupDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16));
            // No longer reset setViewMode('grid') here, as the persistence logic handles the initial state on next load.
          }
        }}
        title={modal.title}
      >
        {modal.type === 'success' ? (
          // Render the styled receipt HTML (trusted) inside the modal for quick preview
          <div dangerouslySetInnerHTML={{ __html: plantHtmlState || modal.message }} />
        ) : (
          <div>{modal.message}</div>
        )}
      </Modal>
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onPrint={() => setShowPrintPreview(false)}
        content={printContent}
        extraActions={(
          <button
            onClick={() => {
              try {
                // This is the implementation of the "Print Plant (2 copies)" button
                const w = window.open('', '_blank');
                if (w) {
                  // Print plant copy twice
                  w.document.write(plantHtmlState + plantHtmlState);
                  w.document.close();
                  w.focus();
                  w.print();
                  setTimeout(() => { try { w.close(); } catch (e) { } }, 500);
                }
              } catch (e) { console.error(e); }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Print Plant (2 copies)
          </button>
        )}
      />
    </div>
  );
}