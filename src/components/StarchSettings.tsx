import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Loader2, DollarSign, Info } from 'lucide-react';
import baseURL from '../lib/config'; // Adjust path to your config file

interface StarchPrices {
    starch_price_light: number | string;
    starch_price_medium: number | string;
    starch_price_heavy: number | string;
    starch_price_extra_heavy: number | string;
}

const StarchSettings: React.FC = () => {
    const [prices, setPrices] = useState<StarchPrices>({
        starch_price_light: '',
        starch_price_medium: '',
        starch_price_heavy: '',
        starch_price_extra_heavy: ''
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
            // NOTE: Adjust this GET URL to match where you currently retrieve settings (e.g., /settings or /api/settings/organization)
            const response = await axios.get(`${baseURL}/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                setPrices({
                    starch_price_light: response.data.starch_price_light || 0,
                    starch_price_medium: response.data.starch_price_medium || 0,
                    starch_price_heavy: response.data.starch_price_heavy || 0,
                    starch_price_extra_heavy: response.data.starch_price_extra_heavy || 0
                });
            }
        } catch (error) {
            console.error("Error fetching starch settings:", error);
            setMessage({ type: 'error', text: "Failed to load current starch prices." });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Prevent negative numbers
        if (parseFloat(value) < 0) return;
        setPrices(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("accessToken");
            
            // Prepare payload (convert strings to floats)
            const payload = {
                starch_price_light: parseFloat(String(prices.starch_price_light)) || 0,
                starch_price_medium: parseFloat(String(prices.starch_price_medium)) || 0,
                starch_price_heavy: parseFloat(String(prices.starch_price_heavy)) || 0,
                starch_price_extra_heavy: parseFloat(String(prices.starch_price_extra_heavy)) || 0,
            };

            await axios.put(`${baseURL}/api/settings/starch-prices`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage({ type: 'success', text: "Starch prices updated successfully!" });
            
            // Optional: Refresh data to ensure sync
            fetchSettings();

        } catch (error: any) {
            console.error("Error updating starch prices:", error);
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.detail || "Failed to update prices. Please try again." 
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48 bg-white rounded-lg shadow-sm border border-gray-200">
                <Loader2 className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    Starch Pricing Configuration
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Set the additional upcharge applied to items for each starch level.
                </p>
            </div>

            <form onSubmit={handleSave} className="p-6">
                
                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <Info className="w-5 h-5 mr-2" />
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Light Starch */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Light Starch ($)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                name="starch_price_light"
                                value={prices.starch_price_light}
                                onChange={handleChange}
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Medium Starch */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Medium Starch ($)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                name="starch_price_medium"
                                value={prices.starch_price_medium}
                                onChange={handleChange}
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Heavy Starch */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Heavy Starch ($)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                name="starch_price_heavy"
                                value={prices.starch_price_heavy}
                                onChange={handleChange}
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Extra Heavy Starch */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Extra Heavy Starch ($)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                name="starch_price_extra_heavy"
                                value={prices.starch_price_extra_heavy}
                                onChange={handleChange}
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StarchSettings;