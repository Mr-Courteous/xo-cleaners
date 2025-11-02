import React from 'react';
import { Package, User, CreditCard, Calendar, Star, Send, PauseCircle } from 'lucide-react';

export default function EndUserPortal() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">My XoCleaners Portal</h2>
        <p className="text-gray-600">Manage your orders, profile, payments, and scheduling.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Tracking & History */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><Package className="h-5 w-5 mr-2 text-blue-600" /> Order Tracking & History</h3>
          <div className="space-y-3">
            <div className="p-4 border rounded-lg bg-blue-50">
              <p className="font-bold text-blue-800">Order #78901 - Processing</p>
              <p className="text-sm text-gray-600">Ready: Mon, Oct 27 @ 5:00 PM</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
              <div>
                <p className="font-medium">Order #78850 - Delivered</p>
                <p className="text-sm text-gray-600">Delivered on 2025-10-20</p>
              </div>
              <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                <Star className="h-4 w-4 mr-1" /> Rate Order
              </button>
            </div>
          </div>
          <button className="w-full mt-4 text-center text-blue-600 font-medium hover:underline">View All Tickets</button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><Calendar className="h-5 w-5 mr-2 text-green-600" /> Pickup Schedule</h3>
          <div className="space-y-3">
            <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
              Book New Pickup / Cancel
            </button>
            <button className="w-full bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              Set Auto-Pickup Schedule
            </button>
          </div>
        </div>

        {/* Profile & Loyalty */}
        <div className="lg:col-span-3 grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><User className="h-5 w-5 mr-2 text-purple-600" /> Profile Management</h3>
            <ul className="text-sm space-y-2">
              <li className="flex items-center"><User className="h-4 w-4 mr-2 text-purple-500" /> CRUD Profile Details (Exc. Birthday)</li>
              <li className="flex items-center"><CreditCard className="h-4 w-4 mr-2 text-purple-500" /> Manage Payment Methods</li>
              <li className="flex items-center"><PauseCircle className="h-4 w-4 mr-2 text-purple-500" /> Pause Account Temporarily</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><Star className="h-5 w-5 mr-2 text-yellow-500" /> Loyalty & Rewards</h3>
            <p className="text-sm text-gray-500">Current Points: **1,250**</p>
            <button className="w-full mt-3 bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-medium">
              View Coupons & Referral Credits
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><Send className="h-5 w-5 mr-2 text-indigo-600" /> Refer & Share</h3>
            <p className="text-sm text-gray-500">Referral Code: **CLEANUP**</p>
            <button className="w-full mt-3 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Share Referral Code
            </button>
            <button className="w-full mt-2 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
              Manage Marketing Opt-ins
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}