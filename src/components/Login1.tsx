import React, { useState } from 'react';

// --- Start of Replaced Imports: authUtils and useApi ---

/**
 * Utility function to set the access token in localStorage.
 * This replaces the external '../utils/authUtils' dependency.
 * @param {string} token - The access token string.
 */
const setToken = (token) => {
    localStorage.setItem('access_token', token);
};

/**
 * Replacement for '../hooks/useApi' - a simple mock API caller.
 * This implementation is basic and assumes successful JSON response.
 * In a real application, you would need robust error handling and proper headers.
 * @param {string} endpoint - The API endpoint (e.g., '/auth/login').
 * @param {object} options - Fetch options including method and body.
 * @returns {Promise<object>} - The parsed JSON response.
 */
const apiCall = async (endpoint, options) => {
    // NOTE: This URL should be the actual base URL of your backend.
    const baseUrl = 'http://localhost:8001/api';
    const url = `${baseUrl}${endpoint}`;

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers, // Allow user to override headers
        },
    });

    // Handle HTTP errors
    if (!response.ok) {
        let errorDetail = await response.text();
        try {
            // Try to parse JSON error message if available
            const jsonError = JSON.parse(errorDetail);
            if (jsonError.detail) {
                errorDetail = jsonError.detail;
            }
        } catch (e) {
            // If not JSON, use the raw text
        }
        throw new Error(`HTTP error ${response.status}: ${errorDetail}`);
    }

    // Attempt to parse JSON response
    return response.json();
};

// --- End of Replaced Imports ---

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [user, setUser] = useState('');


    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });

            // --- CORRECTION STARTS HERE ---
            const token = response.access_token;
            const role = response.user ? response.user.role : null; // Access the role via response.user.role
            const user = response.user ? response.user.username : null; // Access the role via response.user.role
            const email = response.user ? response.user.email : null; // Access the role via response.user.role



            // 1. Log the full response and the CORRECTED role path
            console.log('Login API Response:', response);
            console.log('User Role:', role); // Log the correctly extracted role
            // --- CORRECTION ENDS HERE ---

            if (token) {
                setToken(token);

                // 2. Save the user's role in localStorage
                if (role) {
                    localStorage.setItem('user_role', role);
                    localStorage.setItem('user_username', user);
                    localStorage.setItem('user_email', email);

                }

                // Update SPA URL to /dashboard (no full reload) and to notify parent
                try {
                    window.history.replaceState({}, '', '/dashboard');
                } catch (e) {
                    // ignore if history manipulation fails in some environments
                }
                onLoginSuccess();
            } else {
                setError('Login failed: No token received.');
            }
        } catch (err: any) {
            // The apiCall now throws an Error object, so we catch it here.
            setError(`Login failed: ${err.message}`);
            console.error('Login error:', err.message || err);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #a8dadc, #f0f8ff)',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px 30px',
                borderRadius: '12px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center'
            }}>
                <h2 style={{ marginBottom: '25px', color: '#1d3557', fontFamily: 'Arial, sans-serif' }}>Admin Login</h2>

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '6px',
                                border: '1px solid #ccc',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '6px',
                                border: '1px solid #ccc',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    {error && <p style={{ color: '#e63946', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}

                    <button type="submit" style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#457b9d',
                        color: 'white',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        transition: 'background 0.3s'
                    }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d3557'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#457b9d'}
                    >
                        Log In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
