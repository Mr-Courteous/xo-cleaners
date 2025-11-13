import React, { useState, useEffect } from "react";
import { LogIn, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./Header"; // ✅ Imported same Header as HomePage

const API_BASE_URL = "http://localhost:8001";
import baseUrl from '../lib/config';


// ============================================================================
// ✅ Utility: Alert Message Component
// ============================================================================
const Alert = ({
  message,
  type,
  onClose,
}: {
  message: string | object;
  type: "success" | "error" | null;
  onClose: () => void;
}) => {
  if (!message) return null;

  const safeMessage =
    typeof message === "string" ? message : JSON.stringify(message);
  const colorClasses = {
    success: "bg-green-100 text-green-800 border-green-400",
    error: "bg-red-100 text-red-800 border-red-400",
  };
  const Icon = type === "success" ? CheckCircle : XCircle;

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div
      role="alert"
      className={`fixed top-4 right-4 z-50 p-4 border rounded-xl shadow-xl flex items-center space-x-3 transition-opacity duration-300 ${colorClasses[type!]}`}
      style={{ minWidth: "300px" }}
    >
      <Icon size={20} />
      <p className="font-medium break-words">{safeMessage}</p>
      <button
        onClick={onClose}
        className={`ml-auto font-bold ${
          type === "success" ? "text-green-800" : "text-red-800"
        } hover:opacity-75 transition`}
      >
        &times;
      </button>
    </div>
  );
};

// ============================================================================
// ✅ Helper: Role-to-Route Mapping
// ============================================================================
const getRouteByRole = (role: string): string => {
  if (!role) return "/dashboard";

  const normalizedRole = role.toLowerCase();

  switch (normalizedRole) {
    case "admin":
    case "platform_admin":
      return "/platform/admin/dashboard";
    case "store_owner":
      return "/org";
    case "store_manager":
      return "/store/manager/dashboard";
    case "driver":
      return "/driver/dashboard";
    case "assistant":
      return "/assistant/dashboard";
    default:
      return "/dashboard";
  }
};

// ============================================================================
// ✅ Main Login Component
// ============================================================================
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageType(null);
    setIsLoading(true);

    try {
      const details = new URLSearchParams();
      details.append("username", email);
      details.append("password", password);

      const response = await fetch(`${baseUrl}/token/store-login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: details.toString(),
      });

      const data = await response.json();

      if (response.ok) {
        const {
          access_token,
          user_role,
          organization_id,
          organization_name,
        } = data;

        localStorage.setItem("accessToken", access_token);
        localStorage.setItem("userRole", user_role);
        localStorage.setItem("organizationId", String(organization_id || ""));
        localStorage.setItem("organizationName", organization_name || "");
        localStorage.setItem("userEmail", email);

        setMessage("Login successful! Redirecting...");
        setMessageType("success");
        console.log(data)

        setTimeout(() => {
          const destination = getRouteByRole(user_role);
          navigate(destination);
        }, 1000);
      } else {
        let errorMsg = "Invalid email or password.";
        if (data?.detail) {
          if (typeof data.detail === "string") errorMsg = data.detail;
          else if (Array.isArray(data.detail))
            errorMsg = data.detail.map((err: any) => err.msg).join(", ");
          else if (typeof data.detail === "object")
            errorMsg = data.detail.msg || JSON.stringify(data.detail);
        }
        setMessage(errorMsg);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Could not connect to the server. Please try again later.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlertClose = () => {
    setMessage("");
    setMessageType(null);
  }; 

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ✅ Header */}
      <Header onLoginClick={() => navigate("/login")} />

      {/* ✅ Hero Section */}
      <div className="bg-blue-600 text-white py-16 text-center">
        <h2 className="text-5xl font-extrabold tracking-tight mb-3">
          Welcome Back!
        </h2>
        <p className="text-lg opacity-90 max-w-2xl mx-auto">
          Sign in to manage your dry cleaning operations seamlessly.
        </p>
      </div>

      {/* ✅ Alert Message */}
      <Alert message={message} type={messageType} onClose={handleAlertClose} />

      {/* ✅ Login Form Section */}
      <div className="flex-grow flex justify-center items-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 md:p-10">
          <div className="text-center mb-6">
            <LogIn className="mx-auto h-12 w-auto text-blue-600" />
            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              Sign in to your account
            </h2>
            <p className="text-gray-500 mt-1">
              Enter your credentials below to access your dashboard
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.97 9.97 0 012.02-5.786M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M4.53 4.53A10.003 10.003 0 001.5 12c0 5.523 4.477 10 10 10 2.486 0 4.767-.834 6.616-2.237M9.88 9.88a3 3 0 014.24 4.24" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 
                    0 5.373 0 12h4zm2 
                    5.291A7.962 7.962 0 
                    014 12H0c0 3.042 
                    1.135 5.824 3 
                    7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Login"
              )}
            </button>

            {/* ✅ Registration Link */}
            <p className="text-center text-sm text-gray-600 mt-4">
              Not registered yet?{" "}
              <a
                href="/#registration"
                className="font-medium text-blue-600 hover:text-blue-500 transition"
              >
                Register your company
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
