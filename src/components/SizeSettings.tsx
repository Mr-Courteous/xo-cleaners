import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Loader2, Ruler, Info } from 'lucide-react';
import baseURL from '../lib/config'; // Adjust path to your config file

interface SizePrices {
    size_price_s: number | string;
    size_price_m: number | string;
    size_price_l: number | string;
    size_price_xl: number | string;
    size_price_xxl: number | string;
}

const SizeSettings: React.FC = () => {
    const [prices, setPrices] = useState<SizePrices>({
        size_price_s: '',
        size_price_m: '',
        size_price_l: '',
        size_price_xl: '',
        size_price_xxl: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Fetch current settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            // Fetching from the main settings endpoint to populate initial values
            const response = await axios.get(`${baseURL}/api/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data) {
                setPrices({
                    size_price_s: response.data.size_price_s || '',
                    size_price_m: response.data.size_price_m || '',
                    size_price_l: response.data.size_price_l || '',
                    size_price_xl: response.data.size_price_xl || '',
                    size_price_xxl: response.data.size_price_xxl || ''
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            setMessage({ type: 'error', text: 'Failed to load current size prices.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPrices(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("accessToken");
            
            // Convert empty strings to 0 for submission
            const payload = Object.entries(prices).reduce((acc, [key, val]) => {
                acc[key] = val === '' ? 0 : Number(val);
                return acc;
            }, {} as any);

            // ✅ Sending to the specific SIZE route
            await axios.put(`${baseURL}/api/size-prices`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage({ type: 'success', text: 'Clothing size prices updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
            
        } catch (error) {
            console.error("Error saving settings:", error);
            setMessage({ type: 'error', text: 'Failed to update prices. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-32 bg-white rounded-xl shadow-sm border border-gray-200">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Header Section */}
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3 shadow-sm border border-purple-200">
                        <Ruler className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Clothing Size Pricing</h2>
                        <p className="text-sm text-purple-700 font-medium">Automatic upcharges based on item size</p>
                    </div>
                </div>
                
                <div className="relative group">
                    <Info className="w-5 h-5 text-purple-400 cursor-help" />
                    <div className="absolute right-0 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 -mt-2 mr-8">
                        When you select a size (S, M, L, etc.) during drop-off, this amount is automatically added to the ticket item total.
                    </div>
                </div>
            </div>

            {/* Notification Area */}
            {message && (
                <div className={`mx-6 mt-6 p-3 text-sm font-medium rounded-lg border flex items-center ${
                    message.type === 'success' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    
                    {/* Small */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors group">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider group-hover:text-purple-600">
                            Small (S)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="size_price_s"
                                value={prices.size_price_s}
                                onChange={handleChange}
                                className="w-full pl-6 pr-2 py-1.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Medium */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors group">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider group-hover:text-purple-600">
                            Medium (M)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="size_price_m"
                                value={prices.size_price_m}
                                onChange={handleChange}
                                className="w-full pl-6 pr-2 py-1.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Large */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors group">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider group-hover:text-purple-600">
                            Large (L)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="size_price_l"
                                value={prices.size_price_l}
                                onChange={handleChange}
                                className="w-full pl-6 pr-2 py-1.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* XL */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors group">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider group-hover:text-purple-600">
                            X-Large (XL)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="size_price_xl"
                                value={prices.size_price_xl}
                                onChange={handleChange}
                                className="w-full pl-6 pr-2 py-1.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* XXL */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors group">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider group-hover:text-purple-600">
                            2X-Large (XXL)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="size_price_xxl"
                                value={prices.size_price_xxl}
                                onChange={handleChange}
                                className="w-full pl-6 pr-2 py-1.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Size Prices
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SizeSettings;