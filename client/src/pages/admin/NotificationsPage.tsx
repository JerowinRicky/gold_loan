import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import {
  Bell,
  Send,
  User,
  CheckCircle2,
  AlertTriangle,
  CalendarCheck,
  Coins,
  RefreshCw,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [title, setTitle] = useState<string>('Payment Due Reminder');
  const [message, setMessage] = useState<string>('Your monthly interest payment is due. Please pay online or visit our shop counter.');
  const [type, setType] = useState<string>('PAYMENT_REMINDER');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Recent sent notices
  const [sentNotices, setSentNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [custRes, myNotifsRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/notifications/my'),
      ]);
      if (custRes.data?.success) {
        setCustomers(custRes.data.data.customers);
        if (custRes.data.data.customers.length > 0) {
          setSelectedCustomerId(custRes.data.data.customers[0].id);
        }
      }
      if (myNotifsRes.data?.success) {
        setSentNotices(myNotifsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load notifications data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    try {
      setIsSending(true);
      setSuccessMsg(null);
      const res = await api.post('/notifications/send', {
        userId: selectedCustomerId,
        title,
        message,
        type,
      });

      if (res.data?.success) {
        setSuccessMsg('Notification successfully dispatched to customer!');
        setMessage('');
        fetchInitialData();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-2 border-b border-[#DDD5C8]">
        <h1 className="text-base font-extrabold text-charcoal tracking-tight">
          Customer Notification Dispatch & Communication
        </h1>
        <p className="text-2xs text-charcoal-secondary">
          Send automated or personalized payment due reminders, loan updates, and appointment notices
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Send Notification Form */}
        <div className="lg:col-span-1 card-compact space-y-3">
          <div className="flex items-center gap-1.5 pb-1 border-b border-[#DDD5C8]">
            <Send className="w-3.5 h-3.5 text-ferrari" />
            <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              Send Alert to Customer
            </h2>
          </div>

          {successMsg && (
            <div className="p-2 bg-emerald-50 text-emerald-800 text-2xs rounded border border-emerald-200">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSendNotification} className="space-y-3">
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Recipient Customer <span className="text-ferrari">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="select-field"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerId ? `[${c.customerId}] ` : ''}{c.name} • {c.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Notice Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="select-field"
              >
                <option value="PAYMENT_REMINDER">Payment Due Reminder</option>
                <option value="PAYMENT_SUCCESS">Payment Confirmation</option>
                <option value="APPOINTMENT">Appointment Notice</option>
                <option value="LOAN_UPDATE">Loan Contract Update</option>
                <option value="GENERAL">General Announcement</option>
              </select>
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Notification Subject / Title <span className="text-ferrari">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Message Body <span className="text-ferrari">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-field"
                placeholder="e.g. Your next monthly interest of ₹2,500 is due on 10 November."
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="btn-primary w-full"
            >
              <Send className="w-3.5 h-3.5" />
              {isSending ? 'Sending Alert...' : 'Deliver Notification'}
            </button>
          </form>
        </div>

        {/* Quick Template Presets & Recent Notification Feed */}
        <div className="lg:col-span-2 space-y-3">
          {/* Presets */}
          <div className="card-compact bg-[#FBF8F3]">
            <h3 className="text-2xs font-bold text-charcoal uppercase tracking-wider mb-2">
              Quick Reminder Templates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
              <button
                type="button"
                onClick={() => {
                  setTitle('Monthly Interest Due');
                  setMessage('Friendly reminder: Your gold loan interest payment is due this week. You can make an instant online payment via UPI or visit our shop.');
                  setType('PAYMENT_REMINDER');
                }}
                className="p-2 bg-white border border-[#DDD5C8] rounded text-left hover:border-ferrari transition-colors"
              >
                <span className="font-bold text-charcoal block">Monthly Interest Due</span>
                <span className="text-charcoal-secondary text-2xs">Reminder for upcoming interest schedule</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTitle('Overdue Loan Notice');
                  setMessage('Urgent notice: Your gold loan account has overdue unpaid charges. Please settle immediately to prevent penal charges on your collateral.');
                  setType('PAYMENT_REMINDER');
                }}
                className="p-2 bg-white border border-[#DDD5C8] rounded text-left hover:border-ferrari transition-colors"
              >
                <span className="font-bold text-ferrari block">Urgent Overdue Notice</span>
                <span className="text-charcoal-secondary text-2xs">Penal interest warning for overdue loans</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTitle('Gold Release Available');
                  setMessage('Good news! Your gold loan is fully paid. Your physical jewelry is ready for inspection and collection at our shop vault.');
                  setType('LOAN_UPDATE');
                }}
                className="p-2 bg-white border border-[#DDD5C8] rounded text-left hover:border-ferrari transition-colors"
              >
                <span className="font-bold text-emerald-800 block">Gold Release Notice</span>
                <span className="text-charcoal-secondary text-2xs">Inform borrower their jewelry is ready</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTitle('Appointment Reminder');
                  setMessage('This is a reminder for your upcoming gold appointment today at Sri Lakshmi Gold Finance.');
                  setType('APPOINTMENT');
                }}
                className="p-2 bg-white border border-[#DDD5C8] rounded text-left hover:border-ferrari transition-colors"
              >
                <span className="font-bold text-charcoal block">Appointment Reminder</span>
                <span className="text-charcoal-secondary text-2xs">Confirm customer slot arrival</span>
              </button>
            </div>
          </div>

          {/* System Notifications List */}
          <div className="card-compact">
            <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider pb-1 mb-2 border-b border-[#DDD5C8]">
              Recent Communications Log
            </h3>

            <div className="space-y-2">
              {sentNotices.length > 0 ? (
                sentNotices.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 bg-white border border-[#DDD5C8] rounded text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-charcoal">{n.title}</span>
                      <span className="badge badge-pending">{n.type}</span>
                    </div>
                    <p className="text-charcoal-secondary text-2xs">{n.message}</p>
                    <span className="text-2xs text-charcoal-muted block font-mono">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-charcoal-secondary text-2xs">
                  No notifications recorded in history.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

