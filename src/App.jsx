import React, { useState, useEffect } from 'react';
import { useCokeData } from './hooks/useCokeData';
import UnifiedHeader from './components/common/UnifiedHeader';
import ErrorDisplay from './components/common/ErrorDisplay';
import CatalogTab from './components/catalog/CatalogTab';
import AnalyticsTab from './components/analytics/AnalyticsTab';
import TradesTab from './components/trades/TradesTab';

const CokeStudiosCatalog = () => {
  const [activeTab, setActiveTab] = useState('trades');
  const [appReady, setAppReady] = useState(false);
  const {
    catalogData,
    possessionData,
    trades,
    loading,
    error,
    tradesLoading,
    tradesError,
    valuations,
    fetchData,
    getItemPossessions,
    getItemPrice,
    getItemPurchaseDate,
    getItemDetailsByPossessionId,
    isTradeValid
  } = useCokeData();

  // Handle the transition from splash to app
  useEffect(() => {
    if (!loading && !error) {
      // Start a timer to allow users to see the splash screen
      const splashTimer = setTimeout(() => {
        setAppReady(true);
      }, 2000); // 2.0 second delay for aesthetic purposes
      
      return () => clearTimeout(splashTimer);
    }
  }, [loading, error]);

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'catalog':
        return (
          <CatalogTab
            catalogData={catalogData}
            possessionData={possessionData}
            valuations={valuations}
            getItemPossessions={getItemPossessions}
            getItemPrice={getItemPrice}
            getItemPurchaseDate={getItemPurchaseDate}
          />
        );
      case 'analytics':
        return (
          <AnalyticsTab
            catalogData={catalogData}
            possessionData={possessionData}
          />
        );
      case 'trades':
        return (
          <TradesTab
            trades={trades}
            tradesLoading={tradesLoading}
            tradesError={tradesError}
            catalogData={catalogData}
            possessionData={possessionData}
            valuations={valuations}
            getItemDetailsByPossessionId={getItemDetailsByPossessionId}
            isTradeValid={isTradeValid}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: '#b91c1c'}}>
      {/* The unified header that morphs from splash to header */}
      <UnifiedHeader 
        isTransitioning={appReady}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      {/* Main content - only shows after app is ready */}
      {appReady && (
        <div className="main-content">
          <div className="container mx-auto px-4 py-4">
            <div className="fade-in">
              {renderTabContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CokeStudiosCatalog;