import React, { useState } from "react";
import axios from "axios";
import {
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    Lock,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle,
    Eye,
    EyeOff,
} from "lucide-react";
import baseURL from "../lib/config";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileForm {
    name: string;
    address: string;
    phone: string;
    owner_first_name: string;
    owner_last_name: string;
    owner_email: string;
    owner_password: string;
}

interface FeedbackMsg {
    type: "success" | "error";
    text: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrganizationProfile() {
    const [form, setForm] = useState<ProfileForm>({
        name: "",
        address: "",
        phone: "",
        owner_first_name: "",
        owner_last_name: "",
        owner_email: "",
        owner_password: "",
    });

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<FeedbackMsg | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const showFeedback = (feedback: FeedbackMsg) => {
        setMsg(feedback);
        setTimeout(() => setMsg(null), 4000);
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Only send fields that the user actually filled in
        const payload: Partial<ProfileForm> = {};
        (Object.keys(form) as (keyof ProfileForm)[]).forEach((key) => {
            if (form[key].trim() !== "") {
                payload[key] = form[key].trim();
            }
        });

        if (Object.keys(payload).length === 0) {
            showFeedback({ type: "error", text: "Please fill in at least one field to update." });
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.put(
                `${baseURL}/api/settings/organization/profile`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showFeedback({
                type: "success",
                text: res.data?.message ?? "Organization profile updated successfully!",
            });

            // Clear password field after save for security
            setForm((prev) => ({ ...prev, owner_password: "" }));
        } catch (err: any) {
            const detail =
                err?.response?.data?.detail ?? "Failed to update organization profile.";
            showFeedback({ type: "error", text: detail });
        } finally {
            setLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl w-full">
            {/* Header */}
            <div className="mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Building2 size={20} className="text-blue-600" />
                    Organization Profile
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Update your store details and owner information. Leave a field blank to keep
                    its current value.
                </p>
            </div>

            {/* Feedback Banner */}
            {msg && (
                <div
                    className={`mb-5 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium border ${msg.type === "success"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                        }`}
                >
                    {msg.type === "success" ? (
                        <CheckCircle size={16} />
                    ) : (
                        <AlertCircle size={16} />
                    )}
                    {msg.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ── Organization Details ─────────────────────────────────────── */}
                <fieldset className="space-y-4">
                    <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Store Details
                    </legend>

                    {/* Name */}
                    {/* <div>
                        <label
                            htmlFor="org-name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Organization Name
                        </label>
                        <div className="relative">
                            <Building2
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                id="org-name"
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. XO Cleaners Downtown"
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                    </div> */}

                    {/* Address */}
                    <div>
                        <label
                            htmlFor="org-address"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Address
                        </label>
                        <div className="relative">
                            <MapPin
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                id="org-address"
                                type="text"
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                placeholder="e.g. 123 Main St, New York, NY 10001"
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label
                            htmlFor="org-phone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                id="org-phone"
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="e.g. +1 234 567 8900"
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                    </div>
                </fieldset>

                <hr className="border-gray-100" />

                {/* ── Owner Details ─────────────────────────────────────────────── */}
                <fieldset className="space-y-4">
                    <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Owner Information
                    </legend>

                    {/* First Name + Last Name */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                htmlFor="owner-first"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                First Name
                            </label>
                            <div className="relative">
                                <User
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                                <input
                                    id="owner-first"
                                    type="text"
                                    name="owner_first_name"
                                    value={form.owner_first_name}
                                    onChange={handleChange}
                                    placeholder="John"
                                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="owner-last"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Last Name
                            </label>
                            <div className="relative">
                                <User
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                                <input
                                    id="owner-last"
                                    type="text"
                                    name="owner_last_name"
                                    value={form.owner_last_name}
                                    onChange={handleChange}
                                    placeholder="Smith"
                                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    {/* <div>
                        <label
                            htmlFor="owner-email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Owner Email
                        </label>
                        <div className="relative">
                            <Mail
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                id="owner-email"
                                type="email"
                                name="owner_email"
                                value={form.owner_email}
                                onChange={handleChange}
                                placeholder="owner@yourstore.com"
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>
                    </div> */}

                    {/* Password */}
                    <div>
                        {/* <label
                            htmlFor="owner-password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            New Password{" "}
                            <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                        </label> */}
                        {/* <div className="relative">
                            <Lock
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                id="owner-password"
                                type={showPassword ? "text" : "password"}
                                name="owner_password"
                                value={form.owner_password}
                                onChange={handleChange}
                                placeholder="Min. 8 characters"
                                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div> */}
                    </div>
                </fieldset>

                {/* Submit */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        id="save-org-profile-btn"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm shadow-sm"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {loading ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
