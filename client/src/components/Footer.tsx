import React from 'react';
import { Car, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#102A43] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Company Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center text-white">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                SwiftDrive Rentals
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Premium self-drive and chauffeur vehicle rentals headquartered in Negombo, Sri Lanka.
              Reliable airport curbside handovers at Bandaranaike International Airport (CMB) and transparent tariffs.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Registered Sri Lanka Tourist Fleet Operator</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Explore Services
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('catalogue')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Vehicle Fleet Catalogue
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-teal-400 transition-colors"
                >
                  About SwiftDrive Rentals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('blog')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Sri Lanka Road-Trip Guides
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Rental Terms & Insurance Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Inquiries & Airport Desk
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Vehicle Categories */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Vehicle Classes
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>Economy Hatchbacks & Sedans (from LKR 6,500/day)</li>
              <li>All-Wheel Drive SUVs (from LKR 16,500/day)</li>
              <li>Tourist 10-14 Seater Vans (from LKR 22,000/day)</li>
              <li>Executive Luxury Sedans (from LKR 45,000/day)</li>
              <li>Airport Dropoff & Pickup Services (24/7)</li>
            </ul>
          </div>

          {/* Column 4: Contact & Location */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Negombo Operations Desk
            </h3>
            <div className="flex items-start gap-3 text-sm text-slate-400">
              <MapPin className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <span>No. 45, Beach Road (near Lewis Place), Negombo, Western Province, Sri Lanka</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Phone className="w-4 h-4 text-teal-400 shrink-0" />
              <span>+94 31 222 3456 / +94 77 123 4567</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Mail className="w-4 h-4 text-teal-400 shrink-0" />
              <span>reservations@swiftdrive.lk</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Clock className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Office: 07:00 – 21:00 | Airport Desk: 24/7</span>
            </div>
          </div>
        </div>

        {/* Academic Note and Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} SwiftDrive Rentals (Pvt) Ltd. All rights reserved.
          </div>
          <div className="text-slate-400 text-center md:text-right">
            <span>Academic Demonstration Project for ICBT CSE5009 Web Application Development</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
