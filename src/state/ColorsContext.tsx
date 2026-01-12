import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import baseURL from '../lib/config';

export type BrandColors = {
  brandColor: string; 
  primaryColor: string;
  secondaryColor: string;
};

type ColorsState = {
  colors: BrandColors;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setColors: (c: Partial<BrandColors>) => void;
};

const DEFAULTS: BrandColors = {
  brandColor: '#2563eb',   // blue-600
  primaryColor: '#2563eb', // blue-600
  secondaryColor: '#10b981', // green-500
};

const ColorsContext = createContext<ColorsState | undefined>(undefined);

async function fetchColorsFromAPI(): Promise<Partial<BrandColors>> {
  const token = localStorage.getItem('accessToken');
  if (!token) return {};

  const headers = { Authorization: `Bearer ${token}` };

  // Note: Backend router is prefixed with /api/settings/
  const candidates = [
    `${baseURL}/api/settings/`, 
    `${baseURL}/api/settings`,
  ];

  for (const url of candidates) {
    try {
      const res = await axios.get(url, { headers });
      const data = res.data || {};
      
      // Mapping the snake_case fields from org_settings.py
      // to the camelCase BrandColors type used in frontend
      const mapped: Partial<BrandColors> = {
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        brandColor: data.primary_color, // Using primary as brand if not distinct
      };

      // Ensure we actually got color data before returning
      if (mapped.primaryColor || mapped.secondaryColor) {
        return mapped;
      }
    } catch (e) {
      console.warn(`Attempt to fetch from ${url} failed, trying next...`);
    }
  }
  return {};
}

export const ColorsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colors, setColorsState] = useState<BrandColors>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setColors = (c: Partial<BrandColors>) => {
    setColorsState(prev => ({ ...prev, ...c }));
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiColors = await fetchColorsFromAPI();
      setColorsState(prev => ({
        ...DEFAULTS,
        ...apiColors,
      }));
    } catch (err: any) {
      setError('Failed to load brand colors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<ColorsState>(() => ({ 
    colors, loading, error, refresh, setColors 
  }), [colors, loading, error]);

  return <ColorsContext.Provider value={value}>{children}</ColorsContext.Provider>;
};

export function useColors() {
  const ctx = useContext(ColorsContext);
  if (!ctx) throw new Error('useColors must be used within ColorsProvider');
  return ctx;
}

/**
 * Scoped CSS variables wrapper. 
 * Allows use of style={{ color: 'var(--primary-color)' }} in children components.
 */
export const ColorsScope: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors } = useColors();
  const style: React.CSSProperties = {
    ['--brand-color' as any]: colors.brandColor || colors.primaryColor,
    ['--primary-color' as any]: colors.primaryColor,
    ['--secondary-color' as any]: colors.secondaryColor,
  };
  return <div style={style} className="contents">{children}</div>;
};