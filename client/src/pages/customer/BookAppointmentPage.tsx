import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  XCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

export const BookAppointmentPage: React.FC = () => {
  const { user } = useAuth();
  const [purpose, setPurpose] = useState<string>('GOLD_PLEDGE');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Existing customer appointments list
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [loadingMyAppts, setLoadingMyAppts] = useState<boolean>(true);

  const fetchAvailableSlots = async (date: string) => {
    try {
      setLoadingSlots(true);
      const res = await api.get('/appointments/available-slots', {
        params: { date },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSlots(res.data.data);
        const firstAvail = res.data.data.find((s: any) => s.isAvailable);
        setSelectedSlotId(firstAvail ? firstAvail.id : '');
      } else {
        setSlots([]);
        setSelectedSlotId('');
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
      setSlots([]);
      setSelectedSlotId('');
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      setLoadingMyAppts(true);
      const res = await api.get('/appointments');
      if (res.data?.success && res.data.data) {
        setMyAppointments(Array.isArray(res.data.data.appointments) ? res.data.data.appointments : []);
      } else {
        setMyAppointments([]);
      }
    } catch (err) {
      console.error('Failed to load my appointments:', err);
      setMyAppointments([]);
    } finally {
      setLoadingMyAppts(false);
    }
  };

  useEffect(() => {
    fetchAvailableSlots(selectedDate);
    fetchMyAppointments();
  }, [selectedDate]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;

    try {
      setIsSubmitting(true);
      const res = await api.post('/appointments/book', {
        slotId: selectedSlotId,
        purpose,
        notes: notes || undefined,
      });

      if (res.data?.success) {
        setConfirmedBooking(res.data.data);
        fetchAvailableSlots(selectedDate);
        fetchMyAppointments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this visit slot?')) return;
    try {
      await api.post(`/appointments/${id}/cancel`);
      fetchMyAppointments();
      fetchAvailableSlots(selectedDate);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="pb-1 border-b border-[#DDD5C8]">
        <h1 className="text-base font-extrabold text-charcoal tracking-tight">
          Book In-Store Appointment
        </h1>
        <p className="text-2xs text-charcoal-secondary">
          Reserve an offline consultation slot for jewelry appraisal, new loan pledge, repayment, or gold release
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left Column: Booking Form or Confirmation */}
        <div className="space-y-4">
          {/* Confirmation View (Requirement #22) */}
          {confirmedBooking ? (
            <div className="card-compact bg-emerald-50/70 border-emerald-300 p-5 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Appointment Confirmed
                </h2>
              </div>

              <div className="bg-white border border-[#DDD5C8] p-4 rounded text-xs space-y-2 shadow-inner">
                <div className="flex justify-between items-center py-1 border-b border-[#DDD5C8]/60">
                  <span className="text-charcoal-secondary">Customer:</span>
                  <span className="font-bold">{user?.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#DDD5C8]/60">
                  <span className="text-charcoal-secondary">Date:</span>
                  <span className="font-bold">{formatDate(confirmedBooking.date)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#DDD5C8]/60">
                  <span className="text-charcoal-secondary">Time:</span>
                  <span className="font-bold font-mono text-coffee">{confirmedBooking.timeSlot}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#DDD5C8]/60">
                  <span className="text-charcoal-secondary">Purpose:</span>
                  <span className="badge badge-pending font-semibold">{confirmedBooking.purpose.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#DDD5C8]/60">
                  <span className="text-charcoal-secondary">Appointment ID:</span>
                  <span className="font-mono font-bold">{confirmedBooking.appointmentNumber}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-charcoal-secondary">Status:</span>
                  <span className="badge badge-confirmed font-bold">{confirmedBooking.status}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setConfirmedBooking(null)}
                  className="btn-primary"
                >
                  Book Another Visit
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleBookSubmit} className="card-compact space-y-3">
              {/* Step 1: Purpose */}
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  1. Select Visit Purpose <span className="text-coffee">*</span>
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="select-field"
                >
                  <option value="NEW_LOAN">New Gold Loan Application</option>
                  <option value="GOLD_PLEDGE">Gold Pledge / Additional Collateral</option>
                  <option value="PAYMENT">Interest / Principal Cash Payment</option>
                  <option value="GOLD_RELEASE">Gold Release & Handover Collection</option>
                  <option value="DOCUMENT_SUBMISSION">Document & KYC Submission</option>
                  <option value="OTHER">Other Store Consultation</option>
                </select>
              </div>

              {/* Step 2: Date */}
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  2. Select Preferred Visit Date <span className="text-coffee">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Step 3: Available Slots Grid */}
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  3. Available Time Slots ({formatDate(selectedDate)}) <span className="text-coffee">*</span>
                </label>

                {loadingSlots ? (
                  <div className="text-center py-4 text-charcoal-secondary text-2xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin inline mr-1 text-coffee" />
                    Checking live vault & staff availability...
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {slots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`py-2 px-2.5 rounded-md text-2xs font-mono transition-all text-center ${
                            !slot.isAvailable
                              ? 'bg-[#EFE8E5] border border-[#DDD5C8] text-[#888888] cursor-not-allowed line-through opacity-60'
                              : isSelected
                              ? 'bg-[#3D2314] border-2 border-[#3D2314] text-white shadow-md ring-2 ring-[#3D2314]/30 scale-[1.03] font-bold'
                              : 'bg-white border-2 border-[#DDD5C8] text-[#222222] hover:border-[#3D2314] hover:bg-[#F8EFEA] font-semibold'
                          }`}
                        >
                          <span className={`block text-xs font-bold ${isSelected ? 'text-white' : 'text-[#222222]'}`}>
                            {slot.startTime}
                          </span>
                          <span
                            className={`block text-2xs font-sans mt-0.5 ${
                              isSelected
                                ? 'text-[#F8EFEA] font-extrabold uppercase tracking-wider'
                                : slot.isAvailable
                                ? 'text-emerald-700 font-semibold'
                                : 'text-[#888888]'
                            }`}
                          >
                            {isSelected ? '✓ Selected' : slot.isAvailable ? 'Available' : 'Booked'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-2xs rounded">
                    No slots configured for this date yet. Please select another date or contact the shop directly.
                  </div>
                )}
              </div>

              {/* Step 4: Notes */}
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  4. Additional Remarks / Special Requests (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bringing gold chain and ring for valuation"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-[#DDD5C8]">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSlotId}
                  className="btn-primary w-full sm:w-auto"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Confirming Reservation...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Your Booked Appointments List & Branch Guidelines */}
        <div className="space-y-4">
          <div className="card-compact space-y-2.5">
            <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider pb-1 border-b border-[#DDD5C8] flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-coffee" />
              Your Appointment Bookings
            </h2>

            {loadingMyAppts ? (
              <div className="text-center py-4 text-charcoal-secondary text-2xs">
                Loading your bookings...
              </div>
            ) : myAppointments.length > 0 ? (
              <div className="space-y-2">
                {myAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 bg-[#FFFDF9] border border-[#DDD5C8] rounded flex items-center justify-between gap-3 text-xs shadow-subtle hover:border-coffee/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-charcoal">
                          {apt.appointmentNumber}
                        </span>
                        <span
                          className={`badge ${
                            apt.status === 'CONFIRMED'
                              ? 'badge-confirmed'
                              : apt.status === 'COMPLETED'
                              ? 'badge-active'
                              : apt.status === 'CANCELLED'
                              ? 'badge-closed'
                              : 'badge-pending'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                      <span className="font-bold text-charcoal block mt-0.5">
                        {formatDate(apt.date)} • {apt.timeSlot}
                      </span>
                      <span className="text-2xs text-charcoal-secondary">
                        Purpose: {apt.purpose.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancelAppointment(apt.id)}
                          className="btn-danger text-2xs py-1 px-2"
                        >
                          <XCircle className="w-3 h-3" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-charcoal-secondary text-2xs">
                You have no appointment reservations on record.
              </div>
            )}
          </div>

          {/* Branch Guidelines Card */}
          <div className="card-compact bg-[#FBF8F3] space-y-2 text-2xs">
            <span className="font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5 pb-1 border-b border-[#DDD5C8]">
              <ShieldCheck className="w-3.5 h-3.5 text-coffee" /> Checklist for In-Store Visit
            </span>
            <ul className="space-y-1.5 text-charcoal-secondary list-disc pl-4">
              <li>Carry a valid government ID (Aadhaar / Voter ID / PAN).</li>
              <li>For new pledges, our certified appraiser evaluates purity in front of you.</li>
              <li>For gold release, please ensure full principal & interest settlement is completed beforehand.</li>
              <li>Arrive 5–10 minutes prior to your allocated time slot.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

