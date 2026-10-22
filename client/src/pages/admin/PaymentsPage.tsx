import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { Modal } from '../../components/common/Modal';
import {
  CreditCard,
  Search,
  Filter,
  PlusCircle,
  Receipt,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Image,
  Eye,
  Check,
  AlertCircle,
  MapPin,
  Clock,
  Phone,
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [method, setMethod] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Pending Approvals count for alert badge
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Verification & Approval Modals
  const [selectedScreenshot, setSelectedScreenshot] = useState<{ url: string; payment: any } | null>(null);
  const [approvingPayment, setApprovingPayment] = useState<any | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [rejectingPayment, setRejectingPayment] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Quick Offline Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number>(1000);
  const [payType, setPayType] = useState<string>('INTEREST_ONLY');
  const [payMethod, setPayMethod] = useState<string>('CASH');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments', {
        params: { search, method, status, page, limit: 12 },
      });
      if (res.data?.success) {
        setPayments(res.data.data.payments);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalCount(res.data.data.pagination.total);
      }

      // Also check pending count
      const pendingRes = await api.get('/payments', {
        params: { status: 'PENDING', limit: 1 },
      });
      if (pendingRes.data?.success) {
        setPendingCount(pendingRes.data.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, method, status]);

  const handleApprove = async () => {
    if (!approvingPayment) return;
    try {
      setIsProcessingAction(true);
      const res = await api.post('/payments/approve', {
        paymentId: approvingPayment.id,
        notes: approvalNotes || undefined,
      });
      if (res.data?.success) {
        setApprovingPayment(null);
        setSelectedScreenshot(null);
        setApprovalNotes('');
        fetchPayments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve payment');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingPayment) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejecting this payment.');
      return;
    }
    try {
      setIsProcessingAction(true);
      const res = await api.post('/payments/reject', {
        paymentId: rejectingPayment.id,
        rejectionReason: rejectionReason.trim(),
      });
      if (res.data?.success) {
        setRejectingPayment(null);
        setSelectedScreenshot(null);
        setRejectionReason('');
        fetchPayments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject payment');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const handleOpenRecordModal = async () => {
    try {
      const res = await api.get('/loans?status=ACTIVE&limit=100');
      if (res.data?.success) {
        setLoans(res.data.data.loans);
        if (res.data.data.loans.length > 0) {
          setSelectedLoanId(res.data.data.loans[0].id);
          setPayAmount(Number(res.data.data.loans[0].financials?.nextPaymentAmount || 1000));
        }
      }
      setIsRecordModalOpen(true);
    } catch (err) {
      console.error('Failed to load loans:', err);
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) return;
    try {
      setIsRecording(true);
      const res = await api.post('/payments/record-offline', {
        loanId: selectedLoanId,
        amount: Number(payAmount),
        paymentType: payType,
        paymentMethod: payMethod,
        referenceNumber: payRef || undefined,
        notes: payNotes || undefined,
      });

      if (res.data?.success) {
        setIsRecordModalOpen(false);
        const receiptRes = await api.get(`/payments/receipt/${res.data.data.receiptNumber}`);
        if (receiptRes.data?.success) {
          setSelectedReceipt(receiptRes.data.data);
          setIsReceiptModalOpen(true);
        }
        fetchPayments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record offline payment');
    } finally {
      setIsRecording(false);
    }
  };

  const handleViewReceipt = async (receiptNumber: string) => {
    try {
      const res = await api.get(`/payments/receipt/${receiptNumber}`);
      if (res.data?.success) {
        setSelectedReceipt(res.data.data);
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load receipt:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs & Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDD5C8] pb-1">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'PENDING', label: 'Pending Approvals', count: pendingCount },
            { id: 'SUCCESS', label: 'Approved & Completed' },
            { id: 'FAILED', label: 'Rejected' },
          ].map((tab) => {
            const isActive = status === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatus(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-coffee text-white shadow-subtle'
                    : 'bg-[#FFFDF9] text-charcoal border border-[#DDD5C8] hover:bg-[#EADCC8]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-2xs font-bold ${
                      isActive ? 'bg-white text-coffee' : 'bg-coffee text-white'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button onClick={handleOpenRecordModal} className="btn-primary">
          <PlusCircle className="w-3.5 h-3.5" />
          Record Counter Payment
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="card-compact bg-[#FBF8F3] flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-charcoal-subtle" />
            <input
              type="text"
              placeholder="Search by receipt # (RCP-...), loan ID, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-8"
            />
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-charcoal-secondary" />
          <span className="text-2xs text-charcoal-secondary font-medium">Method:</span>
          <select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setPage(1);
            }}
            className="select-field w-auto text-xs py-1"
          >
            <option value="ALL">All Methods</option>
            <option value="CASH">Cash Counter</option>
            <option value="UPI">UPI / QR</option>
            <option value="CARD">Debit / Credit Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setMethod('ALL');
              setPage(1);
              fetchPayments();
            }}
            className="p-1.5 text-charcoal hover:bg-[#EADCC8] rounded border border-[#DDD5C8]"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card-compact">
        <div className="overflow-x-auto">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Loan Number</th>
                <th>Customer</th>
                <th>Amount Paid</th>
                <th>Category</th>
                <th>Method</th>
                <th>Reference / UTR</th>
                <th>Received By</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-6 text-charcoal-secondary">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-coffee" />
                    Loading payment records...
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => {
                  const isPending = p.status === 'PENDING';
                  return (
                    <tr
                      key={p.id}
                      className={isPending ? 'bg-amber-50/40 hover:bg-amber-50/70 transition-colors' : ''}
                    >
                      <td className="font-mono text-2xs font-bold text-charcoal">
                        {p.receiptNumber}
                      </td>
                      <td className="font-mono text-2xs font-bold text-coffee">
                        {p.loan?.loanNumber}
                      </td>
                      <td>
                        <span className="font-semibold block">{p.customer?.name}</span>
                        <span className="text-2xs text-charcoal-secondary">{p.customer?.phone}</span>
                      </td>
                      <td className="font-bold text-charcoal">
                        {formatCurrency(p.amount)}
                      </td>
                      <td>
                        <span className="text-2xs text-charcoal-secondary font-medium">
                          {p.paymentType.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.paymentMethod === 'UPI'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : p.paymentMethod === 'CASH'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'badge-pending'
                          } uppercase`}
                        >
                          {p.paymentMethod}
                        </span>
                        {p.paymentMethod === 'CASH' && p.collectionSlot && (
                          <div className="text-2xs text-charcoal-secondary mt-0.5 max-w-[140px] truncate" title={p.collectionAddress}>
                            <Clock className="w-2.5 h-2.5 inline mr-0.5 text-coffee" />
                            {p.collectionSlot}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="space-y-1">
                          <span className="text-2xs font-mono text-charcoal-muted max-w-xs truncate block">
                            {p.referenceNumber || p.gatewayPaymentId || '-'}
                          </span>
                          {p.screenshotUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedScreenshot({ url: p.screenshotUrl, payment: p })}
                              className="inline-flex items-center gap-1 text-2xs font-semibold text-coffee hover:underline"
                            >
                              <Image className="w-3 h-3" />
                              View Proof
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-2xs text-charcoal">
                        {p.receivedBy || (isPending ? 'Awaiting Verification' : 'Online')}
                      </td>
                      <td className="text-2xs font-mono text-charcoal-secondary">
                        {formatDateTime(p.paidAt || p.createdAt)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.status === 'SUCCESS'
                              ? 'badge-active'
                              : p.status === 'PENDING'
                              ? 'badge-pending font-bold'
                              : 'badge-overdue'
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.status === 'FAILED' && p.rejectionReason && (
                          <span className="block text-2xs text-coffee mt-0.5 max-w-[120px] truncate" title={p.rejectionReason}>
                            {p.rejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {p.screenshotUrl && (
                              <button
                                onClick={() => setSelectedScreenshot({ url: p.screenshotUrl, payment: p })}
                                className="btn-secondary text-2xs py-1 px-1.5"
                                title="View Screenshot"
                              >
                                <Eye className="w-3 h-3 text-coffee" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setApprovingPayment(p);
                                setApprovalNotes('');
                              }}
                              className="btn-success text-2xs py-1 px-2 font-bold"
                              title={p.paymentMethod === 'CASH' ? 'Confirm Cash Collected' : 'Approve UPI Payment'}
                            >
                              <Check className="w-3 h-3" />
                              {p.paymentMethod === 'CASH' ? 'Collected' : 'Approve'}
                            </button>
                            <button
                              onClick={() => {
                                setRejectingPayment(p);
                                setRejectionReason('');
                              }}
                              className="btn-danger text-2xs py-1 px-2"
                              title="Reject Payment"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        ) : p.status === 'SUCCESS' ? (
                          <button
                            onClick={() => handleViewReceipt(p.receiptNumber)}
                            className="btn-secondary text-2xs py-0.5 px-2"
                          >
                            <Receipt className="w-3 h-3 text-coffee" />
                            Receipt
                          </button>
                        ) : (
                          <span className="text-2xs text-charcoal-muted">Rejected</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="text-center py-6 text-charcoal-secondary text-2xs">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#DDD5C8] text-2xs text-charcoal-secondary">
            <span>
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary text-2xs py-1 px-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="btn-secondary text-2xs py-1 px-2 disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Counter Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Payment at Shop Counter"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-3">
          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Select Active Gold Loan Account <span className="text-ferrari">*</span>
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => {
                const lid = e.target.value;
                setSelectedLoanId(lid);
                const found = loans.find((l) => l.id === lid);
                if (found) {
                  setPayAmount(Number(found.financials?.nextPaymentAmount || 1000));
                }
              }}
              className="select-field"
            >
              {loans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.loanNumber} • {l.customer?.name} (Out: ₹{l.financials?.totalOutstanding})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Payment Amount (₹) <span className="text-ferrari">*</span>
            </label>
            <input
              type="number"
              step="50"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="input-field font-bold text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Payment Type
              </label>
              <select
                value={payType}
                onChange={(e) => setPayType(e.target.value)}
                className="select-field"
              >
                <option value="INTEREST_ONLY">Interest Only</option>
                <option value="PRINCIPAL_PARTIAL">Partial Principal</option>
                <option value="FULL_SETTLEMENT">Full Settlement</option>
              </select>
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Payment Mode
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="select-field"
              >
                <option value="CASH">Cash Counter</option>
                <option value="UPI">Counter UPI / QR</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Reference / Transaction ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UTR / Cash receipt number"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly interest paid at shop counter"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDD5C8]">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRecording}
              className="btn-primary"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isRecording ? 'Recording...' : 'Save & Print Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />

      {/* Screenshot Proof Preview Modal */}
      <Modal
        isOpen={Boolean(selectedScreenshot)}
        onClose={() => setSelectedScreenshot(null)}
        title="UPI Payment Screenshot & Proof"
        size="md"
      >
        {selectedScreenshot && (
          <div className="space-y-3">
            <div className="p-2.5 bg-[#fff4f1] border border-[#DDD5C8] rounded text-2xs space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-charcoal-secondary">Customer:</span>
                <span className="text-charcoal">{selectedScreenshot.payment.customer?.name} ({selectedScreenshot.payment.customer?.phone})</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-charcoal-secondary">Loan Account:</span>
                <span className="text-coffee font-bold">{selectedScreenshot.payment.loan?.loanNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-secondary">Amount Claimed:</span>
                <span className="font-extrabold text-sm text-charcoal">{formatCurrency(selectedScreenshot.payment.amount)}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-charcoal-secondary">Reported UTR:</span>
                <span className="font-bold text-coffee">{selectedScreenshot.payment.referenceNumber || '-'}</span>
              </div>
            </div>

            <div className="border border-[#DDD5C8] rounded overflow-hidden max-h-96 flex items-center justify-center bg-black/5">
              <img
                src={selectedScreenshot.url}
                alt="UPI Screenshot Proof"
                className="max-h-96 w-auto object-contain"
              />
            </div>

            {selectedScreenshot.payment.status === 'PENDING' && (
              <div className="flex items-center justify-between pt-2 border-t border-[#DDD5C8]">
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedScreenshot.payment;
                    setSelectedScreenshot(null);
                    setRejectingPayment(p);
                    setRejectionReason('');
                  }}
                  className="btn-danger text-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject Submission
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = selectedScreenshot.payment;
                    setSelectedScreenshot(null);
                    setApprovingPayment(p);
                    setApprovalNotes('');
                  }}
                  className="btn-success text-xs font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve & Issue Receipt
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Payment Confirmation Modal */}
      <Modal
        isOpen={Boolean(approvingPayment)}
        onClose={() => setApprovingPayment(null)}
        title={approvingPayment?.paymentMethod === 'CASH' ? 'Confirm Doorstep Cash Collected' : 'Approve UPI Payment & Issue Receipt'}
      >
        {approvingPayment && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-2xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-charcoal-secondary font-semibold">Customer:</span>
                <span className="font-bold">{approvingPayment.customer?.name} ({approvingPayment.customer?.phone})</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-charcoal-secondary">Loan Account:</span>
                <span className="font-bold text-coffee">{approvingPayment.loan?.loanNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-secondary">Amount to Credit:</span>
                <span className="font-extrabold text-sm text-emerald-900">{formatCurrency(approvingPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-secondary">Channel:</span>
                <span className="font-semibold uppercase">{approvingPayment.paymentMethod}</span>
              </div>
              {approvingPayment.paymentMethod === 'CASH' && approvingPayment.collectionAddress && (
                <div className="pt-1 border-t border-emerald-200">
                  <span className="text-charcoal-secondary block font-semibold">Collection Address:</span>
                  <span className="block text-charcoal">{approvingPayment.collectionAddress}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Internal Verification Notes (Optional)
              </label>
              <input
                type="text"
                placeholder={approvingPayment.paymentMethod === 'CASH' ? 'e.g. Cash handed over by field executive' : 'e.g. Matched bank statement credit'}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDD5C8]">
              <button
                type="button"
                onClick={() => setApprovingPayment(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleApprove}
                className="btn-success font-bold"
              >
                <Check className="w-3.5 h-3.5" />
                {isProcessingAction ? 'Crediting Ledger...' : 'Confirm & Issue Receipt'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Payment Modal */}
      <Modal
        isOpen={Boolean(rejectingPayment)}
        onClose={() => setRejectingPayment(null)}
        title="Reject Payment Submission"
      >
        {rejectingPayment && (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded text-2xs space-y-1">
              <span className="font-bold text-coffee block">
                You are rejecting payment of {formatCurrency(rejectingPayment.amount)} for Loan #{rejectingPayment.loan?.loanNumber}.
              </span>
              <span className="text-charcoal-secondary block">
                The customer will receive an instant notification explaining why this payment was not approved.
              </span>
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Rejection Reason <span className="text-coffee">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. UTR number not found in bank statement, screenshot unreadable, customer was unavailable for doorstep collection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDD5C8]">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction || !rejectionReason.trim()}
                onClick={handleReject}
                className="btn-danger font-bold"
              >
                <XCircle className="w-3.5 h-3.5" />
                {isProcessingAction ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

