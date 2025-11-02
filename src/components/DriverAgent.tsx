import React from 'react';
import { Truck, MapPin, CheckCircle, ListTodo, Camera } from 'lucide-react';

export default function DriverAgent() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Driver / Delivery Agent App</h2>
        <p className="text-gray-600">Manage your assigned routes, update order statuses, and access navigation.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Route Management */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><Truck className="h-5 w-5 mr-2 text-blue-600" /> My Assigned Route</h3>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50 flex justify-between items-center">
              <div>
                <p className="font-bold text-blue-800">Stop 1: John Smith (Pickup)</p>
                <p className="text-sm text-gray-600">123 Main St, Houston, TX</p>
              </div>
              <button className="bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-1" /> Navigate
              </button>
            </div>
            <div className="p-4 border rounded-lg bg-green-50 flex justify-between items-center">
              <div>
                <p className="font-bold text-green-800">Stop 2: Jane Doe (Delivery)</p>
                <p className="text-sm text-gray-600">456 Oak Ave, Houston, TX</p>
              </div>
              <button className="bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-1" /> Navigate
              </button>
            </div>
          </div>
          <button className="w-full mt-4 text-center text-blue-600 font-medium hover:underline flex items-center justify-center">
            <ListTodo className="h-4 w-4 mr-1" /> View Full Route Manifest
          </button>
        </div>

        {/* Status Updates & Proof of Delivery */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-600" /> Order Status Update</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-medium">
              Mark as Picked Up
            </button>
            <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
              Mark as Delivered
            </button>
            <button className="w-full bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center">
              <Camera className="h-4 w-4 mr-2" /> Capture Photo/Signature
            </button>
            <button className="w-full bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              Log Delivery Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}