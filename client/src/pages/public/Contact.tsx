import React, { useState } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { MapPin, Phone, Mail, Clock, Send, MessageSquare } from 'lucide-react';

export const Contact: React.FC = () => {
  const { showSuccess, showError } = useNotification();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Airport Curbside Delivery');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (trimmedName.length < 2) {
      showError('Full name must be at least 2 characters.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }
    if (trimmedPhone.length < 8) {
      showError('Contact phone must be at least 8 characters.');
      return;
    }
    if (trimmedSubject.length < 3) {
      showError('Inquiry subject must be at least 3 characters.');
      return;
    }
    if (trimmedMessage.length < 10) {
      showError('Detailed message must be at least 10 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.inquiries.submit({
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        subject: trimmedSubject,
        message: trimmedMessage
      });

      showSuccess(`Inquiry #${res.inquiryId} submitted! Our operations staff will contact you via WhatsApp / email.`);
      setFullName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      showError(err.message || 'Failed to submit inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-[#102A43] tracking-tight">
          Contact SwiftDrive Rentals Negombo
        </h1>
        <p className="text-xs sm:text-sm text-[#526477] mt-1">
          Inquire regarding airport handovers, custom monthly rates, or chauffeur requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#102A43]">
              Head Office & Operations Base
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-[#526477]">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Negombo Lewis Place Branch</div>
                  <div>No. 45, Beach Road, Negombo, Western Province, Sri Lanka</div>
                  <div className="text-slate-400 text-xs mt-0.5">12 minutes drive from Bandaranaike Airport (CMB)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Direct Telephone & WhatsApp</div>
                  <div>Office: +94 31 222 3456</div>
                  <div>24/7 Roadside Hotline: +94 77 123 4567</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Electronic Mail</div>
                  <div>reservations@swiftdrive.lk</div>
                  <div>support@swiftdrive.lk</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Opening Hours</div>
                  <div>Office: 07:00 – 21:00 (Daily)</div>
                  <div>Airport Terminal Delivery: 24 Hours / 7 Days</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 text-xs text-teal-950 space-y-2">
            <h3 className="font-bold text-sm text-teal-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-700" />
              <span>Bandaranaike CMB Airport Meet & Greet</span>
            </h3>
            <p className="leading-relaxed">
              Arriving on a late-night or early-morning flight? Send us your flight number. Our representative will wait at the arrival gates with your prepared rental dossier and escort you to your vehicle.
            </p>
          </div>
        </div>

        {/* Inquiry Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#102A43]">
              Send an Online Rental Inquiry
            </h2>
            <p className="text-xs text-[#526477] mt-1">
              Recorded directly into our staff workflow engine for prompt response.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="e.g. Rachel Adams"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="rachel@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={30}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="+94 77 000 0000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject *
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                >
                  <option value="Airport Curbside Delivery">Airport Curbside Delivery</option>
                  <option value="Long-term Corporate Tariff">Long-term Corporate Tariff</option>
                  <option value="Chauffeur & Van Tour Package">Chauffeur & Van Tour Package</option>
                  <option value="Sri Lanka Driving Permit Advice">Sri Lanka Driving Permit Advice</option>
                  <option value="Other Question">Other Question</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Message & Travel Requirements *
              </label>
              <textarea
                rows={4}
                required
                maxLength={3000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                placeholder="Mention travel dates, preferred vehicle category, flight details, or specific routing..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
