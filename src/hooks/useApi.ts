import { useState, useEffect } from "react";
import { getToken, removeToken } from "../utils/authUtils";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function buildUrl(endpoint: string) {
  if (!endpoint) return API_BASE;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
  // Prevent duplicate base path (e.g. API_BASE endsWith '/api' and endpoint startsWith '/api')
  try {
    const parsed = new URL(API_BASE);
    const basePath = parsed.pathname.replace(/\/$/, ''); // e.g. '/api'
    if (basePath && endpoint.startsWith(basePath)) {
      // remove the duplicated basePath prefix from endpoint
      endpoint = endpoint.slice(basePath.length) || '/';
    }
  } catch (e) {
    // API_BASE might be a relative path like '/api' — handle that case
    const basePath = API_BASE.startsWith('/') ? API_BASE.replace(/\/$/, '') : '';
    if (basePath && endpoint.startsWith(basePath)) {
      endpoint = endpoint.slice(basePath.length) || '/';
    }
  }

  return `${API_BASE}${endpoint}`;
}

console.log("API_BASE is set to:", API_BASE);

export function useApi<T>(url: string, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();

      const response = await fetch(buildUrl(url), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 401) {
        // 🚨 Token invalid/expired
        removeToken();
        // Notify App instantly
        window.dispatchEvent(new Event("unauthorized"));
        throw new Error("Unauthorized – please log in again");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

// ✅ Same behavior for direct calls
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  const response = await fetch(buildUrl(endpoint), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 401) {
    removeToken();
    window.dispatchEvent(new Event("unauthorized"));
    throw new Error("Unauthorized - Please login again");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}
