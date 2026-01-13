import React, { useState, useEffect } from 'react';
import { Search, User, ChevronRight, Users, UserPlus } from 'lucide-react';
import { useColors } from '../state/ColorsContext';
import axios from 'axios';
import baseURL from '../lib/config';
import CustomerProfile from './CustomerProfile';

interface CustomerSummary {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tenure: string;
}

export default function CustomerDirectory() {
  const { colors } = useColors();
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // --- FETCH LIST ---
  useEffect(() => {
    // Debounce search slightly to avoid too many API calls
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const url = searchQuery 
        ? `${baseURL}/api/organizations/customers?search=${searchQuery}` 
        : `${baseURL}/api/organizations/customers`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Handle removal from list when child deletes a customer
  const handleCustomerDeleted = (deletedId: number) => {
    setCustomers(prev => prev.filter(c => c.id !== deletedId));
    setSelectedCustomerId(null); // Close the modal
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden relative">
      
      {/* --- PROFILE MODAL OVERLAY --- */}
      {selectedCustomerId && (
        <div className="absolute inset-0 z-20">
             <CustomerProfile 
                customerId={selectedCustomerId} 
                onClose={() => setSelectedCustomerId(null)} 
                onDeleteSuccess={handleCustomerDeleted} // ✅ Passing the callback
             />
        </div>
      )}

      {/* HEADER */}
      <div className="p-4 bg-white border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Users size={20} style={{ color: colors.primaryColor }} />
          Customer Directory
        </h2>
        <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
                type="text" 
                placeholder="Search by name, phone, or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-0 rounded-lg text-sm transition-all"
            />
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading && <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>}
        
        {!loading && customers.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
                No customers found.
            </div>
        )}

        {!loading && (
          <ul className="space-y-2">
            {customers.map((customer) => (
              <li key={customer.id}>
                <button
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className="w-full text-left bg-white p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center overflow-hidden">
                      <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: colors.primaryColor, color: '#fff' }}>
                        {customer.first_name.charAt(0)}
                      </div>
                      <div className="ml-3 min-w-0">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 truncate" style={{ color: undefined }}>
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 gap-2 mt-0.5 truncate">
                          <span className="truncate">{customer.email || customer.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Tenure & Chevron */}
                    <div className="flex items-center pl-2 shrink-0">
                      <div className={`
                        px-2 py-0.5 inline-flex text-[10px] font-bold uppercase tracking-wide rounded-full 
                      `} style={customer.tenure === 'Prospect' ? undefined : { backgroundColor: colors.secondaryColor + '20', color: colors.secondaryColor, border: `1px solid ${colors.secondaryColor}20` }}>
                        {customer.tenure}
                      </div>
                      <ChevronRight className="ml-2 h-4 w-4 text-gray-300 group-hover:text-indigo-400" />
                    </div>

                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}