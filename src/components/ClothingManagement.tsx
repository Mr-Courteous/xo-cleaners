import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Save, X, Shirt, Upload, Image, AlertCircle, 
  Loader2, DollarSign, List, Info // 🎯 Added DollarSign, List, Info
} from 'lucide-react';
import baseURL from '../lib/config';

// 🎯 Mocking types for compilation in this environment
interface ClothingType {
  id: number;
  name: string;
  plant_price: number;
  margin: number;
  total_price: number;
  image_url: string | null;
  pieces?: number;
}

// Fallback image function
const getFallbackImage = (name: string) => {
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return `https://via.placeholder.com/150/${Math.abs(hash % 16777215).toString(16).padStart(6, '0')}/FFFFFF?text=${encodeURIComponent(name.charAt(0) || '?')}`;
};

// Helper function to get Authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  const headers = new Headers();
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  return headers;
};

// ==========================================
// 🆕 NEW: Starch Settings Component
// ==========================================
const StarchSettings: React.FC = () => {
    const [prices, setPrices] = useState({
        starch_price_light: '',
        starch_price_medium: '',
        starch_price_heavy: '',
        starch_price_extra_heavy: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${baseURL}/api/settings`, { headers }); // Assuming /api/settings returns the org settings
            if (response.ok) {
                const data = await response.json();
                setPrices({
                    starch_price_light: data.starch_price_light || 0,
                    starch_price_medium: data.starch_price_medium || 0,
                    starch_price_heavy: data.starch_price_heavy || 0,
                    starch_price_extra_heavy: data.starch_price_extra_heavy || 0
                });
            }
        } catch (error) {
            console.error("Error fetching starch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (parseFloat(value) < 0) return;
        setPrices(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const headers = getAuthHeaders();
            headers.append('Content-Type', 'application/json');

            const payload = {
                starch_price_light: parseFloat(String(prices.starch_price_light)) || 0,
                starch_price_medium: parseFloat(String(prices.starch_price_medium)) || 0,
                starch_price_heavy: parseFloat(String(prices.starch_price_heavy)) || 0,
                starch_price_extra_heavy: parseFloat(String(prices.starch_price_extra_heavy)) || 0,
            };

            const response = await fetch(`${baseURL}/api/settings/starch-prices`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || 'Failed to update prices');
            }

            setMessage({ type: 'success', text: "Starch prices updated successfully!" });
            fetchSettings();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || "Failed to update prices." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-4xl">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                    <DollarSign className="w-5 h-5 text-blue-600" /> Starch Pricing Configuration
                </h3>
                <p className="text-sm text-gray-500 mt-1">Set the additional upcharge applied to items for each starch level.</p>
            </div>
            <form onSubmit={handleSave} className="p-6">
                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <Info className="w-5 h-5 mr-2" /> {message.text}
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Render inputs dynamically or manually */}
                    {[
                        { key: 'starch_price_light', label: 'Light Starch' },
                        { key: 'starch_price_medium', label: 'Medium Starch' },
                        { key: 'starch_price_heavy', label: 'Heavy Starch' },
                        { key: 'starch_price_extra_heavy', label: 'Extra Heavy Starch' }
                    ].map(({ key, label }) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{label} ($)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number" step="0.01" 
                                    name={key} 
                                    value={(prices as any)[key]} 
                                    onChange={handleChange}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex justify-end">
                    <button type="submit" disabled={saving} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ClothingManagement() {
  // 🎯 Added Tab State
  const [activeTab, setActiveTab] = useState<'items' | 'starch'>('items');

  const [clothingTypes, setClothingTypes] = useState<ClothingType[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    plant_price: '',
    margin: '',
    pieces: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isDeleting, setIsDeleting] = useState(false);     
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: number, name: string } | null>(null);

  // Effect to create/revoke image preview URL
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    // Don't clear preview if we're just in edit mode without a new file
    if (!editingId) {
       setImagePreviewUrl(null);
    }
    return;
  }, [imageFile, editingId]);

  // Initial fetch
  useEffect(() => {
    fetchClothingTypes();
  }, []);

  // Fetch clothing types using fetch, baseURL, and auth
  const fetchClothingTypes = async () => {
    setLoading(true);
    setFormError(null);
    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${baseURL}/api/clothing-types`, {
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clothing types');
      }
      const data: ClothingType[] = await response.json();
      // Process URLs to be absolute
      const processedData = data.map(item => ({
        ...item,
        image_url: item.image_url
          ? (item.image_url.startsWith('http') ? item.image_url : `${baseURL}${item.image_url}`)
          : null,
        pieces: (item as any).pieces ? (item as any).pieces : 1,
      }));
      setClothingTypes(processedData);
      console.log(processedData)
    } catch (error: any) {
      console.error('Failed to fetch clothing types:', error);
      setFormError(`Failed to load items: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Form validation helper
  const validateForm = (isCreating: boolean): boolean => {
    setFormError(null);
    if (!formData.name.trim()) {
      setFormError("Item Name is required.");
      return false;
    }
    const plantPrice = parseFloat(formData.plant_price);
    if (isNaN(plantPrice) || plantPrice < 0) {
      setFormError("Plant Price must be a valid, positive number.");
      return false;
    }
    const margin = parseFloat(formData.margin);
    if (isNaN(margin) || margin < 0) {
      setFormError("Margin must be a valid, positive number.");
      return false;
    }
    const piecesVal = parseInt(formData.pieces, 10);
    if (isNaN(piecesVal) || piecesVal <= 0) {
      setFormError("Pieces must be a valid positive integer (e.g., Suit=2).");
      return false;
    }
    if (isCreating && !imageFile) {
        setFormError("Item Image is required when creating a new item.");
        return false;
    }
    return true;
  }

  // Handle create (POST) and update (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isCreating = !editingId;
    if (!validateForm(isCreating)) {
      return;
    }
    
    setIsSubmitting(true); 
    setFormError(null);

    // Both Create and Update use FormData as per the Python backend
    const form = new FormData();
    form.append('name', formData.name);
    form.append('plant_price', formData.plant_price);
    form.append('margin', formData.margin);
    
    // The backend expects the uploaded file under the key 'image_file'
    if (imageFile) {
      form.append('image_file', imageFile);
    }
    // pieces
    form.append('pieces', formData.pieces);

    const authHeaders = getAuthHeaders();
    
    try {
      const url = editingId 
        ? `${baseURL}/api/clothing-types/${editingId}` // PUT
        : `${baseURL}/api/clothing-types`; // POST
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: form,
        headers: authHeaders,
      });

      if (!response.ok) {
        // ... (Error parsing logic from your code)
          const text = await response.text().catch(() => '');
          let parsed: any = null;
          try {
            parsed = text ? JSON.parse(text) : null;
          } catch (e) { /* not JSON */ }

          let serverMessage = '';
          if (parsed) {
            if (typeof parsed.detail === 'string') serverMessage = parsed.detail;
            else if (parsed.detail) serverMessage = JSON.stringify(parsed.detail);
            else if (parsed.message) serverMessage = parsed.message;
            else serverMessage = JSON.stringify(parsed);
          } else {
            serverMessage = text || '';
          }
          const verb = method === 'POST' ? 'create' : 'update';
          const finalMsg = serverMessage ? `${serverMessage}` : `Failed to ${verb} item.`;
          throw new Error(finalMsg);
      }
      
      resetForm();
      fetchClothingTypes(); // Refresh list
    } catch (error: any) {
      console.error('Submission failed:', error);
      setFormError(`Failed to save item: ${error.message || String(error)}`);
    } finally {
      setIsSubmitting(false); 
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setImageFile(file);
  };

  const handleEdit = (clothingType: ClothingType) => {
    setEditingId(clothingType.id);
    setFormData({
      name: clothingType.name,
      plant_price: clothingType.plant_price.toString(),
      margin: clothingType.margin.toString(),
      pieces: (clothingType as any).pieces ? String((clothingType as any).pieces) : '1'
    });
    setImageFile(null); 
    setImagePreviewUrl(clothingType.image_url); 
    setShowAddForm(true);
    setFormError(null);
  };

  const handleDelete = (id: number, name: string) => {
    setShowDeleteConfirm({ id, name });
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    
    setIsDeleting(true); 

    const { id } = showDeleteConfirm;
    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${baseURL}/api/clothing-types/${id}`, { 
        method: 'DELETE',
        headers: authHeaders
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete item.');
      }

      fetchClothingTypes(); // Refresh list
    } catch (error: any) {
      console.error('Failed to delete clothing type:', error);
      setFormError(`Failed to delete item: ${error.message}`);
    } finally {
      setShowDeleteConfirm(null);
      setIsDeleting(false); 
    }
  };

  const resetForm = () => {
    setFormData({ name: '', plant_price: '', margin: '', pieces: '' });
    setImageFile(null); 
    setImagePreviewUrl(null); 
    setShowAddForm(false);
    setEditingId(null);
    setFormError(null);
  };

  const calculateTotal = () => {
    const plantPrice = parseFloat(formData.plant_price) || 0;
    const margin = parseFloat(formData.margin) || 0;
    // Using the 'plant_price + margin' formula as per your backend
    return plantPrice + margin;
  };

  // We only block loading for Items tab logic, but Starch has its own loading
  if (loading && activeTab === 'items') {
    return (
      <div className="animate-pulse max-w-6xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="bg-white p-6 rounded-lg shadow-sm h-96"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* ... (Header) ... */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Clothing Management</h2>
        <p className="text-gray-600">Manage clothing types, pricing, and settings</p>
      </div>

      {/* 🆕 NEW: Tab Navigation */}
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`
              flex items-center pb-3 px-2 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'items' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <List className="w-4 h-4 mr-2" />
            Items Inventory
          </button>
          <button
            onClick={() => setActiveTab('starch')}
            className={`
              flex items-center pb-3 px-2 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'starch' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Starch Pricing
          </button>
      </div>

      {/* 🆕 NEW: Content Rendering */}
      {activeTab === 'starch' ? (
        <StarchSettings />
      ) : (
      /* 🔒 EXISTING CODE BLOCK WRAPPED IN FRAGMENT */
      <>
      {formError && !showAddForm && editingId === null && (
         <div className="mb-4 flex items-center bg-red-100 text-red-700 p-3 rounded-md">
           <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
           <p>{formError}</p>
         </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Clothing Types & Pricing</h3>
            <button
              onClick={() => {
                  // This just opens the form, no API call, so no loading state needed
                  setFormData({ name: '', plant_price: '', margin: '', pieces: '' });
                  setImageFile(null); 
                  setImagePreviewUrl(null); 
                  setEditingId(null);
                  setFormError(null);
                  setShowAddForm(true); 
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <form onSubmit={handleSubmit}>
              {/* ... (Form header and error display) ... */}
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">
                  {editingId ? 'Edit Clothing Type' : 'Add New Clothing Type'}
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isSubmitting} 
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 flex items-center bg-red-100 text-red-700 p-3 rounded-md">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              {/* ... (Image upload and form fields) ... */}
              <div className="mb-6 border p-4 rounded-lg border-dashed border-gray-300">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Image {editingId ? '(Optional: replace existing)' : '*'}
                  </label>
                  <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      required={!editingId} 
                    disabled={isSubmitting} 
                      className="w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {imagePreviewUrl && (
                      <img 
                          src={imagePreviewUrl} 
                          alt="Image Preview" 
                          className="mt-4 h-20 w-20 object-cover rounded-md border border-gray-200"
                          onError={(e) => (e.currentTarget.src = getFallbackImage(formData.name))}
                      />
                  )}
              </div>
              
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Men's Shirt"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plant Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.plant_price}
                  onChange={(e) => setFormData({ ...formData, plant_price: e.target.value })}
                  placeholder="8.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Margin ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.margin}
                  onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                  placeholder="4.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pieces *
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={formData.pieces}
                  onChange={(e) => setFormData({ ...formData, pieces: e.target.value })}
                  placeholder="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Price (Form Preview) ($)
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                  ${calculateTotal().toFixed(2)}
                </div>
              </div>
            </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={isSubmitting} 
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Item' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            {/* ... (Table Head) ... */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plant Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin ($)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pieces
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clothingTypes.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                        {item.image_url ? (
                            <img 
                                src={item.image_url} 
                                alt={item.name} 
                                className="h-10 w-10 rounded-md object-cover border border-gray-200"
                                onError={(e) => (e.currentTarget.src = getFallbackImage(item.name))}
                            />
                        ) : (
                            <Shirt className="h-6 w-6 text-gray-400 p-1 border rounded-md" />
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{item.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        ${item.plant_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        ${item.margin.toFixed(2)}
                    </td>
          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
            {(item as any).pieces ? String((item as any).pieces) : '1'}
          </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-bold text-blue-600">
                  ${item.total_price.toFixed(2)}
                </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                </div>
              </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {clothingTypes.length === 0 && !loading && (
            <div className="text-center py-12">
              <Shirt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clothing types found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first clothing item</p>
              <button
                onClick={() => { 
                  // This just opens the form, no API call, so no loading state needed
                  setFormData({ name: '', plant_price: '', margin: '', pieces: '' });
                  setImageFile(null); 
                  setImagePreviewUrl(null); 
                  setEditingId(null);
                  setFormError(null);
                  setShowAddForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Item
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Pricing Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Plant Price</h4>
            <p className="text-sm text-blue-700">
             The base cost for processing each clothing item at the cleaning facility.
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Margin ($)</h4>
            <p className="text-sm text-green-700">
              Your profit per item. Total Price = Plant Price + Margin.
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Total Price</h4>
            <p className="text-sm text-purple-700">
              The final price charged to customers, auto-calculated by the database.
            </p>
          </div>
        </div>
      </div>
      </>
      /* 🔒 END OF EXISTING CODE BLOCK */
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => !isDeleting && setShowDeleteConfirm(null)} 
        >
          <div 
            className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()} // Prevent closing on click inside
          >
            <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete the item <strong className="text-gray-900">{showDeleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                disabled={isDeleting} 
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors flex justify-center items-center w-24"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}