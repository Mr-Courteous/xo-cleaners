import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Truck, RefreshCw } from 'lucide-react';
import Header from './Header';

let API_BASE_URL = 'http://localhost:8001';

import baseURL from "../lib/config";

interface HomePageProps {
    onLoginClick: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLoginClick }) => {
    const navigate = useNavigate();

    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('Dry Cleaning');
    const [adminFirstName, setAdminFirstName] = useState('');
    const [adminLastName, setAdminLastName] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const handleRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);

        const payload = {
            name: companyName.trim(),
            industry: industry.trim(),
            admin_email: companyEmail.trim(),
            admin_password: adminPassword.trim(),
            admin_first_name: adminFirstName.trim(),
            admin_last_name: adminLastName.trim(),
        };

        try {
            const response = await fetch(`${baseURL}/register/new-organization`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // Try to parse JSON safely
            const data = await response.json().catch(() => ({}));

            if (response.ok && response.status === 201) {
                setMessage(`✅ ${data.message || 'Organization registered successfully!'}`);
                
                // Reset form
                setCompanyName('');
                setAdminFirstName('');
                setAdminLastName('');
                setCompanyEmail('');
                setAdminPassword('');
                setIndustry('Dry Cleaning');

                // Redirect after delay
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                setIsError(true);
                const errorMsg =
                    data.detail ||
                    data.message ||
                    `❌ Registration failed (status ${response.status}).`;
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

    const messageClasses = isError ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50";

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
                    <a
                        href="#registration"
                        className="inline-block bg-white text-blue-600 font-bold text-lg px-10 py-4 rounded-full shadow-xl hover:bg-gray-100 transition transform hover:scale-105"
                    >
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

                {/* Registration */}
                <div id="registration" className="py-20 bg-blue-50">
                    <div className="max-w-xl mx-auto px-4">
                        <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl">
                            <h3 className="text-3xl font-bold text-center mb-6 text-gray-900">
                                Start Your 14-Day Free Trial
                            </h3>
                            <p className="text-center text-gray-600 mb-8">
                                Register your business and create the main admin account below.
                            </p>

                            <form onSubmit={handleRegistration} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Admin First Name</label>
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
                                        <label className="block text-sm font-medium text-gray-700">Admin Last Name</label>
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
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        minLength={8}
                                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 rounded-lg text-white font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50 transition"
                                >
                                    {isLoading ? 'Registering...' : 'Register My Company'}
                                </button>
                            </form>

                            <p className="text-center text-sm text-gray-600 mt-6">
                                Already registered?{' '}
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-blue-600 hover:underline font-semibold"
                                >
                                    Login here
                                </button>
                            </p>

                            {message && (
                                <p className={`mt-6 text-center text-sm font-medium p-3 rounded-lg ${messageClasses}`}>
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
