import React from 'react';
import { Music, Package, BarChart3, DollarSign } from 'lucide-react';

const Header = ({ activeTab, setActiveTab }) => {
  // Function to smoothly scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Enhanced click handler that sets active tab and scrolls to top
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    scrollToTop();
  };

  return (
  <div className="sticky top-0 z-50 bg-white shadow-2xl backdrop-blur-xl coke-wave">
    <div className="container mx-auto px-6">
      <div className="flex items-center justify-between py-3">
        {/* Logo and Title */}
        <div className="flex items-center gap-3 transform scale-90">
          <div className="bg-red-600 p-2 rounded-full shadow-lg animate-logo-entrance">
            <Music className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold font-coke text-xl text-red-700 hidden sm:block animate-text-slide-in">
            Decibel.fun
          </h1>
        </div>
        
        {/* Enhanced Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => handleTabClick('catalog')}
            className={`font-semibold font-coke transition-all duration-300 shadow-lg backdrop-blur-sm transform hover:scale-105 active:scale-95 px-4 py-2 rounded-lg text-sm ${
              activeTab === 'catalog'
                ? 'bg-red-600 text-white shadow-xl border-2 border-red-500'
                : 'bg-white/80 text-red-700 border-2 border-red-200 hover:bg-red-50 hover:border-red-300'
            }`}
          >
            <Package className="inline w-4 h-4 mr-1" />
            Catalog
          </button>
          <button
            onClick={() => handleTabClick('analytics')}
            className={`font-semibold font-coke transition-all duration-300 shadow-lg backdrop-blur-sm transform hover:scale-105 active:scale-95 px-4 py-2 rounded-lg text-sm ${
              activeTab === 'analytics'
                ? 'bg-red-600 text-white shadow-xl border-2 border-red-500'
                : 'bg-white/80 text-red-700 border-2 border-red-200 hover:bg-red-50 hover:border-red-300'
            }`}
          >
            <BarChart3 className="inline w-4 h-4 mr-1" />
            Analytics
          </button>
          <button
            onClick={() => handleTabClick('trades')}
            className={`font-semibold font-coke transition-all duration-300 shadow-lg backdrop-blur-sm transform hover:scale-105 active:scale-95 px-4 py-2 rounded-lg text-sm ${
              activeTab === 'trades'
                ? 'bg-red-600 text-white shadow-xl border-2 border-red-500'
                : 'bg-white/80 text-red-700 border-2 border-red-200 hover:bg-red-50 hover:border-red-300'
            }`}
          >
            <DollarSign className="inline w-4 h-4 mr-1" />
            Trades
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Header;