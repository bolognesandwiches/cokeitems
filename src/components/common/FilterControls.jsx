import React from 'react';
import { Search, SortAsc, SortDesc, Filter, DollarSign, Calendar } from 'lucide-react';

const FilterControls = ({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  showFilters,
  setShowFilters,
  hasActiveFilters,
  clearAllFilters,
  priceRange,
  setPriceRange,
  dateRange,
  setDateRange,
  selectedCategories,
  setSelectedCategories,
  getUniqueCategories,
  showUnownedItems,
  setShowUnownedItems
}) => {
  const activeFilterCount = [
    searchTerm && 1,
    !selectedCategories.includes('all') && selectedCategories.length,
    (priceRange.min || priceRange.max) && 1,
    (dateRange.start || dateRange.end) && 1,
    showUnownedItems && 1
  ].filter(Boolean).reduce((a, b) => a + b, 0);

  return (
    <div className="fade-in">
      <div className="flex flex-col gap-3">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5 search-icon-hover" />
              <input
                type="text"
                placeholder="Search items, categories, descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white placeholder-white/70 focus:outline-none focus:border-white/60 focus:bg-white/25 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow input-focus-glow"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="flex gap-1">
            <div className="relative group">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white focus:outline-none focus:border-white/60 focus:bg-white/25 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow cursor-pointer"
              >
                <option value="name" className="bg-red-700 text-white">Name</option>
                <option value="category" className="bg-red-700 text-white">Category</option>
                <option value="price" className="bg-red-700 text-white">Price</option>
                <option value="date" className="bg-red-700 text-white">Date</option>
                <option value="possessions" className="bg-red-700 text-white">Possessions</option>
              </select>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white hover:bg-white/25 focus:outline-none focus:border-white/60 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow button-press"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-5 h-5 icon-hover" /> : <SortDesc className="w-5 h-5 icon-hover" />}
            </button>
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl border-2 backdrop-blur-lg font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow flex items-center gap-2 button-press ${
              showFilters || hasActiveFilters()
                ? 'border-red-400 bg-red-500/30 text-white'
                : 'border-white/30 bg-white/20 text-white hover:bg-white/25 focus:border-white/60'
            }`}
          >
            <Filter className="w-5 h-5 icon-hover" />
            Filters
            {hasActiveFilters() && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full filter-count-pop badge-hover">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 animate-slide-in-down">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category Filter */}
              <div>
                <label className="block text-white font-coke font-semibold mb-1">Categories</label>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {getUniqueCategories().map(category => (
                    <label key={category} className="flex items-center gap-2 text-white/90 hover:text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={e => {
                          const newCategories = e.target.checked
                            ? (category === 'all' ? ['all'] : [...selectedCategories.filter(c => c !== 'all'), category])
                            : selectedCategories.filter(c => c !== category);
                          setSelectedCategories(newCategories.length === 0 ? ['all'] : newCategories);
                        }}
                        className="rounded border-white/30 bg-white/20"
                      />
                      <span className="font-coke text-sm">{category === 'all' ? 'All Categories' : category.replace(/"/g, '')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-white font-coke font-semibold mb-1">Price Range (dB)</label>
                <div className="space-y-1">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                    <input
                      type="number"
                      placeholder="Min price"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/70 focus:outline-none focus:border-white/60 font-coke text-sm"
                    />
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                    <input
                      type="number"
                      placeholder="Max price"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/70 focus:outline-none focus:border-white/60 font-coke text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-white font-coke font-semibold mb-1">Purchase Date</label>
                <div className="space-y-1">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/30 bg-white/20 text-white focus:outline-none focus:border-white/60 font-coke text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/30 bg-white/20 text-white focus:outline-none focus:border-white/60 font-coke text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Show Unowned Items Checkbox */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 text-white/90 hover:text-white cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={showUnownedItems}
                    onChange={e => setShowUnownedItems(e.target.checked)}
                    className="rounded border-white/30 bg-white/20"
                  />
                  <span className="font-coke text-sm">Show unowned items</span>
                </label>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearAllFilters}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-coke font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterControls; 