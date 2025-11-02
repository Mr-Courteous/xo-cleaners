// authUtils.js

// 🔑 FIX: Change the key to 'access_token' to match the standard 
// FastAPI response key and ensure consistency across your frontend.
const TOKEN_KEY = 'access_token'; 

export const getToken = () => {
  // Now correctly reads from the 'access_token' key
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  // Store the token received from the backend under 'access_token'
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  // Clear the token on logout/401
  localStorage.removeItem(TOKEN_KEY);
};

// Optional: Function to include the token in HTTP headers
export const getAuthHeaders = () => {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};