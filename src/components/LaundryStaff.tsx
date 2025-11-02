import React from 'react';
import { Shirt, CheckCircle, AlertTriangle, ListOrdered, Clock } from 'lucide-react';

export default function LaundryStaff() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Laundry Staff / Operator Workload</h2>
        <p className="text-gray-600">View assigned items and update the production status of orders.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Assigned Workload */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><ListOrdered className="h-5 w-5 mr-2 text-blue-600" /> My Current Workload (Ticket #78901)</h3>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50 flex justify-between items-center">
              <div>
                <p className="font-medium">3 Dress Shirts - Washing</p>
                <p className="text-sm text-gray-600">Starch: Medium, Crease: None</p>
              </div>
              <div className="flex space-x-2">
                <button className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm">Mark Washed</button>
                <button className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm">Report Issue</button>
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
              <div>
                <p className="font-medium">2 Pants - Pressing</p>
                <p className="text-sm text-gray-600">Starch: Light, Crease: Yes</p>
              </div>
              <button className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm">Mark Pressed</button>
            </div>
          </div>
        </div>
        
        {/* Tracking & Reporting */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-600" /> Completion Tracker</h3>
            <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
              Mark Items as Packaged
            </button>
            <button className="w-full mt-2 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
              Track Workload & Shift Completion
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-red-600" /> Issue Reporting</h3>
            <button className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium">
              Report Damaged / Missing Items
            </button>
            <p className="text-sm text-gray-500 mt-2">Requires photo evidence upload.</p>
          </div>
        </div>
      </div>
    </div>
  );
}