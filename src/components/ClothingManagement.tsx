import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Save, X, Shirt, Upload, Image, AlertCircle, 
  Loader2, DollarSign, List, Info, Ruler // 🎯 Added Ruler for Size Icon
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
// 👔 STARCH SETTINGS COMPONENT
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
            const response = await fetch(`${baseURL}/api/settings`, { headers });
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

            const response = await fetch(`${baseURL}/api/settings/starch-prices`, { // Or generic settings PUT
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
// 📏 NEW: SIZE SETTINGS COMPONENT
// ==========================================
const SizeSettings: React.FC = () => {
    const [prices, setPrices] = useState({
        size_price_s: '',
        size_price_m: '',
        size_price_l: '',
        size_price_xl: '',
        size_price_xxl: ''
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
            const response = await fetch(`${baseURL}/api/settings`, { headers });
            if (response.ok) {
                const data = await response.json();
                setPrices({
                    size_price_s: data.size_price_s || 0,
                    size_price_m: data.size_price_m || 0,
                    size_price_l: data.size_price_l || 0,
                    size_price_xl: data.size_price_xl || 0,
                    size_price_xxl: data.size_price_xxl || 0
                });
            }
        } catch (error) {
            console.error("Error fetching size settings:", error);
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
                size_price_s: parseFloat(String(prices.size_price_s)) || 0,
                size_price_m: parseFloat(String(prices.size_price_m)) || 0,
                size_price_l: parseFloat(String(prices.size_price_l)) || 0,
                size_price_xl: parseFloat(String(prices.size_price_xl)) || 0,
                size_price_xxl: parseFloat(String(prices.size_price_xxl)) || 0,
            };

            const response = await fetch(`${baseURL}/api/settings/size-prices`, { 
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || 'Failed to update size prices');
            }

            setMessage({ type: 'success', text: "Clothing size prices updated successfully!" });
            fetchSettings();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || "Failed to update prices." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-purple-600 w-8 h-8" /></div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-4xl">
            <div className="p-6 border-b border-gray-100 bg-purple-50">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                    <Ruler className="w-5 h-5 text-purple-600" /> Clothing Size Pricing
                </h3>
                <p className="text-sm text-purple-700 mt-1">Set the additional upcharge applied to items for each clothing size.</p>
            </div>
            <form onSubmit={handleSave} className="p-6">
                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <Info className="w-5 h-5 mr-2" /> {message.text}
                    </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { key: 'size_price_s', label: 'Small (S)' },
                        { key: 'size_price_m', label: 'Medium (M)' },
                        { key: 'size_price_l', label: 'Large (L)' },
                        { key: 'size_price_xl', label: 'XL' },
                        { key: 'size_price_xxl', label: 'XXL' }
                    ].map(({ key, label }) => (
                        <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                <input
                                    type="number" step="0.01" 
                                    name={key} 
                                    value={(prices as any)[key]} 
                                    onChange={handleChange}
                                    className="w-full pl-5 pr-2 py-1 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex justify-end">
                    <button type="submit" disabled={saving} className="flex items-center px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 font-medium shadow-md">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Sizes
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
  // 🎯 Updated Tab State
  const [activeTab, setActiveTab] = useState<'items' | 'starch' | 'size'>('items');

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

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (!editingId) {
       setImagePreviewUrl(null);
    }
    return;
  }, [imageFile, editingId]);

  useEffect(() => {
    fetchClothingTypes();
  }, []);

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
      const processedData = data.map(item => ({
        ...item,
        image_url: item.image_url
          ? (item.image_url.startsWith('http') ? item.image_url : `${baseURL}${item.image_url}`)
          : null,
        pieces: (item as any).pieces ? (item as any).pieces : 1,
      }));
      setClothingTypes(processedData);
    } catch (error: any) {
      console.error('Failed to fetch clothing types:', error);
      setFormError(`Failed to load items: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isCreating = !editingId;
    if (!validateForm(isCreating)) {
      return;
    }
    
    setIsSubmitting(true); 
    setFormError(null);

    const form = new FormData();
    form.append('name', formData.name);
    form.append('plant_price', formData.plant_price);
    form.append('margin', formData.margin);
    
    if (imageFile) {
      form.append('image_file', imageFile);
    }
    form.append('pieces', formData.pieces);

    const authHeaders = getAuthHeaders();
    
    try {
      const url = editingId 
        ? `${baseURL}/api/clothing-types/${editingId}`
        : `${baseURL}/api/clothing-types`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: form,
        headers: authHeaders,
      });

      if (!response.ok) {
          const text = await response.text().catch(() => '');
          let parsed: any = null;
          try {
            parsed = text ? JSON.parse(text) : null;
          } catch (e) { }

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
      fetchClothingTypes();
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
      fetchClothingTypes();
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
    return plantPrice + margin;
  };

  // We only block loading for Items tab logic
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Clothing Management</h2>
        <p className="text-gray-600">Manage clothing types, pricing, and settings</p>
      </div>

      {/* 🎯 TAB NAVIGATION */}
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button 
            onClick={() => setActiveTab('items')} 
            className={`flex items-center pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'items' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
            <List className="w-4 h-4 mr-2" /> Items Inventory
        </button>
        <button 
            onClick={() => setActiveTab('starch')} 
            className={`flex items-center pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'starch' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
            <DollarSign className="w-4 h-4 mr-2" /> Starch Pricing
        </button>
        <button 
            onClick={() => setActiveTab('size')} 
            className={`flex items-center pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'size' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
            <Ruler className="w-4 h-4 mr-2" /> Size Pricing
        </button>
      </div>

      {/* 🎯 CONTENT RENDERING */}
      {activeTab === 'starch' ? (
          <StarchSettings />
      ) : activeTab === 'size' ? (
          <SizeSettings />
      ) : (
        /* ITEMS INVENTORY TAB (Original Content) */
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
                    setFormData({ name: '', plant_price: '', margin: '', pieces: '' });
                    setImageFile(null);
                    setImagePreviewUrl(null);
                    setEditingId(null);
                    setShowAddForm(true);
                    setFormError(null);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Item
                </button>
              </div>
            </div>

            {/* Modal for Add/Edit */}
            {showAddForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-gray-900">
                      {editingId ? 'Edit Clothing Type' : 'Add New Clothing Type'}
                    </h3>
                    <button
                      onClick={resetForm}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {formError && (
                      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        {formError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder="e.g. Men's Suit"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Plant Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.plant_price}
                          onChange={(e) => setFormData({ ...formData, plant_price: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Margin ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.margin}
                          onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="col-span-2 bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Total Customer Price:</span>
                        <span className="text-2xl font-bold text-green-600">
                          ${calculateTotal().toFixed(2)}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pieces Count</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          required
                          value={formData.pieces}
                          onChange={(e) => setFormData({ ...formData, pieces: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="1 (Default)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          How many physical items does this type represent? (e.g. 2 pc Suit = 2)
                        </p>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {imagePreviewUrl ? (
                            <div className="relative w-full h-48">
                              <img
                                src={imagePreviewUrl}
                                alt="Preview"
                                className="w-full h-full object-contain rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                <span className="text-white font-medium flex items-center">
                                  <Upload className="w-5 h-5 mr-2" /> Change Image
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Click to upload image</p>
                              <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {editingId ? 'Update Item' : 'Create Item'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List of Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {clothingTypes.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                        <img
                          src={item.image_url || getFallbackImage(item.name)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getFallbackImage(item.name);
                          }}
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">{item.name}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Plant Price:</span>
                        <span className="font-medium text-gray-700">${item.plant_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Margin:</span>
                        <span className="font-medium text-gray-700">${item.margin.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 border-t border-dashed pt-1 mt-1">
                        <span>Total:</span>
                        <span className="font-bold text-green-600">${(item.plant_price + item.margin).toFixed(2)}</span>
                      </div>
                      {(item as any).pieces > 1 && (
                         <div className="mt-2 inline-block px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300">
                            {(item as any).pieces} Pieces
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {clothingTypes.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Shirt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No clothing items found. Click "Add New Item" to start.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div 
            className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
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