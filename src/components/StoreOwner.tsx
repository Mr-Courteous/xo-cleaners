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

      setWorkers(response.data?.workers || []);
      setShowModal(true);
    } catch (err: any) {
      console.error("Error fetching workers:", err);
      setError(
        err.response?.status === 403
          ? "You don’t have permission to view this data."
          : "Failed to load workers. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = () => navigate("/add-worker");
  const closeModal = () => setShowModal(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero / Welcome Section */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-800">
              Welcome, {organizationName}!
            </h1>
            <h2 className="text-xl font-semibold text-gray-900 mt-1">
              Store Owner Dashboard
            </h2>
            <p className="text-gray-600 mt-2">
              High-level financial overview, staff management, and system override access.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600 font-medium">
            <Shield className="h-5 w-5 text-green-500" />
            <span>Role: Store Owner</span>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Overview */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              High-Level Financial Dashboard
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-xl shadow-inner text-center">
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-800 mt-1">$45,210</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl shadow-inner text-center">
                <p className="text-sm text-gray-600">Gross Profit</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">$18,450</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl shadow-inner text-center">
                <p className="text-sm text-gray-600">Total Costs</p>
                <p className="text-2xl font-bold text-red-800 mt-1">$26,760</p>
              </div>
            </div>
          </div>

          {/* Approvals & Worker Management */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-red-600" />
              Approvals & Overrides
            </h3>
            <div className="space-y-3">
              <button className="w-full bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center justify-center shadow">
                <DollarSign className="h-4 w-4 mr-2" /> Approve Large Transactions
              </button>
              <button className="w-full bg-yellow-500 text-white px-4 py-3 rounded-xl hover:bg-yellow-600 transition-colors font-medium flex items-center justify-center shadow">
                <Users className="h-4 w-4 mr-2" /> Manage Store Access
              </button>
              <button
                onClick={handleAddWorker}
                className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center shadow"
              >
                <UserPlus className="h-4 w-4 mr-2" /> Add Admin
              </button>
              <button
                onClick={fetchWorkers}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center shadow"
              >
                <Users className="h-4 w-4 mr-2" />
                {loading ? "Loading..." : "View All Workers"}
              </button>
            </div>
          </div>
        </div>

        {/* Workers Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 relative">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>

              <h2 className="text-2xl font-bold text-blue-700 mb-4">
                Organization Workers
              </h2>

              {workers.length === 0 ? (
                <p className="text-gray-600">No workers found for this organization.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-left">#</th>
                        <th className="border p-2 text-left">Name</th>
                        <th className="border p-2 text-left">Email</th>
                        <th className="border p-2 text-left">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workers.map((worker, index) => (
                        <tr key={worker.id} className="hover:bg-gray-50">
                          <td className="border p-2">{index + 1}</td>
                          <td className="border p-2">
                            {worker.first_name} {worker.last_name}
                          </td>
                          <td className="border p-2">{worker.email}</td>
                          <td className="border p-2 capitalize">{worker.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl shadow-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
