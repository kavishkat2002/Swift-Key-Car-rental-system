import React, { useState, useEffect } from 'react';
import { Vehicle, Review } from '../../types';
import { api } from '../../services/api';
import { VehicleCard } from '../../components/VehicleCard';
import {
  Calendar, Shield, Clock, Compass, Award,
  ChevronDown, CheckCircle, ArrowRight, HelpCircle, Send,
  Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface HomeProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onBookVehicle: (vehicle: Vehicle) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onBookVehicle }) => {
  const { showSuccess, showError } = useNotification();
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Background Motion Video State & Ref
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsVideoMuted(videoRef.current.muted);
    }
  };

  // Fast Hero Search Form
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const defaultReturn = new Date();
  defaultReturn.setDate(defaultReturn.getDate() + 5);
  const defaultReturnStr = defaultReturn.toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState(tomorrowStr);
  const [returnDate, setReturnDate] = useState(defaultReturnStr);
  const [category, setCategory] = useState('all');
  const [pickupLocation, setPickupLocation] = useState('Bandaranaike International Airport (CMB)');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Quick Inquiry Form State
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquirySubject, setInquirySubject] = useState('General Fleet Inquiry');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.vehicles.getFeatured(), api.reviews.getAll()])
      .then(([vehRes, revRes]) => {
        if (!isMounted) return;
        setFeaturedVehicles(vehRes.vehicles);
        setReviews(revRes.reviews.slice(0, 3));
      })
      .catch((err) => {
        console.error('Home load error:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('catalogue', {
      pickupDate,
      returnDate,
      category,
      pickupLocation
    });
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingInquiry(true);
      await api.inquiries.submit({
        fullName: inquiryName,
        email: inquiryEmail,
        phone: inquiryPhone,
        subject: inquirySubject,
        message: inquiryMessage
      });
      showSuccess('Your inquiry has been submitted! Our Negombo operations desk will reach out shortly.');
      setInquiryName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryMessage('');
    } catch (err: any) {
      showError(err.message || 'Failed to submit inquiry.');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const faqs = [
    {
      q: 'What driving license is required for tourists driving in Sri Lanka?',
      a: 'Foreign travelers must present a valid national driving license accompanied by an International Driving Permit (IDP) or obtain a Temporary Sri Lankan Driving Permit endorsed by the Department of Motor Traffic (DMT). SwiftDrive Rentals staff can assist you with local permit verification upon arrival.'
    },
    {
      q: 'Do you deliver vehicles directly to Bandaranaike International Airport (CMB)?',
      a: 'Yes! Our operational base is situated just 12 minutes from Bandaranaike Airport. We provide 24/7 curbside handovers outside the arrival terminal. Simply provide your incoming flight number during reservation.'
    },
    {
      q: 'How is the security deposit calculated and refunded?',
      a: 'A transparent, fixed refundable deposit (starting from LKR 25,000 for economy cars) is authorized upon vehicle release. Following return inspection and fuel verification, your deposit is released immediately.'
    },
    {
      q: 'Are mileage limits imposed on self-drive rentals?',
      a: 'All rentals include generous daily mileage allowances (100 km/day standard) with heavily discounted weekly and unlimited touring packages available for extended road trips across the island.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION WITH CINEMATIC MOTION VIDEO */}
      <section className="relative bg-[#07131e] text-white py-16 lg:py-24 overflow-hidden border-b border-slate-800">
        {/* Background Motion Video Container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-center scale-105 transform opacity-40 transition-opacity duration-1000"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          {/* Multi-layered cinematic gradient overlays for 100% WCAG contrast and readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07131e]/95 via-[#0c2035]/85 to-[#07131e]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07131e] via-transparent to-black/30" />
          <div className="absolute inset-0 backdrop-blur-[0.5px]" />
        </div>

        {/* Floating Motion Controls (Play/Pause & Mute) */}
        <div className="absolute bottom-4 right-4 sm:right-8 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-xs text-slate-300 shadow-lg">
          <span className="flex items-center gap-1.5 font-medium text-[11px] text-teal-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            Live Motion Fleet
          </span>
          <div className="w-[1px] h-3 bg-white/20"></div>
          <button
            type="button"
            onClick={togglePlay}
            className="p-1 hover:text-white transition-colors cursor-pointer"
            title={isVideoPlaying ? "Pause video animation" : "Play video animation"}
          >
            {isVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="p-1 hover:text-white transition-colors cursor-pointer"
            title={isVideoMuted ? "Unmute audio" : "Mute audio"}
          >
            {isVideoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Self-Drive Car Rentals in Negombo, Sri Lanka
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl font-normal drop-shadow-sm">
                Explore the cultural triangle, coastal highways, and misty tea plantations in total freedom.
                Clean, roadworthy fleet with transparent LKR tariffs, verified deposits, and 24/7 airport delivery.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('catalogue')}
                  className="px-6 py-3 bg-[#0F766E] hover:bg-[#0D655E] text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-teal-900/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore Fleet Catalogue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-semibold text-sm rounded-lg transition-colors cursor-pointer"
                >
                  About Our Fleet
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/10 text-xs">
                <div className="bg-white/5 border border-white/10 backdrop-blur-md p-3 rounded-lg">
                  <div className="text-lg font-bold text-white">100%</div>
                  <div className="text-slate-300 text-[11px]">Verified Fleet</div>
                </div>
                <div className="bg-white/5 border border-white/10 backdrop-blur-md p-3 rounded-lg">
                  <div className="text-lg font-bold text-white">24/7</div>
                  <div className="text-slate-300 text-[11px]">Airport Handover</div>
                </div>
                <div className="bg-white/5 border border-white/10 backdrop-blur-md p-3 rounded-lg">
                  <div className="text-lg font-bold text-white">LKR Zero</div>
                  <div className="text-slate-300 text-[11px]">Hidden Booking Fees</div>
                </div>
              </div>
            </div>

            {/* Fast Hero Search Box with Glassmorphism */}
            <div className="lg:col-span-5 bg-white/95 backdrop-blur-xl text-slate-900 rounded-2xl p-6 sm:p-7 shadow-2xl border border-white/40 ring-1 ring-black/5">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-base font-bold text-[#102A43]">
                  Find & Reserve Your Vehicle
                </h2>
                <p className="text-xs text-[#526477]">
                  Real-time database availability check
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pick-up & Handover Location
                  </label>
                  <select
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="Bandaranaike International Airport (CMB)">Bandaranaike Airport (CMB) Curbside</option>
                    <option value="Negombo Head Office (Lewis Place)">Negombo Head Office (Lewis Place)</option>
                    <option value="Colombo Fort Railway Station Desk">Colombo Fort Railway Station Desk</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pick-up Date
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Return Date
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={pickupDate}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vehicle Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="all">All Categories (Economy, SUV, Van, Luxury)</option>
                    <option value="economy">Economy Hatchbacks & Sedans</option>
                    <option value="suv">All-Wheel Drive SUVs</option>
                    <option value="van">Tourist 10-14 Seater Vans</option>
                    <option value="luxury">Executive Luxury Sedans</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Check Availability & Rates</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLEET CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-[#102A43] tracking-tight">
            Vehicle Fleet Tailored for Sri Lanka
          </h2>
          <p className="text-sm text-[#526477] mt-1">
            Carefully curated vehicle categories suited for city driving, highland mountain roads, and beach tours.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              id: 'economy',
              name: 'Economy',
              desc: 'Compact & hybrid city cars like Suzuki Alto & Toyota Axio. High fuel economy.',
              rate: 'From LKR 6,500/day'
            },
            {
              id: 'suv',
              name: 'SUVs',
              desc: 'Spacious all-wheel drive models like Toyota RAV4 & Mitsubishi Montero Sport.',
              rate: 'From LKR 16,500/day'
            },
            {
              id: 'van',
              name: 'Vans',
              desc: 'Spacious 10 to 14-seater high-roof Toyota HiAce vans for groups and families.',
              rate: 'From LKR 22,000/day'
            },
            {
              id: 'luxury',
              name: 'Luxury',
              desc: 'Executive saloons like Mercedes-Benz C200 and BMW 5-Series for VIP arrivals.',
              rate: 'From LKR 45,000/day'
            }
          ].map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('catalogue', { category: cat.id })}
              className="bg-white p-6 rounded-xl border border-slate-200 hover:border-teal-600/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
                  Category
                </span>
                <h3 className="text-lg font-bold text-[#102A43] mb-2">{cat.name}</h3>
                <p className="text-xs text-[#526477] leading-relaxed mb-4">{cat.desc}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{cat.rate}</span>
                <span className="text-teal-700 font-bold flex items-center gap-1">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED FLEET SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#102A43] tracking-tight">
              Featured Rental Vehicles
            </h2>
            <p className="text-sm text-[#526477] mt-1">
              Top requested models available for immediate reservation at our Negombo office.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('catalogue')}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>View All Fleet Vehicles</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onSelect={() => onNavigate('vehicle-details', { vehicleId: vehicle.id })}
                onBookNow={() => onBookVehicle(vehicle)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. COMPANY ADVANTAGE & RENTAL INFORMATION */}
      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-[#102A43] tracking-tight">
              Why Choose SwiftDrive Rentals in Negombo?
            </h2>
            <p className="text-sm text-[#526477] mt-1">
              Dependable fleet operations designed around the needs of independent travelers and corporate clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#102A43] mb-2">
                12-Minute Airport Handover
              </h3>
              <p className="text-xs text-[#526477] leading-relaxed">
                Skip long airport rental queues. Our representative meets you directly at the Bandaranaike CMB arrivals lobby with sanitized keys, agreement documentation, and full tank.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#102A43] mb-2">
                Transparent Pricing & Deposits
              </h3>
              <p className="text-xs text-[#526477] leading-relaxed">
                No unexpected currency conversion surcharges. All tariffs are priced in LKR with itemized breakdown of rental cost, refundable security deposit, and weekly discounts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#102A43] mb-2">
                24/7 Islandwide Assistance
              </h3>
              <p className="text-xs text-[#526477] leading-relaxed">
                Travel with total peace of mind. Every vehicle undergoes a rigorous multi-point mechanical inspection before release and includes round-the-clock roadside emergency backup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GENUINE CUSTOMER REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-[#102A43] tracking-tight">
            Verified Customer Feedback
          </h2>
          <p className="text-sm text-[#526477] mt-1">
            Genuine experiences recorded from travelers who hired vehicles with SwiftDrive Rentals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <span key={idx} className="text-sm">★</span>
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic mb-4">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-[#102A43]">{rev.author_name}</span>
                <span className="text-slate-400 text-[11px]">{new Date(rev.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[#102A43] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-[#526477] mt-1">
            Essential rental rules, driver requirements, and terms for Sri Lanka.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-[#102A43] hover:bg-slate-50"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-[#526477] leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. QUICK INQUIRY & CONTACT SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
          <div className="max-w-xl mx-auto text-center mb-6">
            <h2 className="text-xl font-bold text-[#102A43]">
              Need a Custom Itinerary or Long-Term Tariff?
            </h2>
            <p className="text-xs text-[#526477] mt-1">
              Send our Negombo reservation desk a message and receive a custom quote within 2 hours.
            </p>
          </div>

          <form onSubmit={handleInquirySubmit} className="space-y-4 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  placeholder="e.g. John Miller"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  placeholder="+94 77 123 4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message & Requirements</label>
              <textarea
                rows={3}
                required
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                placeholder="Specify your travel dates, vehicle preference, or airport handover request..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingInquiry}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-md transition-colors flex items-center gap-1.5"
              >
                <span>{isSubmittingInquiry ? 'Sending...' : 'Send Inquiry to Negombo Desk'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};
