import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
    <div className="text-center text-white fade-in">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 mx-auto max-w-md border border-white/20 shadow-2xl">
        <div className="pulse-glow rounded-full w-20 h-20 bg-white/10 flex items-center justify-center mx-auto mb-8">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold font-coke mb-4">Loading CokeMusic Catalog</h2>
        <p className="text-white/80 font-coke">Fetching your items and possessions...</p>
        <div className="flex justify-center mt-6">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LoadingScreen; 