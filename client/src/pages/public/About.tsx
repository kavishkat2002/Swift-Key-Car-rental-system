import React from 'react';
import { ShieldCheck, MapPin, Award, Users, Phone, CheckCircle2 } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <MapPin className="w-3.5 h-3.5 text-teal-700" />
          <span>Negombo, Western Province, Sri Lanka</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#102A43] tracking-tight">
          About SwiftDrive Rentals
        </h1>
        <p className="text-sm text-[#526477] max-w-2xl mx-auto leading-relaxed">
          Founded to offer international visitors and local commuters dependable, transparent, and road-tested self-drive car hire directly from Sri Lanka’s primary international gateway.
        </p>
      </div>

      {/* Main Narrative */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs space-y-6 text-sm text-[#526477] leading-relaxed">
        <h2 className="text-xl font-bold text-[#102A43]">
          Our Negombo Heritage & Strategic Airport Position
        </h2>
        <p>
          Situated at No. 45 Beach Road (close to Lewis Place), Negombo, SwiftDrive Rentals operates strategically at the intersection between Sri Lanka’s international arrivals hub—Bandaranaike International Airport (CMB)—and the picturesque western coastal tourism belt.
        </p>
        <p>
          For over eight years, our fleet operations have eliminated the traditional pain points of car rental in Sri Lanka: ambiguous damage claims, predatory currency conversion rates, and poorly maintained vehicles. Every vehicle in our catalogue undergoes a strict 40-point safety and mechanical check before any keys are handed over.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
          <div className="space-y-2">
            <h3 className="font-bold text-[#102A43] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Full Tourist Insurance</span>
            </h3>
            <p className="text-xs">
              Every hire is protected with comprehensive collision damage waiver and third-party liability valid throughout the island.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#102A43] flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-700" />
              <span>Verified Transparent Tariffs</span>
            </h3>
            <p className="text-xs">
              All daily and weekly tariffs are declared clearly in Sri Lankan Rupees (LKR) with refundable deposits held in escrow.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#102A43] flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <span>Dedicated Chauffeur Options</span>
            </h3>
            <p className="text-xs">
              Prefer to relax? Experienced English-speaking tourist drivers are available on request for round-island excursions.
            </p>
          </div>
        </div>
      </div>

      {/* Standards List */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 space-y-4">
        <h2 className="text-lg font-bold text-[#102A43]">
          Our 5 Fleet Guarantees
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Clean, sanitized interiors and fully functional dual air conditioning.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Spare wheel, jack, wheel-brace, and warning triangle inspected on every handover.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Punctual curbside terminal delivery at Bandaranaike International Airport (CMB).</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>24/7 breakdown recovery and immediate replacement vehicle dispatch.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Official Sri Lanka Driving Permit facilitation and guidance for foreign license holders.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
