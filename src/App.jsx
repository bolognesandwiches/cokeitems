import React, { useState } from 'react';
import { useCokeData } from './hooks/useCokeData';
import Header from './components/common/Header';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorDisplay from './components/common/ErrorDisplay';
import CatalogTab from './components/catalog/CatalogTab';
import AnalyticsTab from './components/analytics/AnalyticsTab';
import TradesTab from './components/trades/TradesTab';

const CokeStudiosCatalog = () => {
  const [activeTab, setActiveTab] = useState('trades');
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

  if (loading) {
    return <LoadingScreen />;
  }

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
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="container mx-auto px-4 py-4">
        <div className="fade-in">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default CokeStudiosCatalog;