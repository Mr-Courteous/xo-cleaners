import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  History, Search, RefreshCw, ArrowLeft, ArrowRight, 
  Filter, FileText, User, Tag, AlertCircle, Loader2 
} from 'lucide-react';
import baseURL from '../lib/config'; // ✅ Uses your existing config

// --- Types ---
interface AuditLog {
  id: number;
  actor_name: string;
  actor_role: string;
  action: string;
  ticket_id?: number;
  customer_id?: number;
  details: Record<string, any>;
  created_at: string;
}

const AuditLogTable: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  // --- Fetch Data ---
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken'); // Adjust key if you use 'access_token'
      
      const response = await axios.get(`${baseURL}/audit-logs`, {
        params: {
          limit: LIMIT,
          skip: page * LIMIT
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setLogs(response.data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError("Failed to load audit logs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  // --- Helper: Action Badges ---
  const getActionStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE')) return 'bg-red-100 text-red-800 border-red-200';
    if (act.includes('UPDATE') || act.includes('EDIT')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (act.includes('CREATE') || act.includes('ADD')) return 'bg-green-100 text-green-800 border-green-200';
    if (act.includes('LOGIN')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // --- Helper: Render Details JSON ---
  const renderDetails = (details: Record<string, any>) => {
    if (!details || Object.keys(details).length === 0) return <span className="text-gray-400">-</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(details).map(([key, value]) => {
            // Skip complex objects for cleanliness, or stringify them
            const displayValue = typeof value === 'object' ? JSON.stringify(value).slice(0, 20) + '...' : String(value);
            return (
              <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <span className="font-bold mr-1">{key.replace(/_/g, ' ')}:</span> {displayValue}
              </span>
            );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      
      {/* --- Header Section --- */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Audit Logs</h2>
            <p className="text-sm text-gray-500">Track all system activities and changes</p>
          </div>
        </div>
        
        <button 
          onClick={fetchLogs} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* --- Error State --- */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* --- Table Section --- */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && logs.length === 0 ? (
                // Loading Skeleton
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText size={40} className="text-gray-300" />
                      <p>No audit records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    {/* Timestamp */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium text-gray-900">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-full text-gray-600">
                          <User size={14} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.actor_name || "System"}</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">{log.actor_role}</div>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* References (Ticket/Cust) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 items-start">
                        {log.ticket_id && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            <Tag size={10} /> Ticket #{log.ticket_id}
                          </span>
                        )}
                        {log.customer_id && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                            <User size={10} /> Cust #{log.customer_id}
                          </span>
                        )}
                        {!log.ticket_id && !log.customer_id && <span className="text-gray-300 text-xs">-</span>}
                      </div>
                    </td>

                    {/* Details */}
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-sm">
                      {renderDetails(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Footer --- */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{page + 1}</span>
            </p>
          </div>
          <div className="flex-1 flex justify-between sm:justify-end gap-3">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} className="mr-2" />
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={logs.length < LIMIT || loading}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogTable;