import React from 'react';
// 🎯 FIX: 'Inventory' icon is replaced with the valid 'PackageOpen' icon from lucide-react.
import { Package, Truck, PackageOpen, ListTodo, Users, CheckCircle, Clock } from 'lucide-react';

export default function StoreManager() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Store Manager Operations</h2>
        <p className="text-gray-600">Monitor order progress, assign tasks to staff, and manage store inventory.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Monitoring Dashboard */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><Package className="h-5 w-5 mr-2 text-blue-600" /> Real-Time Order Progress</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 border rounded-lg">
              <p className="text-3xl font-bold text-blue-600">87</p>
              <p className="text-sm text-gray-600">Received</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-3xl font-bold text-amber-600">145</p>
              <p className="text-sm text-gray-600">Processing</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-3xl font-bold text-green-600">55</p>
              <p className="text-sm text-gray-600">Ready</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-3xl font-bold text-gray-600">22</p>
              <p className="text-sm text-gray-600">Out for Delivery</p>
            </div>
          </div>
          <button className="w-full mt-4 bg-gray-100 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            Monitor All Orders (Link to Status View)
          </button>
        </div>

        {/* Staff Assignment */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><Users className="h-5 w-5 mr-2 text-purple-600" /> Staff & Route Assignments</h3>
          <div className="space-y-3">
            <button className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
              Assign Orders to Staff (Washers, Pressers)
            </button>
            <button className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center">
              <Truck className="h-4 w-4 mr-2" /> Manage Driver Route Assignments
            </button>
          </div>
        </div>

        {/* Quick Approvals & Inventory */}
        <div className="lg:col-span-3 grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-600" /> Approvals</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">2 Pending Timesheet Approvals</p>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                Approve Clock-in/out
              </button>
              <button className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm">
                Approve Promo/Price Adjustments
              </button>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            {/* 🎯 FIX APPLIED: Using PackageOpen component */}
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><PackageOpen className="h-5 w-5 mr-2 text-red-600" /> Inventory Management</h3>
            <p className="text-sm text-gray-500">Detergents, Hangers, Bags, etc.</p>
            <button className="w-full mt-3 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium">
              Manage Inventory Levels
            </button>
            <button className="w-full mt-2 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              Request Supplies from Admin
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><Clock className="h-5 w-5 mr-2 text-indigo-600" /> Reporting</h3>
            <button className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Generate Shift Reports
            </button>
            <button className="w-full mt-2 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              Handle Escalated Complaints
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}