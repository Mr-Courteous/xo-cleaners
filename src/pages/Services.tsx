import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Truck, List, BarChart2, MessageSquare } from 'lucide-react';

export default function Services() {
  const navigate = useNavigate();
  const services = [
    { icon: List, title: 'Ticket Management', desc: 'Manage drop-offs, processing, and pickups with ease.' },
    { icon: Truck, title: 'Driver Integration', desc: 'Assign drivers, manage routes, and track deliveries.' },
    { icon: BarChart2, title: 'Reporting', desc: 'Get insights on throughput, revenue and staff performance.' },
    { icon: MessageSquare, title: 'Customer Communications', desc: 'Automated receipts, notifications and SMS support.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 font-sans">
      <Header />
      <main className="max-w-6xl mx-auto p-8">
        <header className="mb-8">
          <h2 className="text-4xl font-extrabold">Our Services</h2>
          <p className="text-gray-600 mt-2">Tools and integrations built to run your business smoothly.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {services.map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-md">
                <s.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold mb-3">Want to see it in action?</h3>
          <div className="flex gap-3">
            <button onClick={() => navigate('/contact')} className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">Get a Demo</button>
            <button onClick={() => navigate('/')} className="px-5 py-3 bg-gray-100 rounded-lg">Back to Home</button>
          </div>
        </section>
      </main>
    </div>
  );
}
