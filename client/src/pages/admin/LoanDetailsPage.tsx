import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatDate, formatDateTime, formatWeight } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import {
  Coins,
  ArrowLeft,
  User,
  Calendar,
  Gem,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Receipt,
  CheckCircle2,
  Lock,
  PlusCircle,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

export const LoanDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loan, setLoan] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [serverError, setServerError] = useState<string | null>(null);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState<boolean>(false);
  const [isUploadImageModalOpen, setIsUploadImageModalOpen] = useState<boolean>(false);
  const [selectedGoldItemId, setSelectedGoldItemId] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<string>('INTEREST_ONLY');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  // Release Form State
  const [releaseStaff, setReleaseStaff] = useState<string>('Owner Admin');
  const [customerConfirmed, setCustomerConfirmed] = useState<boolean>(false);
  const [releaseNotes, setReleaseNotes] = useState<string>('');
  const [isSubmittingRelease, setIsSubmittingRelease] = useState<boolean>(false);

  // Image Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<string>('FRONT');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/loans/${id}`);
      if (res.data?.success) {
        setLoan(res.data.data);
        setPaymentAmount(Number(res.data.data.financials.nextPaymentAmount));
      }
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to load loan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLoanDetails();
  }, [id]);

  const handleRecordOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    try {
      setIsSubmittingPayment(true);
      const res = await api.post('/payments/record-offline', {
        loanId: loan.id,
        amount: Number(paymentAmount),
        paymentType,
        paymentMethod,
        referenceNumber: paymentRef || undefined,
        notes: paymentNotes || undefined,
      });

      if (res.data?.success) {
        setIsPaymentModalOpen(false);
        // Open receipt modal
        const receiptRes = await api.get(`/payments/receipt/${res.data.data.receiptNumber}`);
        if (receiptRes.data?.success) {
          setSelectedReceipt(receiptRes.data.data);
          setIsReceiptModalOpen(true);
        }
        fetchLoanDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleReleaseGold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    try {
      setIsSubmittingRelease(true);
      const res = await api.post(`/loans/${loan.id}/release-gold`, {
        releasedBy: releaseStaff,
        customerConfirmation: customerConfirmed,
        notes: releaseNotes || undefined,
      });

      if (res.data?.success) {
        setIsReleaseModalOpen(false);
        fetchLoanDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to release gold');
    } finally {
      setIsSubmittingRelease(false);
    }
  };

  const handleUploadGoldImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedGoldItemId) return;
    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('imageType', imageType);

      const res = await api.post(`/gold/${selectedGoldItemId}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setIsUploadImageModalOpen(false);
        setUploadFile(null);
        fetchLoanDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (loading && !loan) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-charcoal-secondary text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-ferrari" />
        Loading loan account file...
      </div>
    );
  }

  if (serverError || !loan) {
    return (
      <div className="card-compact bg-red-50 text-ferrari p-4 text-xs">
        {serverError || 'Loan account could not be found.'}
      </div>
    );
  }

  const isEligibleForRelease = loan.financials?.isEligibleForGoldRelease && !loan.goldReleased;

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#DDD5C8]">
        <div className="flex items-center gap-2">
          <Link
            to="/admin/loans"
            className="p-1.5 text-charcoal hover:bg-[#EADCC8] rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-charcoal tracking-tight font-mono">
                Loan #{loan.loanNumber}
              </h1>
              <span
                className={`badge ${
                  loan.status === 'ACTIVE'
                    ? 'badge-active'
                    : loan.status === 'OVERDUE'
                    ? 'badge-overdue'
                    : 'badge-closed'
                }`}
              >
                {loan.status}
              </span>
              {loan.goldReleased && (
                <span className="badge badge-active flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> Gold Released
                </span>
              )}
            </div>
            <p className="text-2xs text-charcoal-secondary">
              Sanctioned on {formatDate(loan.startDate)} • Maturity {formatDate(loan.maturityDate)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {loan.status !== 'CLOSED' && (
            <button
              onClick={() => {
                setPaymentAmount(Number(loan.financials.nextPaymentAmount));
                setIsPaymentModalOpen(true);
              }}
              className="btn-primary"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Record Payment
            </button>
          )}

          {isEligibleForRelease ? (
            <button
              onClick={() => setIsReleaseModalOpen(true)}
              className="btn-success text-xs font-bold ring-2 ring-emerald-500/30"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
              Eligible for Gold Release
            </button>
          ) : loan.goldReleased ? (
            <span className="text-2xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
              Gold Safely Released on {formatDate(loan.releasedAt)}
            </span>
          ) : (
            <button
              disabled
              title="Full principal and accumulated interest must be settled first"
              className="btn-secondary text-2xs opacity-60 cursor-not-allowed"
            >
              <Lock className="w-3 h-3 text-charcoal-muted" />
              Gold Vault Sealed
            </button>
          )}
        </div>
      </div>

      {/* Financial Status Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="card-compact">
          <span className="text-2xs text-charcoal-secondary block font-semibold">
            SANCTIONED PRINCIPAL
          </span>
          <span className="text-base font-extrabold text-charcoal block">
            {formatCurrency(loan.loanAmount)}
          </span>
          <span className="text-2xs text-charcoal-muted font-mono">
            Rate: {loan.interestRate}% / month
          </span>
        </div>

        <div className="card-compact">
          <span className="text-2xs text-charcoal-secondary block font-semibold">
            TOTAL OUTSTANDING
          </span>
          <span className="text-base font-extrabold text-ferrari block">
            {formatCurrency(loan.financials.totalOutstanding)}
          </span>
          <span className="text-2xs text-charcoal-muted font-mono">
            Principal: {formatCurrency(loan.financials.outstandingPrincipal)}
          </span>
        </div>

        <div className="card-compact">
          <span className="text-2xs text-charcoal-secondary block font-semibold">
            INTEREST ACCUMULATED
          </span>
          <span className="text-base font-extrabold text-charcoal block">
            {formatCurrency(loan.financials.accumulatedInterestDue)}
          </span>
          <span className="text-2xs text-charcoal-muted font-mono">
            Paid: {formatCurrency(loan.financials.interestPaid)}
          </span>
        </div>

        <div className="card-compact">
          <span className="text-2xs text-charcoal-secondary block font-semibold">
            NEXT PAYMENT DUE
          </span>
          <span className="text-base font-extrabold text-emerald-700 block">
            {formatCurrency(loan.financials.nextPaymentAmount)}
          </span>
          <span className="text-2xs text-charcoal-muted font-mono">
            Maturity: {formatCurrency(loan.financials.maturityAmount)}
          </span>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="card-compact flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FBF8F3]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#EADCC8] border border-[#DDD5C8] flex items-center justify-center text-charcoal font-bold text-xs">
            {loan.customer?.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-charcoal">{loan.customer?.name}</span>
              <span className="font-mono text-2xs text-charcoal-secondary font-semibold bg-[#EADCC8] px-1.5 py-0.2 rounded">
                {loan.customer?.customerId}
              </span>
            </div>
            <div className="text-2xs text-charcoal-secondary">
              Phone: {loan.customer?.phone} • Email: {loan.customer?.email}
            </div>
          </div>
        </div>

        <div className="text-2xs text-charcoal-secondary sm:text-right">
          <div>{loan.customer?.profile?.address || 'No address on file'}</div>
          <div>
            {loan.customer?.profile?.city}, {loan.customer?.profile?.state} - {loan.customer?.profile?.pincode}
          </div>
          <div className="text-charcoal-muted">
            KYC: {loan.customer?.profile?.idType} ({loan.customer?.profile?.idNumber})
          </div>
        </div>
      </div>

      {/* Collateral Gold Details */}
      <div className="card-compact space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-[#DDD5C8]">
          <div className="flex items-center gap-1.5">
            <Gem className="w-4 h-4 text-amber-700" />
            <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              Pledged Gold Items ({loan.goldItems?.length || 0})
            </h2>
          </div>
          <span className="text-2xs text-charcoal-secondary">
            Collateral stored in Shop Vault Locker
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {loan.goldItems?.map((item: any) => (
            <div
              key={item.id}
              className="p-3 bg-[#FFFDF9] border border-[#DDD5C8] rounded flex flex-col justify-between gap-2 shadow-subtle"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-charcoal block">{item.itemType}</span>
                    <span className="text-2xs text-charcoal-secondary block">{item.description}</span>
                  </div>
                  <span
                    className={`badge ${
                      item.status === 'RELEASED' ? 'badge-active' : 'badge-pending'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#DDD5C8]/60 text-2xs font-mono">
                  <div>
                    <span className="text-charcoal-muted block">Gross Wt:</span>
                    <span className="font-semibold">{formatWeight(item.grossWeight)}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-muted block">Net Gold:</span>
                    <span className="font-bold text-charcoal">{formatWeight(item.netWeight)}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-muted block">Purity:</span>
                    <span className="font-semibold text-amber-800">{item.purity}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-muted block">Market Val:</span>
                    <span>{formatCurrency(item.estimatedValue)}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-muted block">Loan Val:</span>
                    <span>{formatCurrency(item.loanValue)}</span>
                  </div>
                </div>
              </div>

              {/* Images Preview Section */}
              <div className="pt-2 border-t border-[#DDD5C8]/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xs font-semibold text-charcoal-secondary">
                    Verification Images ({item.images?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGoldItemId(item.id);
                      setIsUploadImageModalOpen(true);
                    }}
                    className="text-2xs font-semibold text-ferrari hover:underline flex items-center gap-0.5"
                  >
                    <Upload className="w-3 h-3" /> Upload Image
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {item.images && item.images.length > 0 ? (
                    item.images.map((img: any) => (
                      <a
                        key={img.id}
                        href={img.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="relative group w-14 h-14 rounded border border-[#DDD5C8] overflow-hidden bg-black/5 flex-shrink-0"
                      >
                        <img
                          src={img.fileUrl}
                          alt={img.fileName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </a>
                    ))
                  ) : (
                    <div className="text-2xs text-charcoal-muted italic py-1">
                      No photo attached yet. Click upload to attach front/hallmark photo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Payment Schedule & Payment History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Schedule */}
        <div className="card-compact">
          <div className="flex items-center justify-between pb-1 mb-2 border-b border-[#DDD5C8]">
            <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-ferrari" />
              Repayment Schedule Terms
            </h2>
            <span className="text-2xs text-charcoal-muted font-mono">Monthly Simple</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>Due Date</th>
                  <th>Interest</th>
                  <th>Principal</th>
                  <th>Total Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loan.paymentSchedules?.map((s: any, idx: number) => (
                  <tr key={s.id}>
                    <td className="font-mono text-2xs font-semibold">
                      {formatDate(s.dueDate)}
                    </td>
                    <td>{formatCurrency(s.interestAmount)}</td>
                    <td>{formatCurrency(s.principalAmount)}</td>
                    <td className="font-bold text-charcoal">{formatCurrency(s.totalDue)}</td>
                    <td>
                      <span
                        className={`badge ${
                          s.status === 'PAID'
                            ? 'badge-active'
                            : s.status === 'OVERDUE'
                            ? 'badge-overdue'
                            : 'badge-pending'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History */}
        <div className="card-compact">
          <div className="flex items-center justify-between pb-1 mb-2 border-b border-[#DDD5C8]">
            <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-700" />
              Recorded Payments ({loan.payments?.length || 0})
            </h2>
            <span className="text-2xs text-charcoal-muted font-mono">Verified Receipts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Mode</th>
                  <th>Date</th>
                  <th className="text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {loan.payments && loan.payments.length > 0 ? (
                  loan.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="font-mono text-2xs font-bold text-ferrari">
                        {p.receiptNumber}
                      </td>
                      <td className="font-bold text-charcoal">{formatCurrency(p.amount)}</td>
                      <td>
                        <span className="text-2xs text-charcoal-secondary">
                          {p.paymentType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-2xs uppercase font-medium">{p.paymentMethod}</td>
                      <td className="text-2xs font-mono text-charcoal-secondary">
                        {formatDate(p.paidAt || p.createdAt)}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={async () => {
                            const res = await api.get(`/payments/receipt/${p.receiptNumber}`);
                            if (res.data?.success) {
                              setSelectedReceipt(res.data.data);
                              setIsReceiptModalOpen(true);
                            }
                          }}
                          className="btn-secondary text-2xs py-0.5 px-1.5"
                        >
                          Print
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-charcoal-secondary text-2xs">
                      No payments received yet for this loan account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Record Offline Payment */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Loan Repayment at Counter"
      >
        <form onSubmit={handleRecordOfflinePayment} className="space-y-3">
          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Payment Amount (₹) <span className="text-ferrari">*</span>
            </label>
            <input
              type="number"
              step="100"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="input-field font-bold text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Payment Category
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="select-field"
              >
                <option value="INTEREST_ONLY">Interest Only</option>
                <option value="PRINCIPAL_PARTIAL">Partial Principal</option>
                <option value="FULL_SETTLEMENT">Full Loan Settlement</option>
              </select>
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="select-field"
              >
                <option value="CASH">Cash at Counter</option>
                <option value="UPI">Counter QR / UPI</option>
                <option value="BANK_TRANSFER">Direct Bank IMPS / NEFT</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Bank Ref / Transaction ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref / Cash register memo"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Internal Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Received from borrower Rahul directly"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDD5C8]">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingPayment}
              className="btn-primary"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSubmittingPayment ? 'Recording...' : 'Generate Official Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Gold Release Verification Workflow */}
      <Modal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        title="Gold Release & Loan Closure Authorization"
      >
        <form onSubmit={handleReleaseGold} className="space-y-3">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-2xs text-emerald-900 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Settlement Verification Verified
            </div>
            <p>
              The loan has achieved zero outstanding balance. You are authorizing the physical release of all pledged gold jewelry items from the shop safe vault.
            </p>
          </div>

          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Authorizing Staff Officer / Owner Name <span className="text-ferrari">*</span>
            </label>
            <input
              type="text"
              required
              value={releaseStaff}
              onChange={(e) => setReleaseStaff(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Release Remarks / Handover Memo
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Physical items inspected by customer, weights verified on digital scale, jewelry handed over in original condition."
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex items-center gap-2 p-2 bg-[#fff4f1] border border-[#DDD5C8] rounded">
            <input
              type="checkbox"
              id="confirmCheck"
              required
              checked={customerConfirmed}
              onChange={(e) => setCustomerConfirmed(e.target.checked)}
              className="rounded text-ferrari focus:ring-ferrari"
            />
            <label htmlFor="confirmCheck" className="text-2xs font-semibold text-charcoal cursor-pointer">
              I certify that customer has signed the physical delivery register and received all pledged items.
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDD5C8]">
            <button
              type="button"
              onClick={() => setIsReleaseModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingRelease || !customerConfirmed}
              className="btn-success"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isSubmittingRelease ? 'Releasing...' : 'Authorize & Release Gold'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Upload Gold Item Image */}
      <Modal
        isOpen={isUploadImageModalOpen}
        onClose={() => setIsUploadImageModalOpen(false)}
        title="Upload Collateral Verification Image"
      >
        <form onSubmit={handleUploadGoldImage} className="space-y-3">
          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Image Perspective / Tag
            </label>
            <select
              value={imageType}
              onChange={(e) => setImageType(e.target.value)}
              className="select-field"
            >
              <option value="FRONT">Front View</option>
              <option value="BACK">Back View</option>
              <option value="CLOSEUP">Macro Closeup / Gemstone</option>
              <option value="HALLMARK">BIS Hallmarking Stamp</option>
              <option value="PACKAGING">Sealed Tamper-Evident Bag</option>
            </select>
          </div>

          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Select Image File (JPEG, PNG, WEBP)
            </label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
              className="input-field file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-2xs file:bg-ferrari file:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDD5C8]">
            <button
              type="button"
              onClick={() => setIsUploadImageModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploadingImage || !uploadFile}
              className="btn-primary"
            >
              <Upload className="w-3.5 h-3.5" />
              {isUploadingImage ? 'Uploading...' : 'Save Image to File System'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
};

