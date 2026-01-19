import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle, ArrowLeft } from 'lucide-react';
import { useColors } from '../state/ColorsContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { colors } = useColors();

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon Container */}
        <div className="mb-8 relative inline-block">
          <div 
            className="absolute inset-0 blur-2xl opacity-20 animate-pulse" 
            style={{ backgroundColor: colors.primaryColor }}
          />
          <div className="relative bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <AlertCircle size={80} style={{ color: colors.primaryColor }} strokeWidth={1.5} />
          </div>
        </div>

        {/* Error Text */}
        <h1 className="text-6xl font-black text-slate-900 mb-2 tracking-tighter">404</h1>
        <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] mb-8">
          Oops! This route doesn't exist.
        </p>

        <p className="text-slate-600 mb-10 font-medium px-4">
          It seems you've taken a wrong turn. The page you are looking for has been moved or doesn't exist in the system.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: colors.primaryColor }}
          >
            <Home size={18} /> Back to Dashboard
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full py-4 rounded-2xl bg-white text-slate-600 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 border-2 border-slate-200 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;