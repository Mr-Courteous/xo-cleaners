import { useState, useEffect } from "react";
import { getToken, removeToken } from '../utils/authUtils';


const API_BASE = import.meta.env.VITE_API_URL || "";

console.log("API_BASE is set to:", API_BASE);

export function useApi<T>(url: string, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("adminAuthToken");
      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("adminAuthToken");
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


export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 401) {
    // 🚨 Token invalid/expired, remove it
    removeToken();
    // Optional: redirect or notify App
    window.dispatchEvent(new Event("unauthorized"));
    throw new Error("Unauthorized - Please login again");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}