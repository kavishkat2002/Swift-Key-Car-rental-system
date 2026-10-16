import React from 'react';
import { Vehicle } from '../types';
import { Badge } from './Badge';
import { Users, Gauge, Fuel, ShieldCheck, ArrowRight } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect: (vehicle: Vehicle) => void;
  onBookNow?: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onSelect,
  onBookNow
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Vehicle Image Container */}
      <div className="relative aspect-16/10 bg-slate-100 overflow-hidden group">
        <img
          src={vehicle.main_image_url}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge status={vehicle.category} />
          {vehicle.status !== 'available' && (
            <Badge status={vehicle.status} />
          )}
        </div>

        {/* Date conflict alert pill if filtered by dates */}
        {vehicle.isAvailableForDates === false && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center p-4 text-center">
            <span className="bg-rose-50 text-rose-800 text-xs font-semibold px-3 py-1.5 rounded-md border border-rose-200 shadow-sm">
              Reserved for requested dates
            </span>
          </div>
        )}
      </div>

      {/* Body Information */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-[#102A43] leading-snug">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-xs text-[#526477] font-medium">
                {vehicle.year} Model • Reg: {vehicle.registration_number}
              </p>
            </div>
          </div>

          {/* Key Specs Icons */}
          <div className="grid grid-cols-3 gap-2 py-3 my-3 border-y border-slate-100 text-xs text-[#526477]">
            <div className="flex items-center gap-1.5" title="Transmission">
              <Gauge className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="capitalize">{vehicle.transmission}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Seating Capacity">
              <Users className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{vehicle.seating_capacity} Seats</span>
            </div>
            <div className="flex items-center gap-1.5" title="Fuel Type">
              <Fuel className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="capitalize">{vehicle.fuel_type}</span>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xl font-bold text-[#102A43]">
                LKR {vehicle.daily_rate_lkr.toLocaleString()}
                <span className="text-xs font-normal text-[#526477]"> / day</span>
              </div>
              <div className="text-[11px] text-[#526477]">
                Weekly rate: LKR {vehicle.weekly_rate_lkr.toLocaleString()}
              </div>
            </div>

            <div className="text-right text-[11px] text-[#526477]">
              <span>Deposit: </span>
              <span className="font-semibold text-slate-700">
                LKR {vehicle.deposit_lkr.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={() => onSelect(vehicle)}
            className="w-full py-2 px-3 text-xs font-semibold text-[#102A43] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
          >
            Details & Specs
          </button>

          <button
            type="button"
            onClick={() => onBookNow ? onBookNow(vehicle) : onSelect(vehicle)}
            disabled={vehicle.status !== 'available' || vehicle.isAvailableForDates === false}
            className={`w-full py-2 px-3 text-xs font-semibold text-white rounded-md flex items-center justify-center gap-1 transition-colors ${
              vehicle.status === 'available' && vehicle.isAvailableForDates !== false
                ? 'bg-[#0F766E] hover:bg-[#0D655E] cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed text-slate-500'
            }`}
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
