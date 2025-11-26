import React, { useState, useEffect } from 'react';
import { Calendar, Mail, Phone, MapPin, Clock, Edit2, Save, X, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import baseURL from '../lib/config'; // Ensure this path is correct

// --- INTERNAL TYPE DEFINITIONS ---
interface CustomerData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  organization_id: number;
  joined_at: string | null; // ISO Date string
  tenure: string;
}

interface CustomerProfileProps {
  customerId: number;
  onClose?: () => void;
}

export default function CustomerProfile({ customerId, onClose }: CustomerProfileProps) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // --- ADMIN EDIT STATE ---
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false);
  const [editDateValue, setEditDateValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // --- PERMISSIONS ---
  const userRole = localStorage.getItem('role') || ''; 
  const canEdit = ['store_admin', 'org_owner', 'STORE_OWNER', 'platform_admin'].includes(userRole);

  useEffect(() => {
    // FIX: If no ID is passed, stop loading immediately
    if (!customerId) {
      setLoading(false);
      return;
    }
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error("No access token found.");

      // console.log("Fetching details for Customer ID:", customerId); // Debug log

      const response = await axios.get<CustomerData>(`${baseURL}/api/organizations/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCustomer(response.data);
      
      // Pre-fill the date picker if data exists
      if (response.data.joined_at) {
        setEditDateValue(new Date(response.data.joined_at).toISOString().split('T')[0]);
      }
      setError(''); // Clear previous errors
    } catch (err: any) {
      console.error("Error fetching customer:", err);
      setError(err.response?.data?.detail || 'Failed to load customer details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDate = async () => {
    if (!editDateValue) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      await axios.patch(
        `${baseURL}/api/organizations/customers/${customerId}/joined-date`,
        { joined_at: new Date(editDateValue).toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchCustomerDetails(); // Refresh to update the tenure badge
      setIsEditingDate(false);
    } catch (err) {
      alert('Failed to update date. Please check your connection or permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDER STATES ---

  if (loading) return (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  // Handle case where no ID was passed or API failed
  if (!customerId || error || !customer) return (
    <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-100">
        {error || 'No customer selected.'}
    </div>
  );

  const isProspect = customer.tenure === 'Prospect';
  const badgeStyle = isProspect 
    ? 'bg-gray-100 text-gray-600 border-gray-200' 
    : 'bg-indigo-50 text-indigo-700 border-indigo-200';

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full max-w-2xl mx-auto">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-full transition text-white">
            <X size={20} />
          </button>
        )}
        
        <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border-2 border-white/20 text-2xl font-bold">
                {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
            </div>
            <div>
                <h2 className="text-2xl font-bold">{customer.first_name} {customer.last_name}</h2>
                <div className="flex items-center mt-2 gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm ${badgeStyle}`}>
                        <Clock size={12} />
                        {customer.tenure}
                    </span>
                </div>
            </div>
        </div>
      </div>

      {/* BODY */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Contact */}
        <div className="space-y-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Contact Information</h3>
            
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-gray-900">Email Address</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-gray-900">Phone Number</p>
                        <p className="text-sm text-gray-600">{customer.phone || 'N/A'}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-gray-900">Address</p>
                        <p className="text-sm text-gray-600">{customer.address || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Loyalty */}
        <div className="space-y-5">
            <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Loyalty Status</h3>
                
                {canEdit && !isEditingDate && (
                    <button 
                        onClick={() => setIsEditingDate(true)} 
                        className="text-gray-400 hover:text-indigo-600 transition flex items-center gap-1 text-xs"
                        title="Edit Joined Date (Admin Only)"
                    >
                        <Edit2 size={12} /> Edit Date
                    </button>
                )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-4">
                
                {/* Joined Date Field */}
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Member Since (Joined Date)</label>
                    
                    {isEditingDate ? (
                        <div className="flex items-center gap-2 animate-fadeIn">
                            <input 
                                type="date" 
                                value={editDateValue}
                                onChange={(e) => setEditDateValue(e.target.value)}
                                className="text-sm border border-indigo-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 w-full"
                            />
                            <button 
                                onClick={handleSaveDate} 
                                disabled={isSaving}
                                className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 shadow-sm"
                            >
                                <Save size={14} />
                            </button>
                            <button 
                                onClick={() => setIsEditingDate(false)} 
                                className="bg-white text-gray-600 border border-gray-300 p-1.5 rounded hover:bg-gray-100 shadow-sm"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-semibold text-gray-900">
                                {customer.joined_at 
                                    ? new Date(customer.joined_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) 
                                    : <span className="text-gray-400 italic font-normal">No purchases yet (Prospect)</span>
                                }
                            </span>
                        </div>
                    )}
                </div>

                {/* Tenure Field */}
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Current Tenure</label>
                    <div className="text-sm font-bold text-gray-800">
                        {customer.tenure}
                    </div>
                </div>
            </div>

            {canEdit && isEditingDate && (
                <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                    <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                    <span>Warning: Changing this date affects loyalty calculations. This action is audited.</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}