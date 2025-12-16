import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, User } from "lucide-react"; 
import baseURL from "../lib/config";
import Header from "./Header"; 

const CustomerLogin: React.FC = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        try {
            const response = await axios.post(`${baseURL}/token/customer/login`, {
                email,
                password,
            });

            // --- UPDATED: Save data just like WorkersLogin ---
            const { access_token, user_role, organization_id, organization_name } = response.data;
            
            localStorage.setItem("accessToken", access_token);
            localStorage.setItem("userRole", user_role);
            localStorage.setItem("userEmail", email); // Save the email from state
            
            // Handle optional organization fields (Customers might be global or linked to one)
            if (organization_id) {
                localStorage.setItem("organizationId", organization_id.toString());
            }
            if (organization_name) {
                localStorage.setItem("organizationName", organization_name);
            }

            // Redirect to Customer Dashboard
            navigate("/customer");

        } catch (err: any) {
            console.error("Login error:", err);
            if (err.response && err.response.data && err.response.data.detail) {
                setErrorMsg(err.response.data.detail);
            } else {
                setErrorMsg("Server error. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <div className="flex-grow flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-100">
                    
                    <div className="text-center mb-6">
                        <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                           <User className="text-blue-600 w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Customer Login</h2>
                        <p className="text-gray-500 text-sm mt-1">Welcome back! Please login to view your tickets.</p>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-center gap-2 border border-red-200">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-semibold py-2.5 rounded-md shadow-sm transition-all duration-200 ${
                                loading 
                                ? "bg-gray-400 cursor-not-allowed" 
                                : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"
                            }`}
                        >
                            {loading ? "Logging in..." : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p>
                            Don't have an account?{" "}
                            <Link to="/register" className="text-blue-600 hover:underline font-medium">
                                Sign up
                            </Link>
                        </p>
                        <div className="mt-4 border-t pt-4">
                             <p className="text-xs text-gray-400">Are you an employee?</p>
                             <Link to="/workers-login" className="text-gray-500 hover:text-gray-800 text-xs underline mt-1 block">
                                Staff Login Here
                             </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerLogin;