import React, { useState, useEffect } from 'react';
import { Vehicle } from '../../types';
import { api } from '../../services/api';
import { VehicleCard } from '../../components/VehicleCard';
import { Search, Filter, RotateCcw, Calendar, SlidersHorizontal, X } from 'lucide-react';

interface CatalogueProps {
  initialFilters?: {
    category?: string;
    pickupDate?: string;
    returnDate?: string;
    pickupLocation?: string;
  };
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBookVehicle: (vehicle: Vehicle) => void;
}

export const Catalogue: React.FC<CatalogueProps> = ({
  initialFilters,
  onSelectVehicle,
  onBookVehicle
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [category, setCategory] = useState(initialFilters?.category || 'all');
  const [transmission, setTransmission] = useState('all');
  const [fuelType, setFuelType] = useState('all');
  const [minSeats, setMinSeats] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('price_asc');
  const [pickupDate, setPickupDate] = useState(initialFilters?.pickupDate || '');
  const [returnDate, setReturnDate] = useState(initialFilters?.returnDate || '');

  // Mobile Filter Drawer Toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const fetchVehicles = () => {
    setLoading(true);
    setError(null);

    api.vehicles.getAll({
      category: category !== 'all' ? category : undefined,
      transmission: transmission !== 'all' ? transmission : undefined,
      fuelType: fuelType !== 'all' ? fuelType : undefined,
      minSeats: minSeats ? Number(minSeats) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search: search.trim() || undefined,
      sortBy,
      pickupDate: pickupDate || undefined,
      returnDate: returnDate || undefined
    })
      .then((res) => {
        setVehicles(res.vehicles);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load vehicle catalogue.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Live debounced search & filter refresh
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVehicles();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, category, transmission, fuelType, minSeats, maxPrice, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleResetFilters = () => {
    setCategory('all');
    setTransmission('all');
    setFuelType('all');
    setMinSeats('');
    setMaxPrice('');
    setSearch('');
    setSortBy('price_asc');
    setPickupDate('');
    setReturnDate('');
  };

  const categories = [
    { id: 'all', label: 'All Fleet' },
    { id: 'economy', label: 'Economy Cars' },
    { id: 'suv', label: 'SUVs & 4x4' },
    { id: 'van', label: 'Tourist Vans' },
    { id: 'luxury', label: 'Executive Luxury' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
            Vehicle Fleet Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-[#526477] mt-1">
            Browse reliable, roadworthy rental vehicles stationed at our Negombo headquarters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="md:hidden flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{showMobileFilters ? 'Hide Filters' : 'Show Filters & Dates'}</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
              category === cat.id
                ? 'bg-[#102A43] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <aside
          className={`space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-xs h-fit ${
            showMobileFilters ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#102A43]">
              <Filter className="w-4 h-4 text-teal-700" />
              <span>Search & Refine</span>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-teal-700 hover:text-teal-900 flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Keyword Search */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Search by Model or Make
              </label>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-[10px] text-teal-700 hover:text-teal-900 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Toyota, RAV4, Alto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchVehicles()}
                className="w-full pl-8 pr-8 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {category !== 'all' && search && (
              <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-md mt-1.5 flex items-center justify-between border border-amber-200">
                <span>In <strong>{categories.find(c => c.id === category)?.label}</strong></span>
                <button
                  type="button"
                  onClick={() => setCategory('all')}
                  className="underline font-bold text-amber-900 hover:text-amber-950 ml-2 whitespace-nowrap"
                >
                  Search all fleet
                </button>
              </div>
            )}
          </div>

          {/* Date-Based Availability Search */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-[#102A43] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span>Check Exact Dates</span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Pick-up Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Return Date
              </label>
              <input
                type="date"
                min={pickupDate}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
              />
            </div>

            <button
              type="button"
              onClick={fetchVehicles}
              className="w-full py-1.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-md transition-colors"
            >
              Verify Real Availability
            </button>
          </div>

          {/* Transmission Filter */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transmission
            </label>
            <select
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
            >
              <option value="all">Any Transmission</option>
              <option value="automatic">Automatic Transmission</option>
              <option value="manual">Manual Gearbox</option>
            </select>
          </div>

          {/* Fuel Type */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fuel Engine Type
            </label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
            >
              <option value="all">Any Fuel Type</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
            </select>
          </div>

          {/* Minimum Seats */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Minimum Seating Capacity
            </label>
            <select
              value={minSeats}
              onChange={(e) => setMinSeats(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
            >
              <option value="">Any Capacity</option>
              <option value="4">4+ Seats (Couples & City)</option>
              <option value="5">5+ Seats (Families)</option>
              <option value="7">7+ Seats (Full-size 4x4)</option>
              <option value="10">10+ Seats (Touring Vans)</option>
            </select>
          </div>

          {/* Max Price Slider */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Max Daily Rate
              </label>
              <span className="text-xs font-bold text-teal-800">
                {maxPrice ? `LKR ${Number(maxPrice).toLocaleString()}` : 'No limit'}
              </span>
            </div>
            <input
              type="range"
              min="5000"
              max="50000"
              step="2500"
              value={maxPrice || 50000}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-teal-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>LKR 5,000</span>
              <span>LKR 50,000</span>
            </div>
          </div>
        </aside>

        {/* Right Vehicles Results Grid */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top Bar with Count & Sort */}
          <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-600">
              Showing <span className="font-bold text-[#102A43]">{vehicles.length}</span> fleet vehicles stationed in Negombo
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 whitespace-nowrap">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs font-medium text-slate-700"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="year_desc">Latest Year Model</option>
              </select>
            </div>
          </div>

          {/* Content States */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-xl border border-slate-200 h-96 p-4 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center text-rose-800">
              <p className="text-sm font-semibold">{error}</p>
              <button
                type="button"
                onClick={fetchVehicles}
                className="mt-3 px-4 py-2 bg-rose-700 text-white rounded-md text-xs font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#102A43]">
                {search
                  ? `No vehicles found matching "${search}"`
                  : 'No vehicles matched your search filters'}
              </h3>
              <p className="text-xs text-[#526477] max-w-sm mx-auto">
                {category !== 'all' && search ? (
                  <span>
                    No matching vehicles in <strong>{categories.find(c => c.id === category)?.label}</strong>. Try searching across the entire fleet or clearing your search term.
                  </span>
                ) : (
                  'Try widening your price range, clearing specific filters, or checking different rental dates.'
                )}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {search && category !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setCategory('all')}
                    className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    Search All Fleet
                  </button>
                )}
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-md transition-colors"
                  >
                    Clear Search "{search}"
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-1.5 bg-[#102A43] hover:bg-[#0b1d2e] text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  onSelect={onSelectVehicle}
                  onBookNow={onBookVehicle}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
