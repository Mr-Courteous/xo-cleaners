import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Shirt } from 'lucide-react';
import { apiCall } from '../hooks/useApi';
// Assuming 'ClothingType' now includes 'image_url: string | null'
import { ClothingType } from '../types'; 

export default function ClothingManagement() {
  const [clothingTypes, setClothingTypes] = useState<ClothingType[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    plant_price: '',
    margin: ''
  });
  // 🎯 NEW STATE: To hold the selected file object
  const [imageFile, setImageFile] = useState<File | null>(null); 
  // 🎯 NEW STATE: To hold the temporary URL for preview
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🎯 EFFECT HOOK: Handles creating and REVOKING the temporary image URL
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
      // Cleanup function to revoke the object URL when the component unmounts 
      // or when 'imageFile' changes, preventing memory leaks.
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
    return;
  }, [imageFile]);

  useEffect(() => {
    fetchClothingTypes();
  }, []);

  const fetchClothingTypes = async () => {
    try {
      // You might need to adjust this endpoint if your backend uses a prefix like /api
      const types = await apiCall('/clothing-types');
      setClothingTypes(types);
    } catch (error) {
      console.error('Failed to fetch clothing types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.plant_price || !formData.margin) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        // --- UPDATE (PUT) LOGIC: Remains JSON for existing price/name fields ---
        await apiCall(`/clothing-types/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name,
            plant_price: parseFloat(formData.plant_price),
            margin: parseFloat(formData.margin)
          }),
        });
      } else {
        // --- CREATE (POST) LOGIC: Uses FormData for file upload ---
        
        if (!imageFile) {
            alert('Please select an image file for the new clothing type.');
            return;
        }

        // Create a FormData object to send multipart/form-data
        const form = new FormData();
        form.append('name', formData.name);
        form.append('plant_price', formData.plant_price);
        form.append('margin', formData.margin);
        // Key 'image_file' must match the FastAPI endpoint argument
        form.append('image_file', imageFile);

        // 🎯 NOTE: apiCall MUST NOT set 'Content-Type: application/json' 
        // when 'body' is FormData. This is the likely cause of your reported issue.
        await apiCall('/clothing-types', {
            method: 'POST',
            body: form,
        });
      }
      
      resetForm();
      fetchClothingTypes();
      alert(editingId ? 'Clothing type updated successfully!' : 'Clothing type added successfully!');
    } catch (error: any) {
      // This catch block will execute if apiCall fails to handle a successful 
      // response (e.g., fails to parse JSON for a 201) and throws an error.
      console.error('Submission failed:', error);
      // The error message will come from apiCall's error handling now
      alert(`Failed to save clothing type: ${error.message || 'Unknown error'}`); 
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setImageFile(file);
    // The useEffect above handles setting/revoking the URL
  };

  const handleEdit = (clothingType: ClothingType) => {
    setEditingId(clothingType.id);
    setFormData({
      name: clothingType.name,
      plant_price: clothingType.plant_price.toString(),
      margin: clothingType.margin.toString()
    });
    // Clear file/preview state when editing
    setImageFile(null); 
    setImagePreviewUrl(null); 
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this clothing type?')) {
      return;
    }

    try {
      await apiCall(`/clothing-types/${id}`, { method: 'DELETE' });
      fetchClothingTypes();
      alert('Clothing type deleted successfully!');
    } catch (error) {
      alert('Failed to delete clothing type');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', plant_price: '', margin: '' });
    // 🎯 CLEAR IMAGE STATE
    setImageFile(null); 
    setImagePreviewUrl(null); 
    setShowAddForm(false);
    setEditingId(null);
  };

  const calculateTotal = () => {
    const plantPrice = parseFloat(formData.plant_price) || 0;
    const margin = parseFloat(formData.margin) || 0;
    return plantPrice + margin;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="bg-white p-6 rounded-lg shadow-sm h-96"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Clothing Items Management</h2>
        <p className="text-gray-600">Manage clothing types, pricing, and service options</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Clothing Types & Pricing</h3>
            <button
              onClick={() => {
                  setShowAddForm(true);
                  resetForm(); // Use combined reset function
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
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">
                  {editingId ? 'Edit Clothing Type' : 'Add New Clothing Type'}
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

                {/* 🎯 UPDATED: IMAGE FILE UPLOAD FIELD (ONLY for new items) */}
                {!editingId && (
                    <div className="mb-6 border p-4 rounded-lg border-dashed border-gray-300">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Item Image *
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange} // Use the new handler
                            // Ensure the file input is required only when creating a new item
                            required={!editingId} 
                            className="w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {/* Image Preview using the state variable */}
                        {imagePreviewUrl && (
                            <img 
                                src={imagePreviewUrl} 
                                alt="Image Preview" 
                                className="mt-4 h-20 w-20 object-cover rounded-md border border-gray-200"
                            />
                        )}
                    </div>
                )}
                {/* END UPDATED: IMAGE FILE UPLOAD FIELD */}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Men's Shirt"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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
                    placeholder="2.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Price ($)
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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  {editingId ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {/* 🎯 NEW COLUMN: Image Preview */}
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
                  Margin
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
                                // If image_url is not a full path, you might need to prepend your backend URL base here
                                src={item.image_url} 
                                alt={item.name} 
                                className="h-10 w-10 rounded-md object-cover border border-gray-200"
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
                            onClick={() => handleDelete(item.id)}
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
          
          {clothingTypes.length === 0 && (
            <div className="text-center py-12">
              <Shirt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clothing types found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first clothing item</p>
              <button
                onClick={() => setShowAddForm(true)}
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
            <h4 className="font-medium text-green-900 mb-2">Margin</h4>
            <p className="text-sm text-green-700">
              Your profit margin added to the plant price for each item.
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Total Price</h4>
            <p className="text-sm text-purple-700">
              The final price charged to customers (Plant Price + Margin).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}