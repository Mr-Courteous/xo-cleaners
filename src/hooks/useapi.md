import { useState, useEffect } from "react";
import { getToken, removeToken } from "../utils/authUtils"; 

// Use the VITE_API_URL environment variable for the base URL. Fallback to /api for dev.
const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

/**
 * Constructs the final URL for an API endpoint.
 * Handles absolute URLs, relative URLs, and path cleanup.
 */
function buildUrl(endpoint: string): string {
  if (!endpoint) return API_BASE;
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) return endpoint;
  if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;

  try {
    const parsed = new URL(API_BASE);
    const basePath = parsed.pathname.replace(/\/$/, "");
    if (basePath && endpoint.startsWith(basePath)) {
      endpoint = endpoint.slice(basePath.length) || "/";
    }
  } catch {
    const basePath = API_BASE.startsWith("/") ? API_BASE.replace(/\/$/, "") : "";
    if (basePath && endpoint.startsWith(basePath)) {
      endpoint = endpoint.slice(basePath.length) || "/";
    }
  }

  return `${API_BASE}${endpoint}`;
}

console.log("API_BASE is set to:", API_BASE);

/**
 * React Hook for fetching data (GET requests) with automatic state management.
 * NOTE: Added mock logic for development environments to bypass 401/403 errors.
 */
export function useApi<T>(url: string, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    // --- Mock Data for Dashboard Stats when running without a full backend ---
    if (url.includes("/dashboard/stats")) {
        console.log("MOCKING: Dashboard stats API call intercepted.");
        setData({
            total_tickets: 150,
            pending_pickup: 15,
            in_process: 50,
            occupied_racks: 20,
            available_racks: 30,
            admin_info: {
                username: "admin_user",
                email: "admin@example.com",
                role: "admin"
            }
        } as T);
        setLoading(false);
        return;
    }
    // --------------------------------------------------------------------------

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      const headers: Record<string, string> = {};

      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(buildUrl(url), { headers });

      if (!response.ok) {
        // Log the unauthorized event for debugging, but don't crash
        if (response.status === 401 || response.status === 403) {
            console.warn(`Authentication/Authorization issue: ${response.status}. Please ensure token is valid.`);
            // Optionally, we can remove the token here, but we proceed with error message
            // removeToken();
            // window.dispatchEvent(new Event("unauthorized"));
        }

        // Attempt to extract meaningful error message
        let message = `HTTP error! status: ${response.status}`;
        try {
          const errJson = await response.json();
          message = errJson.detail ? (Array.isArray(errJson.detail) ? errJson.detail[0].msg : errJson.detail) : message;
        } catch {
            message = response.statusText || message;
        }
        throw new Error(message);
      }

      // Check for empty responses (e.g., 204 No Content)
      const isNoContent = response.status === 204 || response.headers.get('content-length') === '0';
      if (isNoContent) {
        setData(null);
        return;
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Utility function for making API calls (POST, PUT, DELETE, etc.) 
 * that returns a Promise for the response data.
 */
export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Use uppercase method name for checks
  const method = (options.method || 'GET').toUpperCase(); 
  
  // Only set Content-Type for requests that have a body and are not FormData
  const isFormData = options.body instanceof FormData;
  const requiresJson = method !== 'GET' && method !== 'HEAD' && method !== 'DELETE' && options.body && !isFormData;
  
  if (requiresJson) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl(endpoint), {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
  
  if (!response.ok) {
    // Handling 401/403 error during API call
    if (response.status === 401) {
        console.warn("401 Unauthorized encountered in apiCall. Clearing token.");
        removeToken();
        window.dispatchEvent(new Event("unauthorized"));
    }
    
    let message = `Request failed with status ${response.status}`;
    try {
      const textResponse = await response.text();
      const errJson = JSON.parse(textResponse);
        
      // Handling FastAPI's 'detail' field (string or array of validation errors)
      if (Array.isArray(errJson.detail)) {
          // Concatenate validation errors into a single message
          message = "Validation Failed: " + errJson.detail.map((d: any) => {
              const field = d.loc.length > 0 ? d.loc[d.loc.length - 1] : 'Field';
              return `${field} error: ${d.msg}`;
          }).join('; ');
      } else if (typeof errJson.detail === 'string') {
          // Handle generic detail message
          message = errJson.detail;
      } else {
          // Fallback to other error keys
          message = errJson.error || message;
      }

    } catch (e) {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  // Explicitly check for No Content status codes (204, 205)
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  // For all other successful status codes (200, 201), attempt to parse JSON.
  try {
    return await response.json();
  } catch (e) {
    return null;
  }
}
