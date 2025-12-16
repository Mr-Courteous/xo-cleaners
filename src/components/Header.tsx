import React, { useState, useRef, useEffect } from 'react';
// --- NEW: Added LayoutDashboard ---
import { Shirt, Shield, User, Briefcase, Users, Home, Info, Phone, Compass, LogOut, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Header component serving as the application header with full navigation.
 * Conditionally renders Login or Logout based on auth state.
 */
const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const HOVER_DELAY_MS = 200; // Delay in milliseconds before closing the dropdown

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userInfo, setUserInfo] = useState<{ email: string; role: string; org: string } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Check for tokens
        // 1. Staff/Owner use 'accessToken'
        // 2. Customers use 'token' (based on your CustomerLogin.tsx)
        const regularToken = localStorage.getItem("accessToken") || localStorage.getItem("token");
        const adminToken = localStorage.getItem("platformAdminToken"); 

        if (regularToken) {
            // Try to find email in 'userEmail' (staff) OR 'email' (customer might save differently, or fallback)
            const email = localStorage.getItem("userEmail") || 'User';
            // Try to find role in 'userRole' (staff) OR 'role' (customer)
            const role = localStorage.getItem("userRole") || localStorage.getItem("role") || 'Member';
            const org = localStorage.getItem("organizationName") || 'your organization';
            
            setUserInfo({ email, role, org });
            setIsAuthenticated(true);
        } else if (adminToken) {
            const email = localStorage.getItem("platformAdminEmail") || 'Admin';
            const role = localStorage.getItem("platformAdminRole") || 'Platform Admin';
            setUserInfo({ email, role, org: 'XoCleaners Platform' }); 
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
            setUserInfo(null);
        }
    }, []); 

    const handleLogout = () => {
        // 1. Destroy all potential auth items
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token"); // Remove customer token
        localStorage.removeItem("userRole");
        localStorage.removeItem("role");  // Remove customer role
        localStorage.removeItem("organizationId");
        localStorage.removeItem("organizationName");
        localStorage.removeItem("userEmail");

        localStorage.removeItem("platformAdminToken");
        localStorage.removeItem("platformAdminRole");
        localStorage.removeItem("platformAdminEmail");

        // 2. Update state
        setIsAuthenticated(false);
        setUserInfo(null);

        // 3. Redirect
        navigate('/');
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
            }
        };
    }, []);

    // Dropdown Handlers
    const handleMouseEnter = () => {
        if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        setIsDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setIsDropdownOpen(false);
        }, HOVER_DELAY_MS);
    };

    // Role-based Routing
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
            case "platform_admin":
            case "platform admin":
                return "/platform-admin";
            case "customer":
                return "/customer";
            default:
                return "/"; 
        }
    };

    // Dashboard Click Handler
    const handleDashboardClick = () => {
        // Check for role in all possible storage keys
        const userRole = localStorage.getItem("userRole") || localStorage.getItem("role");
        const adminRole = localStorage.getItem("platformAdminRole");
        
        const role = adminRole || userRole; 
        
        const path = getRouteByRole(role || '');
        navigate(path);
    };

    const navLinks = [
        { name: 'Home', to: '/', icon: Home },
        { name: 'About', to: '/about', icon: Info },
        { name: 'Services', to: '/services', icon: Briefcase },
        { name: 'Contact', to: '/contact', icon: Phone },
    ];

    const loginOptions = [
        { name: 'Platform Admin', to: '/platform-admin', icon: Shield },
        { name: 'Store Owner', to: '/store-owner-login', icon: Compass },
        { name: 'Store Worker', to: '/workers-login', icon: Users },
        { name: 'Customer', to: '/customer-login', icon: User },
    ];

    return (
        <>
            <header className="bg-white shadow-lg sticky top-0 z-10 font-sans">
                <div className="w-full max-w-[98vw] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">                    
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-300">
                            <Shirt className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300">
                            XoCleaners
                        </h1>
                    </Link>
                    
                    {/* Navigation */}
                    <nav className="flex items-center space-x-8">
                        
                        {/* Links */}
                        <div className="hidden md:flex space-x-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.to}
                                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-100 font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center"
                                >
                                    <link.icon className="h-4 w-4 mr-1.5" />
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Auth Section */}
                        <div className="relative">
                            {isAuthenticated ? (
                                // LOGGED IN STATE
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={handleDashboardClick}
                                        className="flex items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-100 focus:outline-none focus:ring-4 focus:ring-blue-300"
                                    >
                                        <LayoutDashboard className="h-5 w-5 mr-2" />
                                        Dashboard
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-100 focus:outline-none focus:ring-4 focus:ring-red-300"
                                    >
                                        <LogOut className="h-5 w-5 mr-2" />
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                // LOGGED OUT STATE (Dropdown)
                                <div 
                                    className="relative"
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button 
                                        className="flex items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-100 focus:outline-none focus:ring-4 focus:ring-blue-300"
                                        aria-expanded={isDropdownOpen}
                                        aria-haspopup="true"
                                    >
                                        <User className="h-5 w-5 mr-2" />
                                        Login
                                        <svg className={`ml-2 h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    
                                    <div 
                                        className={`absolute right-0 mt-3 w-60 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-opacity duration-150 ${isDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                                        role="menu" 
                                        aria-orientation="vertical" 
                                    >
                                        <div className="py-2" role="none">
                                            {loginOptions.map((option) => (
                                                <Link
                                                    key={option.name}
                                                    to={option.to}
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition duration-150"
                                                    role="menuitem"
                                                >
                                                    <option.icon className="h-5 w-5 mr-3 text-gray-400 hover:text-blue-600" />
                                                    {option.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </header>

            {/* Welcome Bar */}
            {isAuthenticated && userInfo && (
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                        <p className="text-sm text-gray-700">
                            Welcome, <span className="font-bold text-blue-700">{userInfo.email}</span>
                        </p>
                        
                        <div className="flex items-center space-x-4">
                            <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                <User className="w-3 h-3 mr-1.5" />
                                {userInfo.role}
                            </span>
                            <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                <Briefcase className="w-3 h-3 mr-1.5" />
                                {userInfo.org}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;