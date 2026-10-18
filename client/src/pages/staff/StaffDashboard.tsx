import React, { useState, useEffect } from 'react';
import { Booking, Inquiry } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { InspectionModal } from '../../components/InspectionModal';
import {
  ClipboardList, Search, AlertTriangle, CheckCircle,
  Clock, MapPin, Phone, Mail, ArrowRight, MessageSquare, Car
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'bookings' | 'inquiries'>('bookings');

  // Inspection modal state
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [selectedBookingForInspection, setSelectedBookingForInspection] = useState<Booking | null>(null);
  const [inspectionType, setInspectionType] = useState<'pickup' | 'return'>('pickup');

  // Inquiry Response Modal
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState<'new' | 'in_progress' | 'resolved'>('in_progress');
  const [responseNotes, setResponseNotes] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.staff.getBookings({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm.trim() || undefined
      }),
      api.staff.getInquiries()
    ])
      .then(([bRes, iRes]) => {
        setBookings(bRes.bookings);
        setInquiries(iRes.inquiries);
      })
      .catch((err) => {
        showError(err.message || 'Failed to load staff operational data.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      await api.staff.updateStatus(bookingId, newStatus);
      showSuccess(`Booking status transitioned to ${newStatus}.`);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Failed to update status.');
    }
  };

  const handleOpenInspection = (booking: Booking, type: 'pickup' | 'return') => {
    setSelectedBookingForInspection(booking);
    setInspectionType(type);
    setInspectionModalOpen(true);
  };

  const handleOpenInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setInquiryStatus(inquiry.status);
    setResponseNotes(inquiry.response_notes || '');
    setInquiryModalOpen(true);
  };

  const handleSaveInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    try {
      await api.staff.updateInquiry(selectedInquiry.id, inquiryStatus, responseNotes);
      showSuccess(`Inquiry #${selectedInquiry.id} updated.`);
      setInquiryModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Failed to update inquiry.');
    }
  };

  // Find overdue bookings
  const overdueBookings = bookings.filter((b) => b.isOverdue);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
            Staff Operations Desk
          </h1>
          <p className="text-xs sm:text-sm text-[#526477] mt-1">
            Logged in as <span className="font-semibold text-slate-800">{user?.fullName}</span> • Negombo Terminal Handover & Fleet Return Management
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'bookings'
                ? 'bg-[#102A43] text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Reservations ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'inquiries'
                ? 'bg-[#102A43] text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Customer Inquiries ({inquiries.length})
          </button>
        </div>
      </div>

      {/* OVERDUE RETURNS ALERT BANNER (Assessment Requirement 9) */}
      {overdueBookings.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3 text-rose-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-sm block mb-1">
              Overdue Vehicle Returns Detected ({overdueBookings.length} Vehicle{overdueBookings.length > 1 ? 's' : ''})
            </span>
            <p className="leading-relaxed">
              The following active rentals have passed their contractual return date. Please contact the customer immediately:
            </p>
            <ul className="mt-2 space-y-1 font-mono text-[11px]">
              {overdueBookings.map((b) => (
                <li key={b.id}>
                  • Ref: {b.booking_reference} ({b.vehicle_make} {b.vehicle_model} - {b.vehicle_reg}) — Due on {b.return_date}. Customer: {b.customer_name} ({b.customer_phone})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 1: BOOKINGS MANAGEMENT */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Controls bar: Status Filter & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-colors ${
                    statusFilter === st
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Keyword Search */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-72">
              <input
                type="text"
                placeholder="Ref, customer, vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#102A43] text-white rounded-md text-xs font-semibold shrink-0"
              >
                Search
              </button>
            </form>
          </div>

          {/* Bookings Table / Cards */}
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-500">Loading operations records...</div>
          ) : bookings.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-xs text-slate-500">
              No reservation records matching criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                    booking.isOverdue ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                >
                  {/* Vehicle & Customer Details */}
                  <div className="flex items-start gap-4">
                    <img
                      src={booking.vehicle_image}
                      alt={booking.vehicle_model}
                      className="w-20 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {booking.booking_reference}
                        </span>
                        <Badge status={booking.booking_status} />
                        <Badge status={booking.payment_status} />
                        {booking.isOverdue && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-300">
                            OVERDUE RETURN
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#102A43]">
                        {booking.vehicle_make} {booking.vehicle_model} ({booking.vehicle_reg})
                      </h3>

                      <div className="text-xs text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{booking.customer_name}</span>
                          <span>•</span>
                          <span>{booking.customer_phone}</span>
                          <span>•</span>
                          <span>{booking.customer_email}</span>
                        </div>
                        <div className="text-slate-500">
                          Dates: {booking.pickup_date} to {booking.return_date} ({booking.total_days} Days) | Handover: {booking.pickup_location}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Status Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div className="text-left lg:text-right text-xs">
                      <div className="font-bold text-sm text-[#102A43]">
                        LKR {booking.total_amount_lkr.toLocaleString()}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Deposit: LKR {booking.deposit_amount_lkr.toLocaleString()}
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {booking.booking_status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(booking.id, 'confirmed')}
                          className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold rounded-md transition-colors"
                        >
                          Confirm Booking
                        </button>
                      )}

                      {booking.booking_status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleOpenInspection(booking, 'pickup')}
                          className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
                        >
                          <span>Process Pick-up Handover</span>
                        </button>
                      )}

                      {booking.booking_status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleOpenInspection(booking, 'return')}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
                        >
                          <span>Process Return Inspection</span>
                        </button>
                      )}

                      {(booking.booking_status === 'pending' || booking.booking_status === 'confirmed') && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(booking.id, 'cancelled')}
                          className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors"
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

      {/* TAB 2: INQUIRIES MANAGEMENT */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {inquiries.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-xs text-slate-500">
              No customer inquiries recorded.
            </div>
          ) : (
            inquiries.map((inq) => (
              <div
                key={inq.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#102A43] text-sm">{inq.subject}</span>
                    <Badge status={inq.status} />
                  </div>
                  <div className="text-slate-600">
                    From: <span className="font-semibold text-slate-800">{inq.full_name}</span> ({inq.email} • {inq.phone})
                  </div>
                  <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded border border-slate-100 my-1">
                    "{inq.message}"
                  </p>
                  {inq.response_notes && (
                    <div className="text-teal-900 bg-teal-50/60 p-2 rounded border border-teal-200 text-[11px]">
                      <strong>Staff Response:</strong> {inq.response_notes}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenInquiry(inq)}
                  className="px-3 py-1.5 bg-[#102A43] text-white text-xs font-semibold rounded-md self-start md:self-auto shrink-0"
                >
                  Update & Respond
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* CONDITION INSPECTION MODAL */}
      <InspectionModal
        isOpen={inspectionModalOpen}
        onClose={() => setInspectionModalOpen(false)}
        booking={selectedBookingForInspection}
        reportType={inspectionType}
        onInspectionRecorded={loadData}
      />

      {/* INQUIRY RESPONSE MODAL */}
      <Modal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        title={selectedInquiry ? `Respond to Inquiry #${selectedInquiry.id}` : 'Inquiry'}
        maxWidth="md"
      >
        {selectedInquiry && (
          <form onSubmit={handleSaveInquiry} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div className="font-bold text-[#102A43]">{selectedInquiry.full_name}</div>
              <div className="text-slate-500">{selectedInquiry.email} • {selectedInquiry.phone}</div>
              <div className="text-slate-700 italic mt-1 font-serif">"{selectedInquiry.message}"</div>
            </div>

            <div>
              <label htmlFor="inquiry-status-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Update Status
              </label>
              <select
                id="inquiry-status-select"
                value={inquiryStatus}
                onChange={(e: any) => setInquiryStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
              >
                <option value="new">New (Unassigned)</option>
                <option value="in_progress">In Progress (Contacting Renter)</option>
                <option value="resolved">Resolved (Quotation Sent / Completed)</option>
              </select>
            </div>

            <div>
              <label htmlFor="inquiry-response-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Operational Notes / Staff Response
              </label>
              <textarea
                id="inquiry-response-notes"
                rows={3}
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder="e.g. Sent flight tracking confirmation and vehicle handover guidelines via WhatsApp."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInquiryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-md transition-colors"
              >
                Save Inquiry Update
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
