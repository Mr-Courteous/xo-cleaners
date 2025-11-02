// src/components/RoleSwitcher.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { RefreshCw, User, CheckCircle } from 'lucide-react';

// Define all possible roles based on your application's logic
const ALL_ROLES = [
  'admin',
  'store_owner',
  'store_manager',
  'cashier_associate',
  'driver_agent',
  'laundry_staff',
  'store_admin' // Assuming store_admin is a distinct role
];

interface RoleSwitcherProps {
  onRoleSwitched: () => void; // Function to force a UI refresh (e.g., call window.location.reload or force a state update in App.tsx)
}

export default function RoleSwitcher({ onRoleSwitched }: RoleSwitcherProps) {
  const [loading, setLoading] = useState(false);
  const currentRole = useMemo(() => localStorage.getItem('user_role'), []);
  const isAdminOrOwner = currentRole === 'admin' || currentRole === 'store_owner';

  // Only allow switching if the current user is an Admin or Store Owner
  if (!isAdminOrOwner) {
    return null; // Don't render if not an admin/owner
  }

  const handleSwitch = useCallback((newRole: string) => {
    if (newRole === currentRole) return; // No change

    if (window.confirm(`Are you sure you want to switch your active role to ${newRole.toUpperCase()}? This is for testing only.`)) {
      setLoading(true);
      
      // 1. Update localStorage
      localStorage.setItem('user_role', newRole);
      
      // 2. Force UI refresh
      // Using a brief timeout to ensure localStorage is written before refresh/state change
      setTimeout(() => {
        setLoading(false);
        onRoleSwitched(); 
      }, 100);
    }
  }, [currentRole, onRoleSwitched]);

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg shadow-md mb-8">
      <h3 className="text-lg font-bold text-yellow-800 flex items-center mb-3">
        <User className="h-5 w-5 mr-2" /> Role Testing Switcher
      </h3>
      <p className="text-sm text-yellow-700 mb-4">
        **Current Role:** <span className="font-semibold text-yellow-900">{currentRole?.toUpperCase()}</span>
        <br/>
        Use these buttons to test the UI experience for different user roles.
      </p>

      <div className="flex flex-wrap gap-2">
        {ALL_ROLES.map(role => (
          <button
            key={role}
            onClick={() => handleSwitch(role)}
            disabled={loading || role === currentRole}
            className={`flex items-center px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 disabled:opacity-70 ${
              role === currentRole
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300'
            }`}
          >
            {loading && role !== currentRole ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : role === currentRole ? (
                <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
                <User className="h-3 w-3 mr-1" />
            )}
            {role.split('_').join(' ').toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}