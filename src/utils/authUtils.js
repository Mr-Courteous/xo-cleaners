// authUtils.js

const TOKEN_KEY = 'adminAuthToken';

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  // Store the token received from the backend
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  // Clear the token on logout
  localStorage.removeItem(TOKEN_KEY);
};

// Optional: Function to include the token in HTTP headers
export const getAuthHeaders = () => {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};