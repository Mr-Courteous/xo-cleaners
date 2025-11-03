import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 font-sans">
      <Header />
      <main className="max-w-6xl mx-auto p-8">
        <section className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-4xl font-extrabold mb-4 text-gray-900">About XoCleaners</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            XoCleaners is a modern laundry and dry-cleaning management platform built for
            small and medium businesses. We help you manage drop-offs, processing,
            racks, drivers, and customer communications in a single intuitive app.
          </p>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Our mission is to simplify operations so businesses can focus on delivering
            excellent service to customers. Built with real industry workflows in mind,
            XoCleaners brings efficiency and transparency to your team.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
            >
              Back to Home
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-5 py-3 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Contact Us
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Who we are</h3>
            <p className="text-sm text-gray-600">A small team focused on workflow improvements and real-world laundromat needs.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Our Values</h3>
            <ul className="text-sm text-gray-600 list-disc pl-5">
              <li>Reliability</li>
              <li>Usability</li>
              <li>Speed</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Get started</h3>
            <p className="text-sm text-gray-600">Sign up for a trial from the homepage or request a demo via contact.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
