import React, { useState, useRef, useEffect } from 'react';
import { Shirt, Shield, User, Briefcase, Users, Home, Info, Phone, Compass, LogOut, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useColors } from '../state/ColorsContext'; //

/**
 * Updated Header component using dynamic branding from ColorsContext.
 */
const Header = () => {
    const { colors } = useColors(); //
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const HOVER_DELAY_MS = 200;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userInfo, setUserInfo] = useState<{ email: string; role: string; org: string } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const regularToken = localStorage.getItem("accessToken") || localStorage.getItem("token");
        const adminToken = localStorage.getItem("platformAdminToken"); 

        if (regularToken) {
            const email = localStorage.getItem("userEmail") || 'User';
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
        localStorage.clear();
        setIsAuthenticated(false);
        setUserInfo(null);
        navigate('/');
    };

    const handleMouseEnter = () => {
        if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        setIsDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setIsDropdownOpen(false);
        }, HOVER_DELAY_MS);
    };

    const getRouteByRole = (role: string) => {
        switch (role?.toLowerCase()) {
            case "store_owner": return "/org";
            case "store_manager": return "/store/manager/dashboard";
            case "driver": return "/driver/dashboard";
            case "assistant": return "/assistant/dashboard";
            case "cashier": return "/cashier";
            case "platform_admin":
            case "platform admin": return "/platform-admin";
            case "customer": return "/customer";
            default: return "/"; 
        }
    };

    const handleDashboardClick = () => {
        const role = localStorage.getItem("platformAdminRole") || localStorage.getItem("userRole") || localStorage.getItem("role");
        navigate(getRouteByRole(role || ''));
    };

    return (
        <>
            {/* Main Header with Branded Glass Effect */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 font-sans transition-all">
                <div className="w-full max-w-[98vw] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">                    
                    
                    {/* Logo with Dynamic Brand Gradient */}
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div 
                            style={{ backgroundColor: colors.primaryColor }} //
                            className="p-2 rounded-xl shadow-lg transform transition-all duration-300 group-hover:scale-105"
                        >
                            <Shirt className="h-7 w-7 text-white" />
                        </div>
                        <h1 
                            className="text-3xl font-black tracking-tight bg-clip-text text-transparent transition-all duration-300"
                            style={{ 
                                backgroundImage: `linear-gradient(to right, ${colors.primaryColor}, ${colors.secondaryColor})` //
                            }}
                        >
                            Xo Cleaners
                        </h1>
                    </Link>
                    
                    <nav className="flex items-center space-x-8">
                        {/* Desktop Links */}
                        <div className="hidden md:flex space-x-2">
                            {['Home', 'About', 'Services', 'Contact'].map((name) => (
                                <Link
                                    key={name}
                                    to={name === 'Home' ? '/' : `/${name.toLowerCase()}`}
                                    className="text-gray-500 hover:bg-gray-50 font-bold py-2 px-4 rounded-xl transition-all flex items-center"
                                    style={{ '--hover-color': colors.primaryColor } as any}
                                    onMouseEnter={(e) => e.currentTarget.style.color = colors.primaryColor}
                                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                                >
                                    {name}
                                </Link>
                            ))}
                        </div>

                        {/* Auth Buttons */}
                        <div className="relative">
                            {isAuthenticated ? (
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={handleDashboardClick}
                                        style={{ backgroundColor: colors.primaryColor }} //
                                        className="flex items-center text-white font-bold px-6 py-2.5 rounded-xl shadow-md hover:opacity-90 transition-all active:scale-95"
                                    >
                                        <LayoutDashboard className="h-5 w-5 mr-2" />
                                        Dashboard
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center bg-gray-100 text-gray-600 font-bold px-6 py-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                                    >
                                        <LogOut className="h-5 w-5 mr-2" />
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className="relative"
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button 
                                        style={{ backgroundColor: colors.primaryColor }} //
                                        className="flex items-center text-white font-bold px-6 py-2.5 rounded-xl shadow-md hover:opacity-90 transition-all"
                                    >
                                        <User className="h-5 w-5 mr-2" />
                                        Login
                                        <svg className={`ml-2 h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    
                                    <div className={`absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 transition-all ${isDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                                        <div className="py-2 p-2">
                                            {['Platform Admin', 'Store Owner', 'Store Worker', 'Customer'].map((opt) => (
                                                <Link
                                                    key={opt}
                                                    to={`/${opt.toLowerCase().replace(' ', '-')}-login`}
                                                    className="flex items-center px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                                                    onMouseEnter={(e) => e.currentTarget.style.color = colors.primaryColor}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                                                >
                                                    {opt}
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

            {/* Welcome Bar with Themed Badges */}
            {isAuthenticated && userInfo && (
                <div className="bg-white/50 border-b border-gray-100">
                    <div className="max-w-[98vw] mx-auto px-8 py-2.5 flex flex-col sm:flex-row justify-between items-center">
                        <p className="text-xs font-bold text-gray-500">
                            Logged in as <span className="text-gray-900">{userInfo.email}</span>
                        </p>
                        
                        <div className="flex items-center space-x-3">
                            <span 
                                style={{ backgroundColor: `${colors.primaryColor}15`, color: colors.primaryColor }} //
                                className="inline-flex items-center text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest"
                            >
                                <User className="w-3 h-3 mr-1.5" />
                                {userInfo.role}
                            </span>
                            <span 
                                style={{ backgroundColor: `${colors.secondaryColor}15`, color: colors.secondaryColor }} //
                                className="inline-flex items-center text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest"
                            >
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