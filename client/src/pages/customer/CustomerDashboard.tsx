import React, { useState, useEffect } from 'react';
import { Booking, User } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  Calendar, CreditCard, User as UserIcon, Clock, MapPin,
  AlertCircle, CheckCircle2, XCircle, FileText, ChevronRight, Ban
} from 'lucide-react';

interface CustomerDashboardProps {
  onNavigateFleet: () => void;
  onPayBooking: (booking: Booking) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onNavigateFleet,
  onPayBooking
}) => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile'>('bookings');

  // Single Booking Detail Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Cancellation Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Profile Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [licenseNumber, setLicenseNumber] = useState(user?.drivingLicenseNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const loadBookings = () => {
    setLoading(true);
    api.bookings.getMy()
      .then((res) => {
        setBookings(res.bookings);
      })
      .catch((err) => {
        showError(err.message || 'Failed to load bookings.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleOpenDetail = async (bookingId: number) => {
    try {
      const res = await api.bookings.getById(bookingId);
      setSelectedBooking(res.booking);
      setDetailModalOpen(true);
    } catch (err: any) {
      showError(err.message || 'Failed to fetch booking details.');
    }
  };

  const handleOpenCancel = (booking: Booking) => {
    setBookingToCancel(booking);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingToCancel) return;

    try {
      setIsCancelling(true);
      await api.bookings.cancel(bookingToCancel.id, cancelReason);
      showSuccess(`Booking ${bookingToCancel.booking_reference} has been cancelled.`);
      setCancelModalOpen(false);
      setBookingToCancel(null);
      loadBookings();
      if (selectedBooking && selectedBooking.id === bookingToCancel.id) {
        setSelectedBooking((prev) => prev ? { ...prev, booking_status: 'cancelled', cancellation_reason: cancelReason } : null);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const res = await api.auth.updateProfile({
        fullName,
        phone,
        drivingLicenseNumber: licenseNumber,
        address
      });
      updateUser(res.user);
      showSuccess('Profile updated successfully.');
    } catch (err: any) {
      showError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Group bookings
  const upcomingBookings = bookings.filter((b) => b.booking_status === 'pending' || b.booking_status === 'confirmed');
  const activeBookings = bookings.filter((b) => b.booking_status === 'active');
  const pastBookings = bookings.filter((b) => b.booking_status === 'completed' || b.booking_status === 'cancelled');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
            Customer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#526477] mt-1">
            Welcome back, <span className="font-semibold text-slate-800">{user?.fullName}</span> • Isolated Customer Portal
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateFleet}
          className="px-4 py-2 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-md shadow-xs transition-colors self-start sm:self-auto"
        >
          Book Another Vehicle
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-teal-700 text-teal-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>My Reservations ({bookings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-teal-700 text-teal-800 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile & License Details</span>
        </button>
      </div>

      {/* TAB 1: BOOKINGS LIST */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs">Loading reservations...</div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#102A43]">
                No Bookings Found
              </h3>
              <p className="text-xs text-[#526477] max-w-sm mx-auto">
                You have not made any car reservations yet. Discover our vehicles for your Negombo arrival.
              </p>
              <button
                type="button"
                onClick={onNavigateFleet}
                className="px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-md"
              >
                Browse Fleet Catalogue
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Vehicle & Reference */}
                  <div className="flex items-start gap-4">
                    <img
                      src={booking.vehicle_image}
                      alt={booking.vehicle_model}
                      className="w-20 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {booking.booking_reference}
                        </span>
                        <Badge status={booking.booking_status} />
                        <Badge status={booking.payment_status} />
                      </div>

                      <h3 className="text-base font-bold text-[#102A43]">
                        {booking.vehicle_make} {booking.vehicle_model} ({booking.vehicle_year})
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#526477]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{booking.pickup_date} to {booking.return_date} ({booking.total_days} Days)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{booking.pickup_location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Tariff & Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="text-base font-bold text-[#102A43]">
                        LKR {booking.total_amount_lkr.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-[#526477]">
                        Rental: LKR {booking.rental_cost_lkr.toLocaleString()} • Deposit: LKR {booking.deposit_amount_lkr.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(booking.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#102A43] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                      >
                        View Details
                      </button>

                      {booking.payment_status === 'pending' && booking.booking_status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => onPayBooking(booking)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-md transition-colors"
                        >
                          Pay Now
                        </button>
                      )}

                      {(booking.booking_status === 'pending' || booking.booking_status === 'confirmed') && (
                        <button
                          type="button"
                          onClick={() => handleOpenCancel(booking)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors"
                          title="Cancel Booking"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOMER PROFILE & LICENSE DETAILS */}
      {activeTab === 'profile' && user && (
        <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#102A43]">
              Personal Information & Driving Credentials
            </h2>
            <p className="text-xs text-[#526477]">
              Stored securely for rental agreements and insurance validation
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 text-slate-500 rounded-md cursor-not-allowed"
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driving License / IDP Number
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. B1234567 or IDP Number"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permanent Residential or Vacation Accommodation Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Hotel address or Home residence"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETAIL MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedBooking ? `Reservation Details: ${selectedBooking.booking_reference}` : 'Booking Details'}
        maxWidth="lg"
      >
        {selectedBooking && (
          <div className="space-y-5 text-xs">
            {/* Summary card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-[#102A43]">
                  {selectedBooking.vehicle_make} {selectedBooking.vehicle_model} ({selectedBooking.vehicle_year})
                </span>
                <div className="flex gap-1.5">
                  <Badge status={selectedBooking.booking_status} />
                  <Badge status={selectedBooking.payment_status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Pick-up</span>
                  <span className="font-semibold text-slate-800">{selectedBooking.pickup_date}</span>
                  <div className="text-[11px]">{selectedBooking.pickup_location}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Return</span>
                  <span className="font-semibold text-slate-800">{selectedBooking.return_date}</span>
                  <div className="text-[11px]">{selectedBooking.return_location}</div>
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="p-4 bg-teal-50/50 border border-teal-200/60 rounded-lg space-y-2">
              <div className="font-bold text-[#102A43]">Financial Breakdown (LKR)</div>
              <div className="flex justify-between text-slate-700">
                <span>Rental Charge ({selectedBooking.total_days} Days @ LKR {selectedBooking.daily_rate_applied.toLocaleString()}/day):</span>
                <span>LKR {selectedBooking.rental_cost_lkr.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Refundable Security Deposit:</span>
                <span>LKR {selectedBooking.deposit_amount_lkr.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-teal-200 font-bold text-sm text-[#102A43]">
                <span>Total Amount:</span>
                <span className="text-teal-800">LKR {selectedBooking.total_amount_lkr.toLocaleString()}</span>
              </div>
            </div>

            {/* Special requests or cancellation notes */}
            {selectedBooking.special_requests && (
              <div>
                <span className="font-bold text-slate-700 block mb-1">Special Handover Requests:</span>
                <p className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-600">
                  {selectedBooking.special_requests}
                </p>
              </div>
            )}

            {selectedBooking.cancellation_reason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900">
                <span className="font-bold block mb-0.5">Cancellation Reason:</span>
                <span>{selectedBooking.cancellation_reason}</span>
              </div>
            )}

            {/* Inspection Reports from Staff if completed/active */}
            {selectedBooking.inspections && selectedBooking.inspections.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">Verified Condition Inspection Records:</span>
                {selectedBooking.inspections.map((ins) => (
                  <div key={ins.id} className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1">
                    <div className="flex justify-between font-bold text-teal-800 capitalize">
                      <span>{ins.report_type} Inspection Check</span>
                      <span>Odometer: {ins.odometer_reading.toLocaleString()} km</span>
                    </div>
                    <div>Fuel: {ins.fuel_level} • Exterior: {ins.exterior_condition}</div>
                    {ins.damage_notes && <div className="text-amber-800">Notes: {ins.damage_notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* CANCELLATION MODAL */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Confirm Booking Cancellation"
        maxWidth="md"
      >
        {bookingToCancel && (
          <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to cancel booking <strong>{bookingToCancel.booking_reference}</strong> ({bookingToCancel.pickup_date} to {bookingToCancel.return_date})?
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Change of travel itinerary, flight rescheduled..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
              >
                Keep Booking
              </button>
              <button
                type="submit"
                disabled={isCancelling}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-md transition-colors"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
