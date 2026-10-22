import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  Coins,
  CreditCard,
  CalendarCheck,
  RefreshCw,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/reports', {
        params: { startDate, endDate },
      });
      if (res.data?.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const exportLoansCSV = () => {
    if (!reports?.loanReport?.items) return;
    const headers = ['Loan Number,Customer Name,Phone,Sanctioned Amount,Rate,Start Date,Maturity Date,Status'];
    const rows = reports.loanReport.items.map((i: any) =>
      `"${i.loanNumber}","${i.customerName}","${i.customerPhone}",${i.amount},${i.interestRate},"${i.startDate}","${i.maturityDate}","${i.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gold_loans_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPaymentsCSV = () => {
    if (!reports?.paymentReport?.items) return;
    const headers = ['Receipt Number,Customer Name,Loan Number,Amount,Method,Type,Date'];
    const rows = reports.paymentReport.items.map((i: any) =>
      `"${i.receiptNumber}","${i.customerName}","${i.loanNumber}",${i.amount},"${i.method}","${i.type}","${i.paidAt}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payment_collections_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#DDD5C8]">
        <div>
          <h1 className="text-base font-extrabold text-charcoal tracking-tight">
            Financial & Operational Reports
          </h1>
          <p className="text-2xs text-charcoal-secondary">
            Business performance metrics, collection statements, and exportable ledger sheets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportLoansCSV} className="btn-secondary">
            <Download className="w-3.5 h-3.5 text-ferrari" />
            Export Loans CSV
          </button>
          <button onClick={exportPaymentsCSV} className="btn-secondary">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            Export Collections CSV
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="card-compact bg-[#FBF8F3]">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-charcoal-secondary" />
            <span className="text-2xs font-semibold text-charcoal">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field text-xs py-1 w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xs font-semibold text-charcoal">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field text-xs py-1 w-auto"
            />
          </div>

          <button type="submit" className="btn-primary">
            Apply Date Range
          </button>
        </form>
      </div>

      {loading && !reports ? (
        <div className="flex items-center justify-center min-h-[30vh] text-charcoal-secondary text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mr-2 text-ferrari" />
          Aggregating financial reports...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Loan Portfolio */}
            <div className="card-compact space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#DDD5C8]">
                <div className="flex items-center gap-1.5 font-bold text-xs text-charcoal uppercase">
                  <Coins className="w-3.5 h-3.5 text-ferrari" /> Loan Sanction Portfolio
                </div>
              </div>
              <div className="text-lg font-extrabold text-charcoal">
                {formatCurrency(reports?.loanReport?.totalDisbursed)}
              </div>
              <div className="text-2xs text-charcoal-secondary space-y-1">
                <div className="flex justify-between">
                  <span>New Loans Sanctioned:</span>
                  <span className="font-bold">{reports?.loanReport?.totalLoansCreated}</span>
                </div>
                <div className="flex justify-between">
                  <span>Currently Active:</span>
                  <span className="font-bold text-emerald-700">{reports?.loanReport?.activeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Settled & Closed:</span>
                  <span className="font-bold text-charcoal-muted">{reports?.loanReport?.closedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue Accounts:</span>
                  <span className="font-bold text-ferrari">{reports?.loanReport?.overdueCount}</span>
                </div>
              </div>
            </div>

            {/* Collection Performance */}
            <div className="card-compact space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#DDD5C8]">
                <div className="flex items-center gap-1.5 font-bold text-xs text-charcoal uppercase">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-700" /> Revenue & Collections
                </div>
              </div>
              <div className="text-lg font-extrabold text-emerald-800">
                {formatCurrency(reports?.paymentReport?.totalCollections)}
              </div>
              <div className="text-2xs text-charcoal-secondary space-y-1">
                <div className="flex justify-between">
                  <span>Online Digital (UPI/Card):</span>
                  <span className="font-bold">{formatCurrency(reports?.paymentReport?.totalOnline)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shop Counter Cash:</span>
                  <span className="font-bold">{formatCurrency(reports?.paymentReport?.totalOffline)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Payments Cleared:</span>
                  <span className="font-bold">{reports?.paymentReport?.totalCount}</span>
                </div>
              </div>
            </div>

            {/* Appointments Serviced */}
            <div className="card-compact space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#DDD5C8]">
                <div className="flex items-center gap-1.5 font-bold text-xs text-charcoal uppercase">
                  <CalendarCheck className="w-3.5 h-3.5 text-blue-700" /> Appointment Operations
                </div>
              </div>
              <div className="text-lg font-extrabold text-charcoal">
                {reports?.appointmentReport?.totalAppointments} Booked
              </div>
              <div className="text-2xs text-charcoal-secondary space-y-1">
                <div className="flex justify-between">
                  <span>Serviced / Completed:</span>
                  <span className="font-bold text-emerald-700">
                    {reports?.appointmentReport?.completedCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Confirmed & Upcoming:</span>
                  <span className="font-bold text-blue-700">
                    {reports?.appointmentReport?.confirmedCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cancelled:</span>
                  <span className="font-bold text-charcoal-muted">
                    {reports?.appointmentReport?.cancelledCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>No Shows:</span>
                  <span className="font-bold text-ferrari">
                    {reports?.appointmentReport?.noShowCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Loans in Range Table */}
          <div className="card-compact">
            <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider pb-1 mb-2 border-b border-[#DDD5C8]">
              Loans Sanctioned During Period
            </h3>

            <div className="overflow-x-auto">
              <table className="table-compact">
                <thead>
                  <tr>
                    <th>Loan Number</th>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Sanction Amount</th>
                    <th>Rate</th>
                    <th>Start Date</th>
                    <th>Maturity Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports?.loanReport?.items && reports.loanReport.items.length > 0 ? (
                    reports.loanReport.items.map((i: any, idx: number) => (
                      <tr key={idx}>
                        <td className="font-mono text-2xs font-bold text-ferrari">{i.loanNumber}</td>
                        <td className="font-semibold">{i.customerName}</td>
                        <td className="font-mono text-2xs">{i.customerPhone}</td>
                        <td className="font-bold">{formatCurrency(i.amount)}</td>
                        <td>{i.interestRate}%</td>
                        <td className="text-2xs font-mono">{i.startDate}</td>
                        <td className="text-2xs font-mono">{i.maturityDate}</td>
                        <td>
                          <span
                            className={`badge ${
                              i.status === 'ACTIVE'
                                ? 'badge-active'
                                : i.status === 'OVERDUE'
                                ? 'badge-overdue'
                                : 'badge-closed'
                            }`}
                          >
                            {i.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-charcoal-secondary text-2xs">
                        No loans created during this specific date window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

