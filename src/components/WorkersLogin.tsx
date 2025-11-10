import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import baseURL from "../lib/config";
import Header from "./Header"; // --- Imported Header ---

const WorkersLogin: React.FC = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // ✅ Role-based navigation
    const getRouteByRole = (role: string) => {
        switch (role?.toLowerCase()) {
            case "store_owner":
                return "/org";
            case "store_manager":
                return "/store/manager/dashboard";
            case "driver":
                return "/driver/dashboard";
            case "assistant":
                return "/assistant/dashboard";
            case "cashier":
                return "/cashier";
            default:
                return "/dashboard";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        try {
            const response = await axios.post(`${baseURL}/token/workers-login`, {
                email,
                password,
            });

            const data = response.data;

            // ✅ Save token & user info consistently
            const { access_token, user_role, organization_id, organization_name } = data;
            localStorage.setItem("accessToken", access_token);
            localStorage.setItem("userRole", user_role);
            localStorage.setItem("organizationId", String(organization_id || ""));
            localStorage.setItem("organizationName", organization_name || "");
            localStorage.setItem("userEmail", email);

            // 4. Navigate based on role
            const route = getRouteByRole(user_role);
            navigate(route);

        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                setErrorMsg(err.response.data.detail || "An unknown error occurred.");
            } else {
                setErrorMsg("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        // --- Wrapped in a div and added Header ---
        <div className="min-h-screen bg-gray-100">
            <Header />
            {/* --- Added padding to center form below header --- */}
            <div className="flex items-center justify-center pt-20 pb-10 px-4">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                    <h2 className="text-2xl font-bold text-center mb-6">Staff Login</h2>

                    {errorMsg && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold mr-2">Error:</strong>
                            <span className="block sm:inline">{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-200"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 font-semibold mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-200"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-semibold py-2 rounded-md transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                }`}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default WorkersLogin;