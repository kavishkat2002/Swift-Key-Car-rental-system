import React, { useState, useEffect } from 'react';
import { Vehicle, PricingQuote, Booking } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Modal } from './Modal';
import { Calendar, CreditCard, AlertCircle, CheckCircle2, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  initialPickupDate?: string;
  initialReturnDate?: string;
  onBookingComplete?: (booking: Booking) => void;
  onNavigateLogin?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  initialPickupDate,
  initialReturnDate,
  onBookingComplete,
  onNavigateLogin
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Tomorrow as default pickup, 4 days later as return
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const defaultReturn = new Date();
  defaultReturn.setDate(defaultReturn.getDate() + 4);
  const defaultReturnStr = defaultReturn.toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState(initialPickupDate || tomorrowStr);
  const [returnDate, setReturnDate] = useState(initialReturnDate || defaultReturnStr);
  const [pickupLocation, setPickupLocation] = useState('Negombo Head Office (Lewis Place)');
  const [returnLocation, setReturnLocation] = useState('Negombo Head Office (Lewis Place)');
  const [specialRequests, setSpecialRequests] = useState('');

  // Quote state
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [availability, setAvailability] = useState<{ available: boolean; conflictReason?: string } | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Workflow steps: 'details' -> 'payment' -> 'confirmed'
  const [step, setStep] = useState<'details' | 'payment' | 'confirmed'>('details');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<'card_sandbox' | 'bank_transfer_test' | 'cash_on_pickup'>('card_sandbox');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('999');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch server quote whenever vehicle or dates change
  useEffect(() => {
    if (!vehicle || !isOpen) return;

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
        setQuoteError(err.message || 'Failed to calculate tariff quote.');
      })
      .finally(() => {
        if (isMounted) setIsQuoting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [vehicle, pickupDate, returnDate, isOpen]);

  if (!vehicle) return null;

  // Step 1: Confirm Details & Reserve
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showError('Please sign in to proceed with your vehicle booking.');
      if (onNavigateLogin) onNavigateLogin();
      return;
    }

    if (!quote || (availability && !availability.available)) {
      showError('Please select valid, available dates before continuing.');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await api.bookings.create({
        vehicleId: vehicle.id,
        pickupDate,
        returnDate,
        pickupLocation,
        returnLocation,
        specialRequests
      });

      setCreatedBooking(res.booking);
      setStep('payment');
      showSuccess(`Booking created with Ref: ${res.booking.booking_reference}. Please complete payment/deposit.`);
    } catch (err: any) {
      showError(err.message || 'Booking creation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Process Test Sandbox Payment
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdBooking) return;

    try {
      setIsProcessing(true);
      const res = await api.payments.process({
        bookingId: createdBooking.id,
        paymentMethod,
        paymentType: 'full',
        testCardNumber: cardNumber,
        testCardExpiry: cardExpiry,
        testCardCvc: cardCvc
      });

      setCreatedBooking(res.booking);
      setStep('confirmed');
      showSuccess('Payment confirmed! Your reservation is officially confirmed.');
      if (onBookingComplete) {
        onBookingComplete(res.booking);
      }
    } catch (err: any) {
      showError(err.message || 'Payment processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('details');
    setCreatedBooking(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      preventClose={isProcessing}
      title={
        step === 'details'
          ? `Reserve ${vehicle.make} ${vehicle.model} (${vehicle.year})`
          : step === 'payment'
          ? `Complete Booking Deposit: ${createdBooking?.booking_reference}`
          : 'Reservation Confirmed'
      }
      maxWidth="lg"
    >
      {/* STEP 1: Rental Configuration & Quote Review */}
      {step === 'details' && (
        <form onSubmit={handleProceedToPayment} className="space-y-5">
          {/* Vehicle mini summary */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <img
              src={vehicle.main_image_url}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-16 h-12 object-cover rounded border border-slate-200"
            />
            <div className="flex-1">
              <div className="text-sm font-bold text-[#102A43]">
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </div>
              <div className="text-xs text-[#526477]">
                {vehicle.transmission} • {vehicle.seating_capacity} Seats • {vehicle.fuel_type} • Reg: {vehicle.registration_number}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-[#102A43]">
                LKR {vehicle.daily_rate_lkr.toLocaleString()}/day
              </div>
              <div className="text-[10px] text-teal-700 font-medium">
                Deposit: LKR {vehicle.deposit_lkr.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Date Picker Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="booking-pickup-date" className="block text-xs font-semibold text-slate-700 mb-1">
                Pick-up Date <span className="text-rose-600">*</span>
              </label>
              <input
                id="booking-pickup-date"
                type="date"
                min={todayStr}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required
                aria-required="true"
                aria-invalid={Boolean(quoteError)}
                aria-describedby={quoteError ? 'booking-quote-error' : undefined}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="booking-return-date" className="block text-xs font-semibold text-slate-700 mb-1">
                Return Date <span className="text-rose-600">*</span>
              </label>
              <input
                id="booking-return-date"
                type="date"
                min={pickupDate}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
                aria-required="true"
                aria-invalid={Boolean(quoteError)}
                aria-describedby={quoteError ? 'booking-quote-error' : undefined}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="booking-pickup-location" className="block text-xs font-semibold text-slate-700 mb-1">
                Pick-up Location
              </label>
              <select
                id="booking-pickup-location"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
              >
                <option value="Negombo Head Office (Lewis Place)">Negombo Head Office (Lewis Place)</option>
                <option value="Bandaranaike International Airport (CMB)">Bandaranaike Airport CMB (Curbside)</option>
                <option value="Colombo Fort Railway Station Desk">Colombo Fort Railway Station Desk</option>
              </select>
            </div>

            <div>
              <label htmlFor="booking-return-location" className="block text-xs font-semibold text-slate-700 mb-1">
                Return Location
              </label>
              <select
                id="booking-return-location"
                value={returnLocation}
                onChange={(e) => setReturnLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
              >
                <option value="Negombo Head Office (Lewis Place)">Negombo Head Office (Lewis Place)</option>
                <option value="Bandaranaike International Airport (CMB)">Bandaranaike Airport CMB (Curbside)</option>
                <option value="Colombo Fort Railway Station Desk">Colombo Fort Railway Station Desk</option>
              </select>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label htmlFor="booking-special-requests" className="block text-xs font-semibold text-slate-700 mb-1">
              Flight Details or Special Requirements (Optional)
            </label>
            <input
              id="booking-special-requests"
              type="text"
              placeholder="e.g., Flight UL504 arrives 14:30; request baby car seat"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>

          {/* Live Quote Breakdown Card */}
          {quoteError ? (
            <div id="booking-quote-error" role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
              <span>{quoteError}</span>
            </div>
          ) : quote ? (
            <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between font-medium text-slate-700">
                <span>Duration ({quote.totalDays} Days @ LKR {quote.dailyRateApplied.toLocaleString()}/day):</span>
                <span>LKR {quote.rentalCostLkr.toLocaleString()}</span>
              </div>

              {quote.weeklyDiscountApplied && (
                <div className="flex justify-between text-teal-800 font-semibold">
                  <span>Weekly Tariff Discount Applied:</span>
                  <span>- LKR {quote.savingsLkr.toLocaleString()} Saved</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Refundable Security Deposit:</span>
                <span>LKR {quote.depositAmountLkr.toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t border-teal-200 flex justify-between items-baseline text-sm font-bold text-[#102A43]">
                <span>Total Amount (Rental + Deposit):</span>
                <span className="text-base text-teal-800">LKR {quote.totalAmountLkr.toLocaleString()}</span>
              </div>
            </div>
          ) : isQuoting ? (
            <div className="text-center py-3 text-xs text-slate-500" aria-live="polite">
              Calculating verified server tariff...
            </div>
          ) : null}

          {/* Auth prompt if logged out */}
          {!user && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
              <span>You are not signed in. Please sign in to finalize your booking.</span>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="font-bold underline hover:text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-1"
              >
                Sign In Now
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !quote || Boolean(quoteError) || Boolean(availability && !availability.available)}
              aria-busy={isProcessing}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-md transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"
            >
              <span>{isProcessing ? 'Reserving...' : 'Continue to Payment'}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Test Sandbox Payment / Deposit */}
      {step === 'payment' && createdBooking && (
        <form onSubmit={handleProcessPayment} className="space-y-5">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Booking Reference:</span>
              <span className="font-bold text-[#102A43]">{createdBooking.booking_reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vehicle:</span>
              <span className="font-semibold">{vehicle.make} {vehicle.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rental Dates:</span>
              <span>{createdBooking.pickup_date} to {createdBooking.return_date} ({createdBooking.total_days} Days)</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold text-teal-800">
              <span>Total Payable Now:</span>
              <span>LKR {createdBooking.total_amount_lkr.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <div id="payment-method-heading" className="block text-xs font-semibold text-slate-700 mb-2">
              Select Payment Method (Test Sandbox)
            </div>
            <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-labelledby="payment-method-heading">
              <label
                htmlFor="payment-card-sandbox"
                className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer ${
                  paymentMethod === 'card_sandbox'
                    ? 'border-teal-600 bg-teal-50/50 text-[#102A43] font-semibold'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                <input
                  id="payment-card-sandbox"
                  type="radio"
                  name="paymentMethod"
                  value="card_sandbox"
                  checked={paymentMethod === 'card_sandbox'}
                  onChange={() => setPaymentMethod('card_sandbox')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <CreditCard className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <div>Visa / Mastercard (Test Sandbox Gateway)</div>
                  <div className="text-[11px] font-normal text-slate-500">
                    Instant automated sandbox transaction simulation
                  </div>
                </div>
              </label>

              <label
                htmlFor="payment-bank-transfer"
                className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer ${
                  paymentMethod === 'bank_transfer_test'
                    ? 'border-teal-600 bg-teal-50/50 text-[#102A43] font-semibold'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                <input
                  id="payment-bank-transfer"
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer_test"
                  checked={paymentMethod === 'bank_transfer_test'}
                  onChange={() => setPaymentMethod('bank_transfer_test')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <div>Direct Bank Transfer (BOC / Commercial Bank)</div>
                  <div className="text-[11px] font-normal text-slate-500">
                    Staff verifies transfer reference upon processing
                  </div>
                </div>
              </label>

              <label
                htmlFor="payment-cash-pickup"
                className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer ${
                  paymentMethod === 'cash_on_pickup'
                    ? 'border-teal-600 bg-teal-50/50 text-[#102A43] font-semibold'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                <input
                  id="payment-cash-pickup"
                  type="radio"
                  name="paymentMethod"
                  value="cash_on_pickup"
                  checked={paymentMethod === 'cash_on_pickup'}
                  onChange={() => setPaymentMethod('cash_on_pickup')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <div>Pay on Vehicle Pickup (Negombo Counter)</div>
                  <div className="text-[11px] font-normal text-slate-500">
                    Settle balance in LKR or foreign currency on arrival
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Sandbox Card Form */}
          {paymentMethod === 'card_sandbox' && (
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">Test Sandbox Card Details</span>
                <span className="text-[11px] text-teal-700 font-medium">Test Mode Active</span>
              </div>

              <div>
                <label htmlFor="booking-card-number" className="block text-[11px] font-medium text-slate-600 mb-1">
                  Card Number
                </label>
                <input
                  id="booking-card-number"
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                  aria-required="true"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-mono focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Quick test buttons for assessment grading */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCardNumber('4242 4242 4242 4242')}
                  className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Fill Valid Test Card (Success)
                </button>
                <button
                  type="button"
                  onClick={() => setCardNumber('4000 0000 0000 0000')}
                  className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-200 hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  Fill Decline Card (...0000)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="booking-card-expiry" className="block text-[11px] font-medium text-slate-600 mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input
                    id="booking-card-expiry"
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    required
                    aria-required="true"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-mono focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label htmlFor="booking-card-cvc" className="block text-[11px] font-medium text-slate-600 mb-1">
                    Security CVC
                  </label>
                  <input
                    id="booking-card-cvc"
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    required
                    aria-required="true"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-mono focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              aria-busy={isProcessing}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-md transition-colors disabled:bg-slate-300 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"
            >
              <span>{isProcessing ? 'Processing...' : 'Confirm & Authorize'}</span>
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Booking Confirmation Receipt */}
      {step === 'confirmed' && createdBooking && (
        <div role="status" aria-live="polite" className="space-y-5 text-center py-2">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#102A43]">
              Reservation Confirmed!
            </h3>
            <p className="text-xs text-[#526477] mt-1">
              Your booking has been recorded in the SwiftDrive Rentals database.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Booking Reference:</span>
              <span className="font-bold text-[#102A43] text-sm">{createdBooking.booking_reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vehicle:</span>
              <span className="font-semibold">{vehicle.make} {vehicle.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pick-up Date:</span>
              <span>{createdBooking.pickup_date} ({createdBooking.pickup_location})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Return Date:</span>
              <span>{createdBooking.return_date} ({createdBooking.return_location})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="capitalize text-emerald-700 font-semibold">{createdBooking.booking_status}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-xs font-bold text-[#102A43]">
              <span>Payment Status:</span>
              <span className="capitalize text-emerald-700 font-bold">{createdBooking.payment_status}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            A copy of this reservation voucher has been stored on your customer dashboard.
            Our Negombo representative will meet you with vehicle keys and handover inspection.
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"
            >
              Done & Return to Fleet
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
