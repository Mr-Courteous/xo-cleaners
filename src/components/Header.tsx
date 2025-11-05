import React, { useState, useRef, useEffect } from 'react';
import { Shirt, Shield, User, Briefcase, Users, Home, Info, Phone, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Header component serving as the application header with full navigation and a hover-delayed dropdown.
 * Uses standard <a> tags for navigation functionality.
 */
const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownTimeoutRef = useRef(null);
    const HOVER_DELAY_MS = 200; // Delay in milliseconds before closing the dropdown

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
            }
        };
    }, []);

    // Function to handle mouse entering the Login button or dropdown area
    const handleMouseEnter = () => {
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
        }
        setIsDropdownOpen(true);
    };

    // Function to handle mouse leaving the Login button or dropdown areas  
    const handleMouseLeave = () => {
        // Set a timeout to delay the closing action
        dropdownTimeoutRef.current = setTimeout(() => {
            setIsDropdownOpen(false);
        }, HOVER_DELAY_MS);
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
    ];

    return (
        <header className="bg-white shadow-lg sticky top-0 z-10 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                
                {/* Logo and App Name - Use Link for SPA navigation */}
                <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition duration-300">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-md">
                        <Shirt className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        XoCleaners
                    </h1>
                </Link>
                
                {/* Navigation and Login Container */}
                <nav className="flex items-center space-x-8">
                    
                    {/* Main Navigation Links */}
                    <div className="hidden md:flex space-x-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.to}
                                className="text-gray-600 hover:text-blue-700 font-medium py-2 px-3 rounded-lg transition duration-200 flex items-center"
                            >
                                <link.icon className="h-4 w-4 mr-1.5" />
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Login Dropdown */}
                    <div 
                        className="relative"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button 
                            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-full shadow-lg transition duration-300 transform hover:scale-[1.02] active:scale-100 focus:outline-none focus:ring-4 focus:ring-blue-300"
                            aria-expanded={isDropdownOpen}
                            aria-haspopup="true"
                        >
                            <User className="h-5 w-5 mr-2" />
                            Login
                            <svg className={`ml-2 h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        {/* Dropdown Menu */}
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
                </nav>
            </div>
        </header>
    );
};

export default Header;
