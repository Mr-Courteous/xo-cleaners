import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import baseURL from "../lib/config";

const AddWorker: React.FC = () => {
    const navigate = useNavigate();

    // 🧠 Form fields
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "",
    });

    const [organizationId, setOrganizationId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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
                console.warn("Failed to decode token:", e);
                const fallback = localStorage.getItem("organization_id");
                if (fallback) setOrganizationId(Number(fallback));
            }
        } else {
            const fallback = localStorage.getItem("organization_id");
            if (fallback) setOrganizationId(Number(fallback));
        }
    }, []);

    // ============================================================
    // ✅ Input Handler
    // ============================================================
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ============================================================
    // ✅ Submit Handler
    // ============================================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!organizationId) {
            setError("Unable to determine organization. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const token =
                localStorage.getItem("accessToken") || localStorage.getItem("token");

            if (!token) {
                setError("Authentication token missing. Please log in again.");
                setLoading(false);
                return;
            }

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

            setSuccess(response.data?.message || "Worker added successfully!");
            setFormData({
                first_name: "",
                last_name: "",
                email: "",
                password: "",
                role: "",
            });
            console.log(formData)
            // Redirect after success
            setTimeout(() => navigate("/org"), 1500);
        } catch (err: any) {
            console.error("Registration error:", err);

            // 🧠 Handle validation errors from FastAPI
            if (err.response?.status === 422 && Array.isArray(err.response.data?.detail)) {
                const details = err.response.data.detail
                    .map((d: any) => `${d.loc?.[d.loc.length - 1] || "field"}: ${d.msg}`)
                    .join(", ");
                setError(`Validation error: ${details}`);
            } else if (typeof err.response?.data?.detail === "string") {
                setError(err.response.data.detail);
            } else if (err.message === "Network Error") {
                setError("Network error — please check your connection.");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // ✅ Component UI
    // ============================================================
    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4 text-center">Add New Worker</h2>

            {error && (
                <p className="text-red-600 mb-3 border border-red-200 bg-red-50 p-2 rounded">
                    {error}
                </p>
            )}
            {success && (
                <p className="text-green-600 mb-3 border border-green-200 bg-green-50 p-2 rounded">
                    {success}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    required
                />

                <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    required
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password (min. 8 chars)"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    required
                />

                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    required
                >
                    <option value="">Select Role</option>
                    <option value="store_admin">Store Admin</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="customer">Customer</option>
                </select>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Adding Worker..." : "Add Worker"}
                </button>
            </form>
        </div>
    );
};

export default AddWorker;
