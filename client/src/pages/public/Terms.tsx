import React from 'react';
import { ShieldAlert, CheckCircle2, FileText, AlertCircle } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-[#102A43] tracking-tight">
          Rental Terms & Conditions
        </h1>
        <p className="text-xs sm:text-sm text-[#526477] mt-1">
          Standard operational agreement and driving policies for SwiftDrive Rentals (Negombo, Sri Lanka).
        </p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm text-[#526477] leading-relaxed">
        {/* Section 1 */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <h2 className="text-base font-bold text-[#102A43]">
            1. Driver Eligibility & Documentation
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>The primary renter and any designated secondary driver must be at least 21 years of age.</li>
            <li>Foreign passport holders must present a valid national driving license accompanied by an <strong>International Driving Permit (IDP)</strong> or a Temporary Sri Lankan Driving Permit endorsed by the Department of Motor Traffic (DMT).</li>
            <li>Sri Lankan residents must present a valid national driving license and National Identity Card (NIC).</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <h2 className="text-base font-bold text-[#102A43]">
            2. Security Deposit & Transparent Refund Process
          </h2>
          <p>
            A refundable security deposit in Sri Lankan Rupees (LKR) is required prior to vehicle handover:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
              <span className="block text-slate-500">Economy:</span>
              <span className="font-bold text-[#102A43]">LKR 25,000 – 35,000</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
              <span className="block text-slate-500">SUVs:</span>
              <span className="font-bold text-[#102A43]">LKR 50,000 – 100,000</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
              <span className="block text-slate-500">Vans:</span>
              <span className="font-bold text-[#102A43]">LKR 60,000 – 80,000</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
              <span className="block text-slate-500">Luxury:</span>
              <span className="font-bold text-[#102A43]">LKR 150,000</span>
            </div>
          </div>
          <p>
            The deposit is refunded in full immediately upon vehicle return inspection, provided the vehicle is returned in the same condition with fuel matched and without traffic infringements.
          </p>
        </section>

        {/* Section 3 */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <h2 className="text-base font-bold text-[#102A43]">
            3. Fuel & Mileage Policy
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Fuel:</strong> Returned on a "Same-to-Same" or "Full-to-Full" basis as logged on the Pick-up Condition Report.</li>
            <li><strong>Mileage:</strong> Standard daily hires include 100 km per rental day. Additional mileage is charged at nominal rates (LKR 65 – 120/km depending on vehicle category). Unlimited mileage is available on 7+ day bookings.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <h2 className="text-base font-bold text-[#102A43]">
            4. Cancellation and Modification Policy
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Free Cancellation:</strong> Cancellations made at least 48 hours prior to the scheduled pickup time receive a 100% full refund.</li>
            <li><strong>Late Cancellations:</strong> Cancellations made within 48 hours of pickup incur a 1-day rental charge; the balance is refunded in full.</li>
            <li>Early return refunds are assessed on revised daily tariffs.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <h2 className="text-base font-bold text-[#102A43]">
            5. Geographic Boundaries & Prohibited Uses
          </h2>
          <ul className="space-y-2 list-disc list-inside text-rose-900">
            <li>Driving on unpaved beach sands, river crossings, or extreme off-road trails in non-4x4 vehicles is strictly prohibited.</li>
            <li>Subletting, unauthorized secondary drivers, driving under influence, or transporting commercial freight is void of all insurance coverage.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
