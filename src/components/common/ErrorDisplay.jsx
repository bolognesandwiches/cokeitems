import React from 'react';
import { X } from 'lucide-react';

const ErrorDisplay = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
    <div className="text-center text-white fade-in">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 mx-auto max-w-md border border-red-400/30 shadow-2xl">
        <div className="bg-red-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 border border-red-400/40">
          <X className="w-10 h-10 text-red-300" />
        </div>
        <h2 className="text-2xl font-bold font-coke mb-4">Oops! Something went wrong</h2>
        <p className="text-red-200 font-coke mb-8">{error}</p>
        <button 
          onClick={onRetry}
          className="btn-animate px-8 py-3 bg-white text-red-700 rounded-xl font-bold font-coke shadow-lg hover:shadow-xl focus:shadow-glow transition-all duration-300 border-2 border-transparent hover:border-red-200 focus-ring"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

export default ErrorDisplay; 