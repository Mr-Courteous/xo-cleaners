import React, { useState, useEffect } from 'react';
import { 
  Search, User, Phone, Mail, MapPin, Plus, 
  ChevronRight, X, Save, ArrowLeft, Edit2, Trash2,
  CheckCircle, AlertCircle, Calendar
} from 'lucide-react';
import axios from 'axios';
import baseURL from '../lib/config';
import { useColors } from '../state/ColorsContext';

// --- TYPES ---
interface Customer {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string; // Fallback
  email: string;
  phone: string;
  address?: string;
  tenure?: string;
  joined_at?: string;
}

export default function CustomerManagement() {
  const { colors } = useColors();
  // --- STATE ---
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'details' | 'edit'>('list');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success'|'error', message: string} | null>(null);

  // --- 1. FETCH CUSTOMERS ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (viewMode === 'list') {
        fetchCustomers();
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, viewMode]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const url = searchQuery 
        ? `${baseURL}/api/organizations/customers/search?query=${encodeURIComponent(searchQuery)}`
        : `${baseURL}/api/organizations/customers`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
      console.log("Fetched customers:", response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. CREATE CUSTOMER ---
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      
      // Sanitize Phone: Remove non-digits
      const cleanPhone = formData.phone.replace(/\D/g, ''); 

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        address: formData.address,
        phone: cleanPhone, 
        password: cleanPhone || "123456" // Default password
      };

      await axios.post(
        `${baseURL}/api/organizations/register-customers`, 
        payload, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showNotification('success', 'Customer created successfully!');
      resetForm();
      setViewMode('list');
      fetchCustomers();
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Failed to create customer.";
      showNotification('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // --- 3. UPDATE CUSTOMER ---
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety check
    if (!selectedCustomer) {
        showNotification('error', 'No customer selected.');
        return;
    }
    
    setActionLoading(true);
    
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            showNotification('error', 'Authentication token missing. Please login again.');
            return;
        }

        // 1. Clean data to match Backend Sanitization
        // Backend: clean_phone = ''.join(filter(str.isdigit, data.phone))
        const cleanPhone = formData.phone.replace(/\D/g, '');

        // 2. Construct Payload matching 'CustomerUpdate' Pydantic model
        const payload = {
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            // Backend SQL expects a value for address. Send empty string if null.
            address: formData.address ? formData.address.trim() : "", 
            phone: cleanPhone
        };

        // 3. Send PUT Request
        // Ensure 'baseURL' includes '/api/organizations' if your router is prefixed that way
        const response = await axios.put(
            `${baseURL}/api/organizations/customers/${selectedCustomer.id}`, 
            payload, 
            { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                } 
            }
        );
      
        // 4. Handle Success
        // The backend returns the updated customer object directly (updated_customer._mapping)
        setSelectedCustomer(response.data); 
        showNotification('success', 'Customer updated successfully!');
        setViewMode('details'); // Switch back to view mode
      
        // 5. Refresh the main list so the table updates immediately
        if (typeof fetchCustomers === 'function') {
            fetchCustomers(); 
        }

    } catch (error: any) {
        console.error("Update failed", error);
      
        // 6. Intelligent Error Handling
        // Captures backend 409 errors (Duplicate Email/Phone) or 403 (Permission denied)
        const msg = error.response?.data?.detail || "Failed to update customer.";
        showNotification('error', msg);
        
    } finally {
        setActionLoading(false);
    }
};
  // --- HELPER FUNCTIONS ---
  const showNotification = (type: 'success'|'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const resetForm = () => {
    setFormData({ first_name: '', last_name: '', phone: '', email: '', address: '' });
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewMode('details');
  };

  const initEditMode = () => {
    if (!selectedCustomer) return;
    setFormData({
      first_name: selectedCustomer.first_name || selectedCustomer.name?.split(' ')[0] || '',
      last_name: selectedCustomer.last_name || selectedCustomer.name?.split(' ').slice(1).join(' ') || '',
      phone: selectedCustomer.phone || '',
      email: selectedCustomer.email || '',
      address: selectedCustomer.address || ''
    });
    setViewMode('edit');
  };

  // --- 4. DELETE CUSTOMER (PERMANENT) ---
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    const confirmDelete = window.confirm(
      `Permanently delete ${selectedCustomer.first_name || selectedCustomer.name || 'this customer'}? This cannot be undone.`
    );
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(
        `${baseURL}/api/organizations/customers/${selectedCustomer.id}/permanent`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification('success', 'Customer permanently deleted.');
      setSelectedCustomer(null);
      setViewMode('list');
      fetchCustomers();
    } catch (error: any) {
      console.error('Delete failed', error);
      const msg = error.response?.data?.detail || 'Failed to delete customer.';
      showNotification('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete by id from list (prevents navigating into details by stopping propagation)
  const handleDeleteCustomerById = async (customerId: number, customerName?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const confirmDelete = window.confirm(
      `Permanently delete ${customerName || 'this customer'}? This cannot be undone.`
    );
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(
        `${baseURL}/api/organizations/customers/${customerId}/permanent`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification('success', 'Customer permanently deleted.');
      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer(null);
        setViewMode('list');
      }
      fetchCustomers();
    } catch (error: any) {
      console.error('Delete failed', error);
      const msg = error.response?.data?.detail || 'Failed to delete customer.';
      showNotification('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // --- RENDERERS ---

  // 1. LIST VIEW
  const renderList = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Directory</h1>
          <p className="text-sm text-gray-500">Manage and search your customer base</p>
        </div>
        <button
          onClick={() => { resetForm(); setViewMode('create'); }}
          className="flex items-center justify-center px-4 py-2 text-white rounded-lg transition-colors shadow-sm w-full sm:w-auto"
          style={{ backgroundColor: colors.primaryColor }}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 sm:text-sm"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No customers found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <li key={customer.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => handleSelectCustomer(customer)}>
                <div className="p-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: colors.primaryColor, color: '#fff' }}>
                      {(customer.first_name || customer.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4 truncate">
                      <div className="text-sm font-medium truncate" style={{ color: colors.primaryColor }}>
                        {customer.first_name ? `${customer.first_name} ${customer.last_name || ''}` : customer.name}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-1 sm:gap-3 mt-0.5">
                        {customer.email && <span>{customer.email}</span>}
                        {customer.email && customer.phone && <span className="hidden sm:inline text-gray-300">•</span>}
                        {customer.phone && <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {customer.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center ml-4 gap-2">
                    {customer.tenure && (
                      <span className={`hidden sm:inline-flex px-2 py-0.5 text-xs font-semibold rounded-full`} style={customer.tenure === 'Prospect' ? undefined : { backgroundColor: colors.secondaryColor + '20', color: colors.secondaryColor }}>
                        {customer.tenure}
                      </span>
                    )}
                    <button
                      onClick={(e) => handleDeleteCustomerById(customer.id, customer.first_name || customer.name, e)}
                      disabled={actionLoading}
                      className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded transition"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  // 2. DETAILS VIEW
  const renderDetails = () => {
    if (!selectedCustomer) return null;
    const displayName = selectedCustomer.first_name 
        ? `${selectedCustomer.first_name} ${selectedCustomer.last_name || ''}` 
        : selectedCustomer.name;

    return (
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button 
          onClick={() => setViewMode('list')}
          className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Directory
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border-2 border-white/20 text-2xl font-bold">
                {displayName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{displayName}</h2>
                <div className="flex items-center mt-2 gap-2">
                   <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 border border-white/10">
                     {selectedCustomer.tenure || 'Customer'}
                   </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={initEditMode}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition text-white"
                title="Edit Customer"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={actionLoading}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition text-white flex items-center"
                title="Permanently Delete Customer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Contact Info</h3>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Address</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Account Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                 <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-700">Joined Date</span>
                 </div>
                 <p className="text-sm text-gray-600 pl-6">
                    {selectedCustomer.joined_at 
                      ? new Date(selectedCustomer.joined_at).toLocaleDateString() 
                      : 'N/A'
                    }
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 3. CREATE / EDIT FORM VIEW
  const renderForm = () => {
    const isEdit = viewMode === 'edit';
    const title = isEdit ? 'Edit Customer' : 'Add New Customer';
    const submitHandler = isEdit ? handleUpdateSubmit : handleCreateSubmit;

    return (
      <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
        <button 
          onClick={() => setViewMode(isEdit ? 'details' : 'list')}
          className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {isEdit ? 'Back to Details' : 'Back to Directory'}
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {isEdit && (
               <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded font-mono">
                 ID: {selectedCustomer?.id}
               </span>
            )}
          </div>
          
          <div className="p-6">
            <form onSubmit={submitHandler} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="block w-full pl-10 border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="block w-full pl-10 border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="customer@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Physical Address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="block w-full pl-10 border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="123 Main St..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setViewMode(isEdit ? 'details' : 'list')}
                  className="mr-3 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 flex items-center"
                >
                  {actionLoading ? 'Saving...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEdit ? 'Update Customer' : 'Create Customer'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {viewMode === 'list' && renderList()}
      {viewMode === 'details' && renderDetails()}
      {(viewMode === 'create' || viewMode === 'edit') && renderForm()}
    </div>
  );
}