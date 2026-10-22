import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { AdminDashboardData } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { PWAInstallBanner } from '../../components/common/PWAInstallBanner';
import {
  Coins,
  TrendingUp,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  PlusCircle,
  Receipt,
  UserPlus,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/admin-dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleViewReceipt = async (receiptNumber: string) => {
    try {
      const res = await api.get(`/payments/receipt/${receiptNumber}`);
      if (res.data?.success) {
        setSelectedReceipt(res.data.data);
        setIsReceiptOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch receipt:', err);
    }
  };

  const handleUpdateAppointmentStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-charcoal-secondary text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-ferrari" />
        Loading live operations dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PWA Banner */}
      <PWAInstallBanner />

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#DDD5C8]">
        <div>
          <h1 className="text-base font-extrabold text-charcoal tracking-tight">
            Shop Operations & Loan Summary
          </h1>
          <p className="text-2xs text-charcoal-secondary">
            Today is {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/loans/create" className="btn-primary">
            <PlusCircle className="w-3.5 h-3.5" />
            New Gold Loan
          </Link>
          <Link to="/admin/customers/create" className="btn-secondary">
            <UserPlus className="w-3.5 h-3.5" />
            Add Customer
          </Link>
          <button
            onClick={fetchDashboardData}
            className="p-1.5 text-charcoal hover:bg-[#EADCC8] border border-[#DDD5C8] rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5 Compact Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {/* Active Loans */}
        <div className="card-compact">
          <div className="flex items-center justify-between text-charcoal-secondary text-2xs font-semibold mb-1">
            <span>ACTIVE LOANS</span>
            <Coins className="w-3.5 h-3.5 text-ferrari" />
          </div>
          <div className="text-lg font-extrabold text-charcoal leading-none">
            {data?.stats.activeLoansCount || 0}
          </div>
          <div className="text-2xs text-charcoal-muted mt-1">
            Total active collateral pledges
          </div>
        </div>

        {/* Total Loan Amount */}
        <div className="card-compact">
          <div className="flex items-center justify-between text-charcoal-secondary text-2xs font-semibold mb-1">
            <span>TOTAL LENT</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-lg font-extrabold text-charcoal leading-none">
            {formatCurrency(data?.stats.totalLentAmount)}
          </div>
          <div className="text-2xs text-charcoal-muted mt-1">
            Out: {formatCurrency(data?.stats.totalOutstandingAmount)}
          </div>
        </div>

        {/* Today's Collections */}
        <div className="card-compact">
          <div className="flex items-center justify-between text-charcoal-secondary text-2xs font-semibold mb-1">
            <span>TODAY'S COLLECTIONS</span>
            <Receipt className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-lg font-extrabold text-emerald-700 leading-none">
            {formatCurrency(data?.stats.todayCollectionsAmount)}
          </div>
          <div className="text-2xs text-charcoal-muted mt-1">
            Cash & UPI received today
          </div>
        </div>

        {/* Overdue Loans */}
        <div className="card-compact">
          <div className="flex items-center justify-between text-charcoal-secondary text-2xs font-semibold mb-1">
            <span>OVERDUE LOANS</span>
            <AlertCircle className="w-3.5 h-3.5 text-ferrari" />
          </div>
          <div className="text-lg font-extrabold text-ferrari leading-none">
            {data?.stats.overdueCount || 0}
          </div>
          <div className="text-2xs text-charcoal-muted mt-1">
            Require follow-up notice
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="card-compact col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-charcoal-secondary text-2xs font-semibold mb-1">
            <span>APPOINTMENTS</span>
            <CalendarCheck className="w-3.5 h-3.5 text-blue-700" />
          </div>
          <div className="text-lg font-extrabold text-charcoal leading-none">
            {data?.stats.todayAppointmentsCount || 0}
          </div>
          <div className="text-2xs text-charcoal-muted mt-1">
            Slots booked for today
          </div>
        </div>
      </div>

      {/* Grid: Today's Appointments & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section: Today's Appointments */}
        <div className="card-compact">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDD5C8]">
            <div className="flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-ferrari" />
              <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                Today's Appointments
              </h2>
            </div>
            <Link to="/admin/appointments" className="text-2xs font-semibold text-ferrari hover:underline">
              View All Slots
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.todayAppointments && data.todayAppointments.length > 0 ? (
                  data.todayAppointments.map((apt) => (
                    <tr key={apt.id}>
                      <td className="font-mono text-2xs font-semibold">{apt.timeSlot}</td>
                      <td>
                        <span className="font-semibold block">{apt.customer?.name}</span>
                        <span className="text-2xs text-charcoal-secondary">{apt.customer?.phone}</span>
                      </td>
                      <td>
                        <span className="badge badge-pending">
                          {apt.purpose.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            apt.status === 'CONFIRMED'
                              ? 'badge-confirmed'
                              : apt.status === 'COMPLETED'
                              ? 'badge-active'
                              : 'badge-pending'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' ? (
                          <button
                            onClick={() => handleUpdateAppointmentStatus(apt.id, 'COMPLETED')}
                            className="btn-success text-2xs py-0.5 px-1.5"
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Done
                          </button>
                        ) : (
                          <span className="text-2xs text-charcoal-muted">Finished</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-charcoal-secondary text-2xs">
                      No appointments booked for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section: Recent Payments */}
        <div className="card-compact">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDD5C8]">
            <div className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                Recent Payments
              </h2>
            </div>
            <Link to="/admin/payments" className="text-2xs font-semibold text-ferrari hover:underline">
              All Transactions
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Loan ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th className="text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentPayments && data.recentPayments.length > 0 ? (
                  data.recentPayments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="font-semibold block">{p.customer?.name}</span>
                        <span className="text-2xs text-charcoal-secondary">{p.customer?.phone}</span>
                      </td>
                      <td className="font-mono text-2xs font-bold text-ferrari">
                        {p.loan?.loanNumber}
                      </td>
                      <td className="font-bold text-charcoal">
                        {formatCurrency(p.amount)}
                      </td>
                      <td>
                        <span className="text-2xs uppercase font-medium bg-[#EADCC8] px-1.5 py-0.5 rounded">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="text-2xs text-charcoal-secondary font-mono">
                        {formatDateTime(p.paidAt || p.createdAt)}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleViewReceipt(p.receiptNumber)}
                          className="btn-secondary text-2xs py-0.5 px-1.5"
                          title="View Receipt"
                        >
                          <Receipt className="w-3 h-3 text-ferrari" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-charcoal-secondary text-2xs">
                      No recent payment transactions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section: Overdue Loans */}
      <div className="card-compact">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDD5C8]">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-ferrari" />
            <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              Overdue Loans Requiring Attention
            </h2>
          </div>
          <span className="text-2xs text-charcoal-muted">
            Interest or maturity past scheduled date
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Loan Number</th>
                <th>Due Date</th>
                <th>Outstanding Due</th>
                <th>Days Overdue</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.overdueLoans && data.overdueLoans.length > 0 ? (
                data.overdueLoans.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span className="font-semibold block">{l.customerName}</span>
                      <span className="text-2xs text-charcoal-secondary">{l.customerPhone}</span>
                    </td>
                    <td className="font-mono text-2xs font-bold text-ferrari">
                      {l.loanNumber}
                    </td>
                    <td className="text-2xs font-mono text-charcoal">
                      {new Date(l.dueDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="font-bold text-ferrari">
                      {formatCurrency(l.outstandingAmount)}
                    </td>
                    <td>
                      <span className="badge badge-overdue">
                        {l.daysOverdue} Days
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/admin/loans/${l.id}`}
                        className="btn-primary text-2xs py-0.5 px-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Manage Loan
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-emerald-800 text-2xs">
                    All gold loans are currently up to date! Zero overdue loans.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
};

