import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import baseURL from "../lib/config";
import Header from "./Header";
import { User, Mail, Lock, Phone, Briefcase, AlertCircle, Eye, EyeOff } from "lucide-react";

const AddWorker: React.FC = () => {
    const navigate = useNavigate();

    // 🧠 Form fields - ADDED 'phone'
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "", // <-- ADDED
        password: "",
        confirm_password: "",
        role: "",
    });

    const [organizationId, setOrganizationId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // ============================================================
    // ✅ Decode token and extract organization_id
    // ============================================================
    useEffect(() => {
        const token =
            localStorage.getItem("accessToken") || localStorage.getItem("token");

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                if (payload?.organization_id) {
                    setOrganizationId(Number(payload.organization_id));
                    localStorage.setItem("organization_id", payload.organization_id);
                } else {
                    const storedOrgId = localStorage.getItem("organization_id");
                    if (storedOrgId) setOrganizationId(Number(storedOrgId));
                }
            } catch (e) {
                console.error("Error parsing token:", e);
                const storedOrgId = localStorage.getItem("organization_id");
                if (storedOrgId) setOrganizationId(Number(storedOrgId));
            }
        } else {
            navigate("/login");
        }
    }, [navigate]);

    // ============================================================
    // ✅ Handle form input changes
    // ============================================================
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // ============================================================
    // ✅ Handle form submission
    // ============================================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Password confirmation check
        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match. Please confirm your password.");
            setLoading(false);
            return;
        }

        if (!organizationId) {
            setError("Organization ID is missing. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                throw new Error("Access token not found");
            }

            // The 'phone' field is now included automatically from formData
            const response = await axios.post(
                `${baseURL}/register/staff`,
                {
                    ...formData,
                    organization_id: organizationId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data && (response.status === 200 || response.status === 201)) { // Accept 201 Created
                setSuccess(response.data.message || "Worker added successfully!");
                // Reset form
                setFormData({
                    first_name: "",
                    last_name: "",
                    email: "",
                    phone: "",
                    password: "",
                    confirm_password: "",
                    role: "",
                });
            } else {
                setError(response.data.detail || "An unexpected error occurred.");
            }
        } catch (err: any) {
            console.error("Registration error:", err);
            setError(
                err.response?.data?.detail ||
                err.message ||
                "Failed to add worker."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Assuming sidebar is part of Header or not needed here */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header /> {/* <-- ADDED HEADER */}

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add New Worker</h2>

                        {/* --- Error Message --- */}
                        {error && (
                            <div className="mb-4 flex items-center p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Error</h4>
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* --- Success Message --- */}
                        {success && (
                            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                                <h4 className="font-semibold">Success!</h4>
                                <p className="text-sm">{success}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* First Name */}
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translatey-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="first_name"
                                    placeholder="First Name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full border p-3 pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* Last Name */}
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="last_name"
                                    placeholder="Last Name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full border p-3 pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full border p-3 pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* --- FIXED PHONE INPUT --- */}
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Phone Number (Optional)"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full border p-3 pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {/* --- END FIXED PHONE INPUT --- */}

                            {/* Password */}
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Password (min. 8 chars)"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full border p-3 pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>

                            {/* Confirm Password */}
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirm_password"
                                    placeholder="Confirm Password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className="w-full border p-3 pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>

                            {/* --- UPDATED ROLE LIST --- */}
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full border p-3 pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select Role</option>
                                    {/* <option value="store_manager">Store Manager</option> */}
                                    {/* <option value="driver">Driver</option> */}
                                    {/* <option value="assistant">Assistant</option> */}
                                    <option value="cashier">Cashier</option>
                                    {/* <option value="customer">Customer</option> */}
                                </select>
                            </div>
                            {/* --- END UPDATED ROLE LIST --- */}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
                            >
                                {loading ? "Adding Worker..." : "Add Worker"}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AddWorker;