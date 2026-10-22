import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import {
  CalendarCheck,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Slot Generator Modal
  const [isSlotModalOpen, setIsSlotModalOpen] = useState<boolean>(false);
  const [genDate, setGenDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [genStart, setGenStart] = useState<string>('10:00');
  const [genEnd, setGenEnd] = useState<string>('18:00');
  const [genDuration, setGenDuration] = useState<number>(30);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genSuccessMessage, setGenSuccessMessage] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments', {
        params: {
          date: dateFilter || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          limit: 25,
        },
      });
      if (res.data?.success) {
        setAppointments(res.data.data.appointments);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [dateFilter, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      setGenSuccessMessage(null);
      const res = await api.post('/appointments/generate-slots', {
        date: genDate,
        startTime: genStart,
        endTime: genEnd,
        slotDurationMinutes: Number(genDuration),
      });

      if (res.data?.success) {
        setGenSuccessMessage(`Generated ${res.data.data.totalGenerated} slots for ${genDate}!`);
        setTimeout(() => {
          setIsSlotModalOpen(false);
          setGenSuccessMessage(null);
          setDateFilter(genDate);
          fetchAppointments();
        }, 1500);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate slots');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#DDD5C8]">
        <div>
          <h1 className="text-base font-extrabold text-charcoal tracking-tight">
            Customer Offline Appointments & Time Slots
          </h1>
          <p className="text-2xs text-charcoal-secondary">
            Manage store visit schedules for gold evaluations, pledges, counter payments, and releases
          </p>
        </div>

        <button
          onClick={() => setIsSlotModalOpen(true)}
          className="btn-primary"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Generate Availability Slots
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card-compact bg-[#FBF8F3] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-charcoal-secondary" />
          <span className="text-2xs text-charcoal-secondary font-semibold">Select Date:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field text-xs py-1 w-auto"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-charcoal-secondary" />
          <span className="text-2xs text-charcoal-secondary font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field text-xs py-1 w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>

          <button
            onClick={() => {
              setDateFilter(new Date().toISOString().split('T')[0]);
              setStatusFilter('ALL');
            }}
            className="p-1.5 text-charcoal hover:bg-[#EADCC8] rounded border border-[#DDD5C8]"
            title="Reset to Today"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="card-compact">
        <div className="overflow-x-auto">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Appointment #</th>
                <th>Time Slot</th>
                <th>Customer</th>
                <th>Purpose</th>
                <th>Customer Notes</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-charcoal-secondary">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-ferrari" />
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length > 0 ? (
                appointments.map((apt) => (
                  <tr key={apt.id}>
                    <td className="font-mono text-2xs font-bold text-charcoal">
                      {apt.appointmentNumber}
                    </td>
                    <td className="font-mono text-2xs font-semibold text-charcoal">
                      {apt.timeSlot}
                      <span className="text-charcoal-muted block text-2xs">{formatDate(apt.date)}</span>
                    </td>
                    <td>
                      <span className="font-semibold block">{apt.customer?.name}</span>
                      <span className="text-2xs text-charcoal-secondary">
                        {apt.customer?.customerId} • {apt.customer?.phone}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-pending">
                        {apt.purpose.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-2xs text-charcoal-secondary max-w-xs truncate">
                      {apt.notes || '-'}
                    </td>
                    <td>
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
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                              className="btn-success text-2xs py-0.5 px-1.5"
                              title="Mark Completed"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                              className="btn-danger text-2xs py-0.5 px-1.5"
                              title="Cancel"
                            >
                              <XCircle className="w-3 h-3" /> Cancel
                            </button>
                          </>
                        )}
                        {apt.status === 'COMPLETED' && (
                          <span className="text-2xs text-emerald-800 font-semibold">Serviced</span>
                        )}
                        {apt.status === 'CANCELLED' && (
                          <span className="text-2xs text-charcoal-muted">Cancelled</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-charcoal-secondary text-2xs">
                    No customer appointments scheduled for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Generate Availability Slots */}
      <Modal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        title="Generate Working Availability Slots"
      >
        <form onSubmit={handleGenerateSlots} className="space-y-3">
          {genSuccessMessage && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200">
              {genSuccessMessage}
            </div>
          )}

          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Date <span className="text-ferrari">*</span>
            </label>
            <input
              type="date"
              required
              value={genDate}
              onChange={(e) => setGenDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Opening Time <span className="text-ferrari">*</span>
              </label>
              <input
                type="text"
                placeholder="10:00"
                required
                value={genStart}
                onChange={(e) => setGenStart(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Closing Time <span className="text-ferrari">*</span>
              </label>
              <input
                type="text"
                placeholder="18:00"
                required
                value={genEnd}
                onChange={(e) => setGenEnd(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Slot Duration (Minutes)
            </label>
            <select
              value={genDuration}
              onChange={(e) => setGenDuration(Number(e.target.value))}
              className="select-field"
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes (Recommended)</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDD5C8]">
            <button
              type="button"
              onClick={() => setIsSlotModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="btn-primary"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {isGenerating ? 'Generating Slots...' : 'Generate Slots'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

