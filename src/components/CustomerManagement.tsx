import React, { useState } from 'react';
import { Search, User, Phone, Mail, MapPin, Plus, Calendar } from 'lucide-react';
// import { apiCall } from '../hooks/useApi'; // --- REMOVED ---
import axios from 'axios'; // --- NEW ---
import baseURL from '../lib/config'; // --- NEW ---
import { Customer } from '../types';

export default function CustomerManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false); // For new customer form

  // --- UPDATED: searchCustomers function ---
  const searchCustomers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token not found");

      const headers = { 'Authorization': `Bearer ${token}` };

      // Use the full, secured API path
      const response = await axios.get(
        `${baseURL}/api/organizations/customers/search?query=${encodeURIComponent(searchQuery)}`,
        { headers }
      );
      
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to search customers:', error);
      alert('Failed to search customers.');
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATED: createCustomer function ---
  const createCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert("Full Name and Phone are required.");
      return;
    }
    
    setFormLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token not found");

      const headers = { 'Authorization': `Bearer ${token}` };

      // Assume the creation path is also under /api/organizations
      // The backend needs to handle the "name" field and split it
      // into first_name/last_name if necessary.
      const response = await axios.post(
        `${baseURL}/api/organizations/register-customer`,
        newCustomer, // Send the newCustomer object as data
        { headers }
      );

      const customer = response.data; // Get customer from response
      
      setCustomers([customer, ...customers]);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      setShowNewForm(false);
      alert('Customer created successfully!');
      
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      alert(`Failed to create customer: ${error.response?.data?.detail || error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  // --- (Existing) Form change handler ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCustomer({
      ...newCustomer,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="p-4">
      {/* Search Bar & New Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 flex-grow">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchCustomers()}
            placeholder="Search by Name, Phone, or Email..."
            className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchCustomers}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="ml-4 px-4 py-3 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-1" />
          New Customer
        </button>
      </div>

      {/* New Customer Form */}
      {showNewForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
          <h3 className="text-xl font-semibold mb-4">Create New Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name (Required)"
              value={newCustomer.name}
              onChange={handleFormChange}
              className="p-3 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone (Required)"
              value={newCustomer.phone}
              onChange={handleFormChange}
              className="p-3 border border-gray-300 rounded-lg"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={newCustomer.email}
              onChange={handleFormChange}
              className="p-3 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={newCustomer.address}
              onChange={handleFormChange}
              className="p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 text-gray-700 mr-2"
            >
              Cancel
            </button>
            <button
              onClick={createCustomer}
              disabled={formLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
            >
              {formLoading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </div>
      )}

      {/* Loading & Results */}
      {loading && (
        <div className="text-center p-6 text-gray-500">
          <p>Loading customers...</p>
        </div>
      )}

      {!loading && customers.length === 0 && (
        <div className="text-center p-6 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No customers found. Try a search or create a new one.</p>
        </div>
      )}

      {/* Customer List */}
      {!loading && customers.length > 0 && (
        <div className="space-y-4">
          {customers.map((customer) => (
            <div key={customer.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <User className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-xl font-bold text-gray-900">{customer.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">{customer.phone}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  {customer.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {customer.email}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {customer.address}
                    </div>
                  )}
                  {customer.last_visit_date && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Last visit: {new Date(customer.last_visit_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}