import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CustomerDashboardData } from '../../types';
import { formatCurrency, formatDate, formatDateTime, formatWeight } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { CustomerPaymentModal } from '../../components/common/CustomerPaymentModal';
import { PWAInstallBanner } from '../../components/common/PWAInstallBanner';
import {
  Coins,
  CreditCard,
  CalendarCheck,
  Gem,
  ArrowRight,
  Receipt,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Online Pay Now Modal
  const [isPayNowModalOpen, setIsPayNowModalOpen] = useState<boolean>(false);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/customer-dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load customer dashboard:', err);
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
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to view receipt:', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-charcoal-secondary text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-ferrari" />
        Loading your gold loan portfolio...
      </div>
    );
  }

  const activeLoan = data?.activeLoan;

  return (
    <div className="space-y-4 w-full">
      {/* PWA Chrome Install Banner */}
      <PWAInstallBanner />

      {/* Greeting Header */}
      <div className="flex items-center justify-between pb-1 border-b border-[#DDD5C8]/80">
        <div>
          <span className="text-2xs font-semibold text-charcoal-secondary uppercase tracking-wider block">
            Welcome Back
          </span>
          <h1 className="text-lg font-extrabold text-charcoal tracking-tight">
            Hello, {user?.name}
          </h1>
        </div>

        <div className="text-right">
          <span className="text-2xs font-mono font-bold text-coffee bg-[#EADCC8] px-2 py-0.5 rounded border border-[#DDD5C8]">
            {user?.customerId || 'CUST'}
          </span>
          <span className="text-2xs text-charcoal-secondary block mt-0.5">
            {user?.phone}
          </span>
        </div>
      </div>

      {/* Main Full-Width Grid: 2 cols for Financials, 1 col for Actions & Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left & Center: Financials, Collateral & Ledger (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Primary Card: Active Gold Loan */}
          {activeLoan ? (
            <div className="card-compact bg-gradient-to-br from-[#FFFDF9] to-[#F8F4ED] border-[#DDD5C8] shadow-card space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#DDD5C8]/70">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-coffee" />
                  <span className="text-2xs font-extrabold text-charcoal uppercase tracking-wider">
                    Active Gold Loan
                  </span>
                </div>
                <span className="font-mono text-2xs font-bold text-coffee">
                  {activeLoan.loanNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-1">
                <div>
                  <span className="text-2xs text-charcoal-secondary block">Sanctioned Amount</span>
                  <span className="text-base font-extrabold text-charcoal">
                    {formatCurrency(activeLoan.loanAmount)}
                  </span>
                  <span className="text-2xs text-charcoal-muted font-mono block">
                    {activeLoan.interestRate}% monthly interest
                  </span>
                </div>

                <div>
                  <span className="text-2xs text-charcoal-secondary block">Total Outstanding</span>
                  <span className="text-base font-extrabold text-coffee">
                    {formatCurrency(activeLoan.financials?.totalOutstanding)}
                  </span>
                  <span className="text-2xs text-charcoal-muted font-mono block">
                    Principal: {formatCurrency(activeLoan.financials?.outstandingPrincipal)}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-2xs text-charcoal-secondary block">Accrued Interest</span>
                  <span className="text-base font-bold text-amber-900">
                    {formatCurrency(activeLoan.financials?.accumulatedInterest)}
                  </span>
                  <span className="text-2xs text-charcoal-muted font-mono block">
                    Matures: {formatDate(activeLoan.maturityDate)}
                  </span>
                </div>
              </div>

              {/* Next Due Section */}
              <div className="p-3 bg-[#fff4f1] border border-[#DDD5C8] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-2xs font-semibold text-charcoal-secondary uppercase tracking-wider block">
                    Next Monthly Due
                  </span>
                  <span className="text-base font-extrabold text-charcoal">
                    {formatCurrency(activeLoan.financials?.nextPaymentAmount)}
                  </span>
                  <span className="text-2xs text-charcoal-muted block">
                    Schedule Period: Monthly Interest Servicing
                  </span>
                </div>

                {Number(activeLoan.financials?.totalOutstanding) > 0 ? (
                  <button
                    onClick={() => setIsPayNowModalOpen(true)}
                    className="btn-primary text-xs font-bold py-2 px-5 shadow-sm self-start sm:self-auto"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    PAY NOW
                  </button>
                ) : (
                  <div className="text-right">
                    <span className="badge badge-active font-bold">Loan Settled</span>
                    <span className="text-2xs text-charcoal-secondary block mt-0.5">
                      Ready for gold release
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card-compact text-center py-6 space-y-2">
              <Coins className="w-8 h-8 mx-auto text-charcoal-subtle" />
              <h2 className="text-xs font-bold text-charcoal">No Active Loan Accounts</h2>
              <p className="text-2xs text-charcoal-secondary max-w-xs mx-auto">
                You do not have any active gold pledges currently. You can book an appointment to evaluate your jewelry and avail an instant loan.
              </p>
              <Link to="/appointments" className="btn-primary text-2xs inline-flex mt-1">
                Book Evaluation Appointment
              </Link>
            </div>
          )}

          {/* Gold Pledged Section */}
          <div className="card-compact space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#DDD5C8]">
              <div className="flex items-center gap-1.5">
                <Gem className="w-3.5 h-3.5 text-amber-700" />
                <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                  Your Pledged Gold Ornaments
                </h2>
              </div>
              <span className="text-2xs text-charcoal-muted flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-700" /> Insured Vault Custody
              </span>
            </div>

            {data?.goldItems && data.goldItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {data.goldItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-[#FFFDF9] border border-[#DDD5C8] rounded flex items-center gap-2.5 shadow-subtle hover:border-coffee/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded border border-[#DDD5C8] bg-black/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0].fileUrl}
                          alt={item.description}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Gem className="w-5 h-5 text-amber-700/60" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-xs text-charcoal truncate block">
                        {item.itemType}
                      </span>
                      <div className="text-2xs font-mono text-charcoal-secondary mt-0.5">
                        {formatWeight(item.netWeight)} • {item.purity}
                      </div>
                      <span className="text-2xs text-emerald-800 font-medium block">
                        {formatCurrency(item.estimatedValue)} Val.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-charcoal-secondary text-2xs">
                No pledged jewelry currently in vault.
              </div>
            )}
          </div>

          {/* Recent Payments Section */}
          <div className="card-compact space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#DDD5C8]">
              <div className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                  Recent Payment Receipts
                </h2>
              </div>
              <Link to="/payments" className="text-2xs font-semibold text-coffee hover:underline">
                Full Ledger
              </Link>
            </div>

            {data?.recentPayments && data.recentPayments.length > 0 ? (
              <div className="divide-y divide-[#DDD5C8]/70">
                {data.recentPayments.map((p) => (
                  <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-2xs font-bold text-charcoal">
                          {p.receiptNumber}
                        </span>
                        <span className="text-2xs uppercase text-charcoal-secondary font-medium">
                          • {p.paymentMethod}
                        </span>
                      </div>
                      <span className="text-2xs text-charcoal-muted font-mono block">
                        {formatDate(p.paidAt || p.createdAt)}
                      </span>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="font-bold text-charcoal">
                        {formatCurrency(p.amount)}
                      </span>
                      <button
                        onClick={() => handleViewReceipt(p.receiptNumber)}
                        className="btn-secondary text-2xs py-0.5 px-2"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-charcoal-secondary text-2xs">
                No payments on record yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Upcoming Appointments & Branch Assistance */}
        <div className="space-y-4">
          {/* Upcoming Appointment Card */}
          <div className="card-compact space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#DDD5C8]">
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-blue-700" />
                <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                  Store Appointment
                </h2>
              </div>
              <Link to="/appointments" className="text-2xs font-semibold text-coffee hover:underline">
                Book Slot
              </Link>
            </div>

            {data?.upcomingAppointment ? (
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-charcoal font-mono">
                    {data.upcomingAppointment.appointmentNumber}
                  </span>
                  <span className="badge badge-confirmed">
                    {data.upcomingAppointment.status}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-charcoal text-sm block">
                    {formatDate(data.upcomingAppointment.date)} • {data.upcomingAppointment.timeSlot}
                  </span>
                  <span className="text-2xs text-charcoal-secondary block mt-0.5">
                    Purpose: {data.upcomingAppointment.purpose.replace('_', ' ')}
                  </span>
                </div>

                <Link
                  to="/appointments"
                  className="btn-secondary text-2xs py-1 px-2.5 text-center mt-1"
                >
                  Manage Appointment
                </Link>
              </div>
            ) : (
              <div className="py-3 text-center space-y-2 text-2xs text-charcoal-secondary">
                <p>No upcoming store appointments scheduled.</p>
                <Link to="/appointments" className="btn-secondary text-2xs w-full py-1.5 justify-center">
                  Book In-Store Visit
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions & Store Assistance */}
          <div className="card-compact bg-[#FBF8F3] space-y-3">
            <div className="pb-1 border-b border-[#DDD5C8]">
              <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-coffee" /> Branch & Vault Support
              </h2>
            </div>

            <div className="space-y-2 text-2xs text-charcoal">
              <div className="p-2 bg-[#FFFDF9] border border-[#DDD5C8] rounded">
                <span className="font-bold block text-coffee">Sri Lakshmi Gold Finance</span>
                <span className="text-charcoal-secondary block">Main Branch: 124 Market Street, Near Clock Tower</span>
                <span className="text-charcoal-secondary block mt-0.5">Hours: Mon - Sat, 10:00 AM - 7:00 PM</span>
              </div>

              <div className="p-2 bg-[#FFFDF9] border border-[#DDD5C8] rounded space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-secondary">Support Desk:</span>
                  <span className="font-bold font-mono">+91 98765 43210</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-secondary">Collateral Vault:</span>
                  <span className="text-emerald-800 font-semibold">100% Insured</span>
                </div>
              </div>

              <div className="pt-1 flex flex-col gap-1.5">
                <Link
                  to="/loans"
                  className="btn-secondary text-2xs py-1 px-2 justify-between w-full"
                >
                  <span>View All Loan Schedules</span>
                  <ArrowRight className="w-3 h-3 text-charcoal-secondary" />
                </Link>
                <Link
                  to="/profile"
                  className="btn-secondary text-2xs py-1 px-2 justify-between w-full"
                >
                  <span>Update Profile & Password</span>
                  <ArrowRight className="w-3 h-3 text-charcoal-secondary" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Payment Modal (Only UPI Screenshot Verification & Doorstep Cash Collection) */}
      <CustomerPaymentModal
        isOpen={isPayNowModalOpen}
        onClose={() => setIsPayNowModalOpen(false)}
        loan={activeLoan}
        onSuccess={() => {
          fetchDashboard();
        }}
      />

      {/* Official Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
};

