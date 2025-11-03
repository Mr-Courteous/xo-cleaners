import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function Contact() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, we mock a send. In production you'd call your contact API.
    setSent(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setMessage('');
      setSent(false);
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 font-sans">
      <Header />
      <main className="max-w-3xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
        <p className="text-gray-700 mb-6">Have questions or want a demo? Send us a message and we'll respond shortly.</p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8 rounded-xl shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">Your Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-4 py-3 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-4 py-3 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="mt-1 block w-full px-4 py-3 border rounded-lg" required />
          </div>

          <div className="flex items-center space-x-3">
            <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Send Message</button>
            <button type="button" onClick={() => navigate('/')} className="px-6 py-3 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          </div>

          {sent && <p className="text-green-600">Message sent (mock). Redirecting to home...</p>}
        </form>
      </main>
    </div>
  );
}
