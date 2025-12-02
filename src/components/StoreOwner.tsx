import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  DollarSign,
  Users,
  UserPlus,
  BarChart3,
  Shield,
  X,
  Power,
  RefreshCcw, // Icon for Reactivation
} from "lucide-react";
import baseURL from "../lib/config";
import Header from "./Header";

export default function StoreOwner() {
  const [organizationName, setOrganizationName] = useState("Your Organization");
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem("organizationName");
    if (name) setOrganizationName(name);
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) {
        setError("Authentication token missing. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${baseURL}/workers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Ensure response data is an array before setting state
      if (Array.isArray(response.data)) {
        setWorkers(response.data);
      } else {
        setWorkers([]);
      }
      
    } catch (err: any) {
      console.error("Error fetching workers:", err);
      setError(
        err.response?.data?.detail || "Failed to fetch workers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (userId: number) => {
    if (!window.confirm("Are you sure you want to deactivate this user? They will lose access immediately.")) return;

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      await axios.delete(`${baseURL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh list to show updated status
      fetchWorkers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to deactivate user.");
    }
  };

  const handleReactivate = async (userId: number) => {
    if (!window.confirm("Are you sure you want to reactivate this user?")) return;

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      await axios.patch(`${baseURL}/users/${userId}/reactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh list to show updated status
      fetchWorkers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to reactivate user.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Header />

      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-grow">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Store Owner Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Managing <span className="font-semibold text-indigo-600">{organizationName}</span>
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* Card 1: Manage Staff (Opens Modal) */}
          <div
            onClick={() => {
              setShowModal(true);
              fetchWorkers();
            }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-center space-x-4"
          >
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Manage Staff</h3>
              <p className="text-sm text-gray-500">View & Edit Employees</p>
            </div>
          </div>

          {/* Card 2: Add Worker (Navigates to Page) */}
          <div 
             onClick={() => navigate("/add-worker")}
             className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-center space-x-4"
          >
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <UserPlus size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Add Worker</h3>
              <p className="text-sm text-gray-500">Register new staff</p>
            </div>
          </div>

          {/* Card 3: Reports */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-full text-purple-600">
              <BarChart3 size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Sales Reports</h3>
              <p className="text-sm text-gray-500">View performance</p>
            </div>
          </div>

          {/* Card 4: Audit Logs */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-center space-x-4">
            <div className="bg-orange-100 p-3 rounded-full text-orange-600">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Audit Logs</h3>
              <p className="text-sm text-gray-500">Track system changes</p>
            </div>
          </div>
        </div>

        {/* Workers Management Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Users size={20} className="text-indigo-600" />
                  Staff Management
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : workers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No workers found in this organization.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {workers.map((worker, index) => (
                          <tr key={worker.id} className={`hover:bg-gray-50 transition-colors ${worker.is_deactivated ? 'bg-gray-50' : ''}`}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${worker.is_deactivated ? 'text-gray-400' : 'text-gray-900'}`}>
                              {worker.first_name} {worker.last_name}
                            </td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm ${worker.is_deactivated ? 'text-gray-400' : 'text-gray-500'}`}>
                                {worker.email}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                                    {worker.role}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              {worker.is_deactivated ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Inactive
                                </span>
                              ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                              <div className="flex items-center justify-center gap-2">
                                {worker.is_deactivated ? (
                                  <button
                                    onClick={() => handleReactivate(worker.id)}
                                    className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition-colors group relative"
                                    title="Reactivate User"
                                  >
                                    <RefreshCcw size={18} />
                                    {/* Tooltip */}
                                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        Reactivate
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleDeactivate(worker.id)}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors group relative"
                                    title="Deactivate User"
                                  >
                                    <Power size={18} />
                                    {/* Tooltip */}
                                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        Deactivate
                                    </span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 text-red-700 px-6 py-4 rounded-xl shadow-lg border border-red-100 animate-slide-in">
            <div className="flex items-center gap-2">
                <X size={20} className="cursor-pointer" onClick={() => setError(null)} />
                {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}