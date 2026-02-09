import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Truck, RefreshCw, Eye, EyeOff } from 'lucide-react';
import Header from './Header';
import baseURL from "../lib/config";

interface HomePageProps {
    onLoginClick: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLoginClick }) => {
    const navigate = useNavigate();

    // Form State
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('Dry Cleaning');
    const [orgType, setOrgType] = useState('full_store'); // New: Defaults to Full Store
    const [adminFirstName, setAdminFirstName] = useState('');
    const [adminLastName, setAdminLastName] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminConfirmPassword, setAdminConfirmPassword] = useState('');

    // UI State
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const handleRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);

        if (adminPassword !== adminConfirmPassword) {
            setIsError(true);
            setMessage('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        // 1️⃣ Payload now perfectly matches your backend's "OrganizationWithAdminCreate"
        const payload = {
            name: companyName.trim(),
            industry: industry.trim(),
            admin_email: companyEmail.trim(),
            admin_password: adminPassword.trim(),
            admin_first_name: adminFirstName.trim(),
            admin_last_name: adminLastName.trim(),
            org_type: orgType,       // full_store, smart_locker, etc.
            parent_org_id: null      // Since this is a new registration
        };

        try {
            const response = await fetch(`${baseURL}/register/new-organization`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && response.status === 201) {
                setMessage(`✅ ${data.message || 'Organization registered successfully!'}`);

                // Reset form
                setCompanyName('');
                setAdminFirstName('');
                setAdminLastName('');
                setCompanyEmail('');
                setAdminPassword('');
                setAdminConfirmPassword('');
                setOrgType('full_store');

                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                setIsError(true);
                // 2️⃣ Handle Backend Validation errors (Detail from Pydantic)
                const errorDetail = Array.isArray(data.detail) ? data.detail[0]?.msg : data.detail;
                const errorMsg = errorDetail || data.message || `❌ Registration failed.`;
                setMessage(errorMsg);
            }
        } catch (error) {
            console.error('Network error:', error);
            setIsError(true);
            setMessage('A network error occurred. Please check if the backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        { icon: CheckCircle, title: 'Optimized Workflow', description: 'Streamline drop-off, processing, and pickup with guided interfaces.' },
        { icon: Truck, title: 'Driver/Delivery Integration', description: 'Manage delivery routes and driver agent tasks efficiently from one platform.' },
        { icon: RefreshCw, title: 'Real-time Status Updates', description: 'Keep staff and customers informed with instant updates on all ticket statuses.' },
    ];

    const messageClasses = isError ? "text-red-600 bg-red-50 border-red-200" : "text-green-600 bg-green-50 border-green-200";

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header onLoginClick={onLoginClick} />

            <main>
                {/* Hero Section */}
                <div className="bg-blue-600 text-white py-24 text-center">
                    <h2 className="text-5xl md:text-6xl font-extrabold mb-4">
                        The Modern Management System for Dry Cleaners
                    </h2>
                    <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
                        Effortlessly manage tickets, staff, racks, and customers all in one place.
                    </p>
                    <a href="#registration" className="inline-block bg-white text-blue-600 font-bold text-lg px-10 py-4 rounded-full shadow-xl hover:bg-gray-100 transition transform hover:scale-105">
                        Get Started Free
                    </a>
                </div>

                {/* Features */}
                <div className="py-20">
                    <div className="max-w-7xl mx-auto px-4">
                        <h3 className="text-3xl font-bold text-center mb-12">Built for Efficiency</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {features.map(({ icon: Icon, title, description }, i) => (
                                <div key={i} className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition">
                                    <div className="w-16 h-16 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                        <Icon className="h-8 w-8" />
                                    </div>
                                    <h4 className="text-xl font-semibold mb-2">{title}</h4>
                                    <p className="text-gray-600">{description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
                <div id="registration" className="py-20 bg-blue-50">
                    <div className="max-w-xl mx-auto px-4">
                        <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl">
                            {/* <h3 className="text-3xl font-bold text-center mb-6 text-gray-900">
                                Start Your 14-Day Free Trial
                            </h3> */}

                            <form onSubmit={handleRegistration} className="space-y-5">
                                {/* 3️⃣ New: Business Model Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Model</label>
                                    <select
                                        value={orgType}
                                        onChange={(e) => setOrgType(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="full_store">Full Store (Wash & Pick-up)</option>
                                        {/* <option value="drop_off_internal">Drop-off Point (Link to my Plant)</option> */}
                                        <option value="drop_off_external">Drop-off Point (Third-party Plant)</option>
                                        {/* <option value="smart_locker">Smart Locker (Contactless)</option> */}
                                    </select>
                                    {/* <p className="mt-1 text-xs text-gray-500 italic">
                                        * Choosing Smart Locker restricts rack management features.
                                    </p> */}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg"
                                        placeholder="Enter business name"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                                        <input
                                            type="text"
                                            value={adminFirstName}
                                            onChange={(e) => setAdminFirstName(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                        <input
                                            type="text"
                                            value={adminLastName}
                                            onChange={(e) => setAdminLastName(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Work Email</label>
                                    <input
                                        type="email"
                                        value={companyEmail}
                                        onChange={(e) => setCompanyEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg"
                                        placeholder="you@company.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showAdminPassword ? 'text' : 'password'}
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            minLength={8}
                                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showAdminPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                    <input
                                        type={showAdminPassword ? 'text' : 'password'}
                                        value={adminConfirmPassword}
                                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 rounded-lg text-white font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50 transition shadow-lg"
                                >
                                    {isLoading ? 'Processing...' : 'Register My Company'}
                                </button>
                            </form>

                            <p className="text-center text-sm text-gray-500 mt-6">
                                Already registered?{' '}
                                <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-semibold">
                                    Login here
                                </button>
                            </p>

                            {message && (
                                <p className={`mt-6 text-center text-sm font-medium p-3 rounded-lg border ${messageClasses}`}>
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HomePage;