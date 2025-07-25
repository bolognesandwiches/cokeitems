import React from 'react';
import { Package, BarChart3, DollarSign } from 'lucide-react';

const UnifiedHeader = ({ isTransitioning = false, activeTab, setActiveTab }) => {
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
    <div className={`unified-header ${isTransitioning ? 'unified-header-minimized' : 'unified-header-splash'}`}>
      {/* Splash Background Elements - only visible in splash state */}
      <div className="splash-background">
        <div className="splash-top-section">
          <div className="splash-wave-effect"></div>
        </div>
        <div className="splash-bottom-section"></div>
      </div>

      {/* Header Background - only visible in header state */}
      <div className="header-background">
        <div className="header-content">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between py-3">
              {/* This div will be invisible but maintains layout */}
              <div className="flex items-center gap-3">
                <div className="logo-placeholder"></div>
                <div className="title-placeholder"></div>
              </div>
              <div className="tabs-placeholder"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Splash Logo and Title Container - keeps them together with consistent spacing */}
      <div className="splash-branding-container">
        <div className="splash-logo-wrapper">
          <div className="logo-icon">
            <img 
              src="/ui/newlogo.png" 
              alt="Decibel Logo" 
              className="logo-new-image"
            />
          </div>
        </div>
        <div className="splash-title-wrapper">
          <h1 className="title-text">Decibel.fun</h1>
        </div>
      </div>

      {/* Header Logo - appears fresh, starts as thumb, switches to new logo */}
      <div className="header-logo">
        <div className="header-logo-container">
          {/* Thumb image - shows during initial header appearance */}
          <img 
            src="/ui/thumb.png" 
            alt="Decibel Logo" 
            className={`header-thumb-image ${isTransitioning ? 'header-thumb-settled' : ''}`}
          />
          {/* New logo - shows after settling */}
          <img 
            src="/ui/newlogo.png" 
            alt="Decibel Logo" 
            className={`header-new-logo ${isTransitioning ? 'header-logo-settled' : ''}`}
          />
        </div>
      </div>

      {/* Header Title - appears fresh in header */}
      <div className="header-title">
        <h1 className="font-bold font-coke text-xl hidden sm:block" style={{color: '#FF1B0F'}}>
          Decibel.fun
        </h1>
      </div>

      {/* Navigation Tabs - slide in from right */}
      <div className="morphing-tabs">
        <div className="tabs-container">
          <button
            onClick={() => handleTabClick('catalog')}
            className={`tab-button ${activeTab === 'catalog' ? 'tab-active' : 'tab-inactive'}`}
          >
            <Package className="tab-icon" />
            Catalog
          </button>
          <button
            onClick={() => handleTabClick('analytics')}
            className={`tab-button ${activeTab === 'analytics' ? 'tab-active' : 'tab-inactive'}`}
          >
            <BarChart3 className="tab-icon" />
            Analytics
          </button>
          <button
            onClick={() => handleTabClick('trades')}
            className={`tab-button ${activeTab === 'trades' ? 'tab-active' : 'tab-inactive'}`}
          >
            <DollarSign className="tab-icon" />
            Trades
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedHeader; 