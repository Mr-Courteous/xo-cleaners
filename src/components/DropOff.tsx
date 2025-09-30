import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, User, Phone, Calendar } from 'lucide-react';
import { apiCall } from '../hooks/useApi';
import { Customer, ClothingType, TicketItem } from '../types';
import Modal from './Modal';

export default function DropOff() {
  const [step, setStep] = useState<'customer' | 'items' | 'review'>('customer');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [clothingTypes, setClothingTypes] = useState<ClothingType[]>([]);
  const [items, setItems] = useState<TicketItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ 
    isOpen: false, 
    message: '', 
    title: '', 
    type: 'error' as 'error' | 'success' 
  });

  useEffect(() => {
    console.log('Fetching clothing types...');
    fetchClothingTypes();
  }, []);

  const fetchClothingTypes = async () => {
    try {
      const types = await apiCall('/clothing-types');
      setClothingTypes(types);
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
      const results = await apiCall(`/customers/search?query=${encodeURIComponent(query)}`);
      setCustomers(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Failed to search customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    try {
      const customer = await apiCall('/customers', {
        method: 'POST',
        body: JSON.stringify(newCustomer),
      });
      setSelectedCustomer(customer);
      setShowNewCustomerForm(false);
      setStep('items');
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

  const addItem = () => {
    const ct = clothingTypes[0];
    setItems([...items, {
      clothing_type_id: ct?.id || 1,
      clothing_name: ct?.name || '',
      quantity: 0,
      starch_level: 'none',
      crease: 'none',
      additional_charge: 0,
      plant_price: ct?.plant_price || 0,
      margin: ct?.margin || 0,
      item_total: (ct?.plant_price || 0) + (ct?.margin || 0),
    }]);
  };

  const updateItem = (index: number, updates: Partial<TicketItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    const clothingType = clothingTypes.find(ct => ct.id === newItems[index].clothing_type_id);
    if (clothingType) {
      newItems[index].plant_price = clothingType.plant_price;
      newItems[index].margin = clothingType.margin;
      newItems[index].item_total = (clothingType.plant_price + clothingType.margin) * (newItems[index].quantity || 1) + (newItems[index].additional_charge || 0);
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const createTicket = async () => {
    if (!selectedCustomer || items.length === 0) return;
    
    try {
      const response = await apiCall('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          items,
          special_instructions: specialInstructions,
          paid_amount: paidAmount,
        }),
      });
      
      // Get full ticket details
      const ticketDetails = await apiCall(`/tickets/${response.ticket.id}`);

      console.log('Ticket details:', ticketDetails);
      
      // Show success modal with ticket details and print button
      const now = new Date();
      const readyDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const subtotal = ticketDetails.total_amount;
      const envCharge = subtotal * 0.047;
      const tax = subtotal * 0.0825;
      const total = subtotal + envCharge + tax;
      
      setModal({
        isOpen: true,
        title: '',
        type: 'success',
        message: `
          <div style="width: 400px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif; font-size: 16px;">
            <style>
              @media screen {
                .ticket-content {
                  max-height: 80vh;
                  overflow-y: auto;
                  padding-right: 16px;
                }
                .print-button {
                  position: sticky;
                  bottom: 0;
                  background: white;
                  padding: 16px;
                  border-top: 1px solid #e5e7eb;
                }
              }
              @media print {
                .ticket-content {
                  max-height: none;
                  overflow: visible;
                  padding-right: 0;
                }
                .print-button {
                  display: none;
                }
              }
            </style>
            <div class="ticket-content">
            <div style="text-align: center;">
              <div style="font-size: 40px; font-weight: 600; margin-bottom: 20px;">${response.ticket.ticket_number}</div>
              <div style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">Airport Cleaners</div>
              <div style="font-size: 18px;">12300 Fondren Road, Houston TX 77035</div>
              <div style="font-size: 18px;">(713) 723-5579</div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin: 20px 0; font-size: 18px;">
              <div>${now.toLocaleDateString()} ${now.toLocaleTimeString('en-US', { 
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}</div>
            </div>
            
                            <div style="font-size: 20px; margin-bottom: 16px;">
              <div style="font-weight: 500; margin-bottom: 4px;">${ticketDetails.customer_phone}</div>
              <div style="margin-bottom: 4px;">Phone: ${ticketDetails.customer_address}</div>
              <div>ACCT: ${selectedCustomer?.id || ''}</div>
            </div>            <div style="margin: 20px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 12px 0;">
              ${ticketDetails.items.map((item: any) => `
                <div style="margin-bottom: 12px; font-size: 18px;">
                  <div style="display: flex; justify-content: space-between;">
                    <div style="font-weight: 500; display: flex; gap: 8px;">
                      <span>${item.clothing_name}</span>
                      <span>${item.quantity}</span>
                    </div>
                    <div style="font-weight: 500;">$${item.item_total.toFixed(2)}</div>
                  </div>
                  ${item.starch_level !== 'no_starch' ? `<div style="color: #444;">${item.starch_level} Starch</div>` : ''}
                  ${item.crease === 'crease' ? '<div style="color: #444;">With Crease</div>' : ''}
                </div>
              `).join('')}
            </div>
            
            <div style="font-size: 20px; font-weight: 600; margin: 16px 0;">
              ${ticketDetails.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} PIECES
            </div>
            
            <div style="margin: 16px 0; font-size: 18px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <div>SubTotal:</div>
                <div>$${subtotal.toFixed(2)}</div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <div>Env Charge:</div>
                <div>$${envCharge.toFixed(2)}</div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <div>Tax:</div>
                <div>$${tax.toFixed(2)}</div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 20px; font-weight: 600;">
                <div>Total:</div>
                <div>$${total.toFixed(2)}</div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <div>Paid Amount:</div>
                <div>$${paidAmount.toFixed(2)}</div>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 600;">
                <div>Balance:</div>
                <div>$${(total - paidAmount).toFixed(2)}</div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 20px 0; font-size: 20px; font-weight: 500;">
              Ready: ${readyDate.toLocaleDateString()} 05:00 PM
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <div style="font-size: 28px; font-weight: 600; margin-bottom: 8px;">REG/PICKUP</div>
              <div style="font-size: 18px;">Thank You For Your Business</div>
            </div>
            
            </div>
            <div class="print-button">
              <button
                onclick="window.print()"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Print Receipt
              </button>
            </div>
          </div>
        `,
      });
      
    } catch (error) {
      console.error('Failed to create ticket:', error);
      setModal({
        isOpen: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create ticket. Please try again.',
        type: 'error'
      });
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.item_total, 0);
  const envCharge = totalAmount * 0.047;
  const tax = totalAmount * 0.0825;
  const finalTotal = totalAmount + envCharge + tax;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Drop Off Clothes</h2>
        <div className="flex items-center mt-2 space-x-4">
          <div className={`flex items-center ${step === 'customer' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'customer' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
            }`}>1</div>
            <span className="ml-2">Customer</span>
          </div>
          <div className={`flex items-center ${step === 'items' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'items' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
            }`}>2</div>
            <span className="ml-2">Items</span>
          </div>
          <div className={`flex items-center ${step === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'review' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
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
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-medium">{customer.name}</span>
                          <Phone className="h-4 w-4 text-gray-400 ml-4 mr-2" />
                          <span className="text-gray-600">{customer.phone}</span>
                          {customer.last_visit_date && (
                            <Calendar className="h-4 w-4 text-gray-400 ml-4 mr-2" />
                          )}
                          {customer.last_visit_date && (
                            <span className="text-gray-500 text-sm">
                              Last visit: {new Date(customer.last_visit_date).toLocaleDateString()}
                            </span>
                          )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  disabled={!newCustomer.name || !newCustomer.phone}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Customer
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'items' && selectedCustomer && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add Clothing Items</h3>
            <div className="text-sm text-gray-600">
              Customer: <span className="font-medium">{selectedCustomer.name}</span>
            </div>
          </div>
          
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border border-gray-200 rounded-lg mb-4">
              <select
                value={item.clothing_type_id}
                onChange={(e) => updateItem(index, { clothing_type_id: parseInt(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {clothingTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} (${type.total_price})
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                min="1"
                value={item.quantity || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                  updateItem(index, { quantity: val });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Enter quantity"
              />
              
              <select
                value={item.starch_level}
                onChange={(e) => updateItem(index, { starch_level: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="none">Select Starch Level</option>
                <option value="no_starch">No Starch</option>
                <option value="light">Light Starch</option>
                <option value="medium">Medium Starch</option>
                <option value="heavy">Heavy Starch</option>
              </select>
              
              <select
                value={item.crease}
                onChange={(e) => updateItem(index, { crease: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="none">Select Crease Option</option>
                <option value="no_crease">No Crease</option>
                <option value="crease">Crease</option>
              </select>

              <input
                type="number"
                min="0"
                step="0.01"
                value={item.additional_charge || 0}
                onChange={(e) => updateItem(index, { additional_charge: parseFloat(e.target.value) || 0 })}
                placeholder="Additional Charge"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-center font-medium">
                ${item.item_total.toFixed(2)}
              </div>
              
              <button
                onClick={() => removeItem(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          <button
            onClick={addItem}
            className="w-full border-2 border-dashed border-gray-300 py-4 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors mb-4"
          >
            <Plus className="h-5 w-5 mx-auto mb-1 text-gray-400" />
            <span className="text-gray-600">Add Clothing Item</span>
          </button>
          
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
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep('customer')}
              className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <div>
              <div className="text-sm mb-1">SubTotal: ${totalAmount.toFixed(2)}</div>
              <div className="text-sm mb-1">Env Charge (4.7%): ${envCharge.toFixed(2)}</div>
              <div className="text-sm mb-1">Tax: ${tax.toFixed(2)}</div>
              <div className="text-xl font-bold">Total: ${finalTotal.toFixed(2)}</div>
            </div>
            <button
              onClick={() => {
                // Validate all required fields
                const isValid = items.every(item => 
                  item.quantity > 0 && 
                  item.starch_level !== 'none' && 
                  item.crease !== 'none'
                );
                if (isValid) {
                  setStep('review');
                } else {
                  setModal({
                    isOpen: true,
                    title: 'Required Fields',
                    message: 'Please fill in all required fields for each item (quantity, starch level, and crease option)',
                    type: 'error'
                  });
                }
              }}
              disabled={items.length === 0}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Review Order
            </button>
          </div>
        </div>
      )}

      {step === 'review' && selectedCustomer && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Review Order</h3>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Customer Information</h4>
            <p><strong>Name:</strong> {selectedCustomer.name}</p>
            <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
            {selectedCustomer.email && <p><strong>Email:</strong> {selectedCustomer.email}</p>}
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2">Items</h4>
            <div className="space-y-2">
              {items.map((item, index) => {
                const clothingType = clothingTypes.find(ct => ct.id === item.clothing_type_id);
                return (
                  <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <div>
                      <span className="font-medium">{clothingType?.name}</span>
                      <span className="text-gray-600 ml-2">×{item.quantity}</span>
                      <div className="text-sm text-gray-500">
                        {item.starch_level !== 'no_starch' && `${item.starch_level} starch`}
                        {item.starch_level !== 'no_starch' && item.crease === 'crease' && ', '}
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
              className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
            >
              Generate Ticket
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
            setStep('customer');
            setCustomerSearch('');
            setCustomers([]);
          }
        }}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
}