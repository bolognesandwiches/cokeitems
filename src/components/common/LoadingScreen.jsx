import React from 'react';
import { Music } from 'lucide-react';

const LoadingScreen = ({ isTransitioning = false }) => (
  <div className={`loading-splash ${isTransitioning ? 'loading-splash-minimize' : ''}`}>
    {/* Top white section - 50% */}
    <div className="loading-top-section">
      <div className="loading-wave-effect"></div>
    </div>
    
    {/* Bottom red gradient section - 50% */}
    <div className="loading-bottom-section"></div>
    
    {/* Individual positioned elements for precise animation */}
    <div className="bg-red-600 p-6 rounded-full shadow-2xl animate-logo-entrance loading-logo">
      <Music className="w-16 h-16 text-white" />
    </div>
    <h1 className="font-bold font-coke text-6xl text-red-700 animate-text-slide-in loading-title">
      Decibel.fun
    </h1>
  </div>
);

export default LoadingScreen;