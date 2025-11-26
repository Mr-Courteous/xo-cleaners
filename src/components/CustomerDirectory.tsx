import React, { useState, useEffect } from 'react';
import { Search, User, ChevronRight, Users } from 'lucide-react';
import axios from 'axios';
import baseURL from '../lib/config';
import CustomerProfile from './CustomerProfile'; // Import the profile view we made
// Define the summary type for the list view
interface CustomerSummary {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tenure: string;
}

export default function CustomerDirectory() {
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

      const response = await axios.get<CustomerSummary[]>(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setLoading(false);
    }
  };

  // --- VIEW 1: DETAIL PROFILE (If a customer is selected) ---
  if (selectedCustomerId) {
    return (
      <div className="max-w-3xl mx-auto mt-6">
        {/* Back Button */}
        <button 
          onClick={() => setSelectedCustomerId(null)}
          className="mb-4 flex items-center text-gray-600 hover:text-blue-600 transition"
        >
          <span className="mr-1">←</span> Back to Directory
        </button>
        
        {/* The Profile Component we created earlier */}
        <CustomerProfile 
          customerId={selectedCustomerId} 
          onClose={() => setSelectedCustomerId(null)} 
        />
      </div>
    );
  }

  // --- VIEW 2: SEARCH & LIST (Default) ---
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600" />
          Customer Directory
        </h1>
        <p className="text-gray-500 mt-1">Search and manage your customer base.</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm shadow-sm"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Results List */}
      <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Searching...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
              <User size={48} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search or create a new customer.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <li key={customer.id}>
                <button
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className="block hover:bg-blue-50 w-full text-left transition duration-150 ease-in-out focus:outline-none"
                >
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {customer.first_name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-blue-600 truncate">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 gap-3 mt-0.5">
                          <span>{customer.email}</span>
                          <span className="text-gray-300">•</span>
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Tenure & Chevron */}
                    <div className="flex items-center">
                      <div className={`
                        px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${customer.tenure === 'Prospect' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}
                      `}>
                        {customer.tenure}
                      </div>
                      <ChevronRight className="ml-4 h-5 w-5 text-gray-400" />
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