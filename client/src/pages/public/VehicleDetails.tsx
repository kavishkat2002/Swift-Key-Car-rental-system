import React, { useState, useEffect } from 'react';
import { Vehicle, PricingQuote } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import {
  Users, Gauge, Fuel, Shield, Calendar, ArrowLeft,
  CheckCircle2, AlertCircle, Info, ChevronRight, FileText
} from 'lucide-react';

interface VehicleDetailsProps {
  vehicleId: number;
  onBack: () => void;
  onBookNow: (vehicle: Vehicle, pickupDate?: string, returnDate?: string) => void;
}

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicleId,
  onBack,
  onBookNow
}) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quote Calculator states
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const defaultReturn = new Date();
  defaultReturn.setDate(defaultReturn.getDate() + 5);
  const defaultReturnStr = defaultReturn.toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState(tomorrowStr);
  const [returnDate, setReturnDate] = useState(defaultReturnStr);
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [availability, setAvailability] = useState<{ available: boolean; conflictReason?: string } | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.vehicles.getById(vehicleId)
      .then((res) => {
        if (!isMounted) return;
        setVehicle(res.vehicle);
        setActiveImage(res.vehicle.main_image_url);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load vehicle details.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [vehicleId]);

  // Recalculate quote whenever dates change
  useEffect(() => {
    if (!vehicle) return;

    if (returnDate <= pickupDate) {
      setQuote(null);
      setAvailability(null);
      setQuoteError('Return date must be strictly after pickup date.');
      return;
    }

    let isMounted = true;
    setIsQuoting(true);
    setQuoteError(null);

    api.bookings.getQuote(vehicle.id, pickupDate, returnDate)
      .then((res) => {
        if (!isMounted) return;
        setQuote(res.quote);
        setAvailability(res.availability);
        if (!res.availability.available) {
          setQuoteError(res.availability.conflictReason || 'Vehicle is unavailable for selected dates.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setQuote(null);
        setAvailability(null);
        setQuoteError(err.message || 'Error calculating quote.');
      })
      .finally(() => {
        if (isMounted) setIsQuoting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [vehicle, pickupDate, returnDate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-500">
        <div className="animate-pulse">Loading vehicle specifications...</div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-rose-700 font-semibold mb-4">{error || 'Vehicle not found.'}</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-[#102A43] text-white text-xs font-semibold rounded-md"
        >
          Return to Catalogue
        </button>
      </div>
    );
  }

  // Combine main image and additional gallery images
  const allImages = [
    { id: 0, image_url: vehicle.main_image_url, caption: 'Main Profile' },
    ...(vehicle.images || [])
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#526477]">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-[#102A43] flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Fleet Catalogue</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="capitalize">{vehicle.category}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[#102A43] font-bold">{vehicle.make} {vehicle.model}</span>
      </div>

      {/* Main Grid: Gallery & Specs vs Live Booking Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery & In-depth Specs (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Main Photo Gallery */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="relative aspect-16/10 bg-slate-100">
              <img
                src={activeImage}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge status={vehicle.category} size="md" />
                <Badge status={vehicle.status} size="md" />
              </div>
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 overflow-x-auto">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img.image_url)}
                    className={`w-20 h-14 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                      activeImage === img.image_url
                        ? 'border-teal-600 scale-102'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={img.caption || 'Thumbnail'}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description & Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#102A43]">
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </h1>
                <p className="text-xs text-[#526477] font-medium">
                  Official Registration: {vehicle.registration_number} • Current Mileage: {vehicle.mileage_km.toLocaleString()} km
                </p>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold text-[#102A43]">
                  LKR {vehicle.daily_rate_lkr.toLocaleString()}
                  <span className="text-xs font-normal text-[#526477]"> / day</span>
                </div>
                <div className="text-xs text-teal-800 font-semibold">
                  Weekly tariff: LKR {vehicle.weekly_rate_lkr.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-[#526477] leading-relaxed">
              {vehicle.description}
            </div>

            {/* Features & Equipment List */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-[#102A43] uppercase tracking-wider mb-3">
                Included Features & Equipment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {vehicle.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Technical Specifications Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#102A43] uppercase tracking-wider">
              Technical Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Transmission</span>
                <span className="font-bold text-[#102A43] capitalize">{vehicle.transmission}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Fuel Type</span>
                <span className="font-bold text-[#102A43] capitalize">{vehicle.fuel_type}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Seating</span>
                <span className="font-bold text-[#102A43]">{vehicle.seating_capacity} Passengers</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Security Deposit</span>
                <span className="font-bold text-[#102A43]">LKR {vehicle.deposit_lkr.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer Reviews for this Vehicle */}
          {vehicle.reviews && vehicle.reviews.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-bold text-[#102A43] uppercase tracking-wider">
                Driver Reviews ({vehicle.reviews.length})
              </h3>
              <div className="space-y-3">
                {vehicle.reviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 bg-slate-50 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#102A43]">{rev.author_name}</span>
                      <span className="text-amber-500">{'★'.repeat(rev.rating)}</span>
                    </div>
                    <p className="text-[#526477] italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Instant Cost Calculator & Booking Box (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[#102A43]">
                Rental Cost Calculator & Booking
              </h2>
              <p className="text-xs text-[#526477]">
                Live price verification from Negombo booking engine
              </p>
            </div>

            {/* Date Pickers */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pick-up Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Return Date
                </label>
                <input
                  type="date"
                  min={pickupDate}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Pricing Breakdown */}
            {quoteError ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{quoteError}</span>
              </div>
            ) : quote ? (
              <div className="p-4 bg-teal-50/50 border border-teal-200/60 rounded-lg space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Rental Period:</span>
                  <span>{quote.totalDays} Days</span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Daily Rate Applied:</span>
                  <span>LKR {quote.dailyRateApplied.toLocaleString()}/day</span>
                </div>

                {quote.weeklyDiscountApplied && (
                  <div className="flex justify-between text-teal-800 font-semibold bg-teal-100/60 px-2 py-1 rounded">
                    <span>Weekly Discount Savings:</span>
                    <span>- LKR {quote.savingsLkr.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 pt-1 border-t border-teal-100">
                  <span>Rental Subtotal:</span>
                  <span className="font-semibold text-slate-800">LKR {quote.rentalCostLkr.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Refundable Security Deposit:</span>
                  <span className="font-semibold text-slate-800">LKR {quote.depositAmountLkr.toLocaleString()}</span>
                </div>

                <div className="pt-2 border-t border-teal-200 flex justify-between items-baseline text-sm font-bold text-[#102A43]">
                  <span>Total Payable:</span>
                  <span className="text-lg text-teal-800">LKR {quote.totalAmountLkr.toLocaleString()}</span>
                </div>
              </div>
            ) : isQuoting ? (
              <div className="text-center py-4 text-xs text-slate-500">
                Querying Negombo rates...
              </div>
            ) : null}

            {/* Terms Summary */}
            <div className="space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span>Comprehensive tourist self-drive insurance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span>Immediate deposit refund upon return check</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span>Free cancellation up to 48 hours prior to pickup</span>
              </div>
            </div>

            {/* Primary Booking CTA */}
            <button
              type="button"
              disabled={Boolean(quoteError) || Boolean(availability && !availability.available)}
              onClick={() => onBookNow(vehicle, pickupDate, returnDate)}
              className="w-full py-3 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold rounded-lg transition-colors shadow-xs disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Book This Vehicle Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
