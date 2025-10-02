import React, { useState } from 'react';
import axios from 'axios';
import { setToken } from '../utils/authUtils';
const API_BASE = import.meta.env.VITE_API_URL || "";


const LOGIN_API_URL = `${API_BASE}/auth/login`;

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(LOGIN_API_URL, { username, password });
            const token = response.data.access_token;

            if (token) {
                setToken(token);
                onLoginSuccess();
            } else {
                setError('Login failed: No token received.');
            }
        } catch (err) {
            setError('Login failed. Check credentials and server status.');
            console.error('Login error:', err.response?.data || err.message);
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
