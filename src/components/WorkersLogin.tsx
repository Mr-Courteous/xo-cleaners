import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import baseURL from "../lib/config";

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
            localStorage.setItem("accessToken", data.access_token);
            localStorage.setItem("userRole", data.user.role);
            localStorage.setItem("organizationId", String(data.user.organization_id || ""));
            localStorage.setItem("userEmail", data.user.email);
            localStorage.setItem("organizationName", data.organization_name || ""); // ✅ Save organization name


            // ✅ Navigate based on role
            const destination = getRouteByRole(data.user.role);
            navigate(destination);
        } catch (error: any) {
            if (error.response?.data?.detail) {
                setErrorMsg(error.response.data.detail);
            } else {
                setErrorMsg("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
            >
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    Admin / Worker Login
                </h2>

                {errorMsg && (
                    <div className="flex items-center bg-red-100 text-red-700 p-3 mb-4 rounded-md">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        <p>{errorMsg}</p>
                    </div>
                )}

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
    );
};

export default WorkersLogin;
