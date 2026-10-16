import React, { useState } from 'react';
import { Booking } from '../types';
import { api } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Modal } from './Modal';
import { ClipboardCheck, Fuel, AlertTriangle } from 'lucide-react';

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  reportType: 'pickup' | 'return';
  onInspectionRecorded: () => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  isOpen,
  onClose,
  booking,
  reportType,
  onInspectionRecorded
}) => {
  const { showSuccess, showError } = useNotification();

  const [odometerReading, setOdometerReading] = useState(30000);
  const [fuelLevel, setFuelLevel] = useState<'empty' | 'quarter' | 'half' | 'three_quarters' | 'full'>('full');
  const [exteriorCondition, setExteriorCondition] = useState('Clean exterior, no new visible scratches or dents.');
  const [interiorCondition, setInteriorCondition] = useState('Clean upholstery, sanitized mats, spare tyre and jack verified.');
  const [damageNotes, setDamageNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await api.staff.recordInspection({
        bookingId: booking.id,
        vehicleId: booking.vehicle_id,
        reportType,
        odometerReading: Number(odometerReading),
        fuelLevel,
        exteriorCondition,
        interiorCondition,
        damageNotes: damageNotes.trim() ? damageNotes.trim() : undefined
      });

      // Also advance the status if appropriate
      if (reportType === 'pickup') {
        await api.staff.updateStatus(booking.id, 'active', 'Vehicle handed over to customer with pickup inspection');
      } else {
        await api.staff.updateStatus(booking.id, 'completed', 'Vehicle returned by customer with inspection checklist verified');
      }

      showSuccess(`${reportType === 'pickup' ? 'Pick-up' : 'Return'} condition inspection saved successfully.`);
      onInspectionRecorded();
      onClose();
    } catch (err: any) {
      showError(err.message || 'Failed to record condition report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${reportType === 'pickup' ? 'Pick-up Handover' : 'Return Inspection'} Checklist: ${booking.booking_reference}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div className="font-semibold text-[#102A43]">
            {booking.vehicle_make} {booking.vehicle_model} (Reg: {booking.vehicle_reg})
          </div>
          <div className="text-slate-500">
            Customer: {booking.customer_name} • Phone: {booking.customer_phone}
          </div>
        </div>

        {/* Odometer Reading */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Current Odometer Reading (km)
          </label>
          <input
            type="number"
            min="0"
            value={odometerReading}
            onChange={(e) => setOdometerReading(Number(e.target.value))}
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md font-mono"
          />
        </div>

        {/* Fuel Level */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Fuel Gauge Level
          </label>
          <select
            value={fuelLevel}
            onChange={(e: any) => setFuelLevel(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
          >
            <option value="full">Full Tank (100%)</option>
            <option value="three_quarters">3/4 Tank (75%)</option>
            <option value="half">1/2 Tank (50%)</option>
            <option value="quarter">1/4 Tank (25%)</option>
            <option value="empty">Empty Tank</option>
          </select>
        </div>

        {/* Exterior Condition */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Exterior Bodywork Condition
          </label>
          <textarea
            rows={2}
            value={exteriorCondition}
            onChange={(e) => setExteriorCondition(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
          />
        </div>

        {/* Interior Condition */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Interior & Accessories Condition
          </label>
          <textarea
            rows={2}
            value={interiorCondition}
            onChange={(e) => setInteriorCondition(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
          />
        </div>

        {/* Damage Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Damage or Defect Notes (If any)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Record any minor scratches, dents, or missing tools to ensure deposit reconciliation."
            value={damageNotes}
            onChange={(e) => setDamageNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-md transition-colors flex items-center gap-1.5"
          >
            <span>{isSubmitting ? 'Recording...' : `Submit ${reportType === 'pickup' ? 'Pick-up' : 'Return'} Inspection`}</span>
            <ClipboardCheck className="w-4 h-4" />
          </button>
        </div>
      </form>
    </Modal>
  );
};
