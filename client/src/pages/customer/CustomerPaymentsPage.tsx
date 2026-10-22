import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { CustomerPaymentModal } from '../../components/common/CustomerPaymentModal';
import { Receipt, RefreshCw, CreditCard, ChevronLeft, ChevronRight, Clock, MapPin, AlertCircle, Plus } from 'lucide-react';

export const CustomerPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Active Loan for Payment Modal
  const [activeLoan, setActiveLoan] = useState<any | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments', {
        params: { page, limit: 15 },
      });
      if (res.data?.success) {
        setPayments(res.data.data.payments);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load customer payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveLoan = async () => {
    try {
      const res = await api.get('/loans?status=ACTIVE');
      if (res.data?.success && res.data.data.loans.length > 0) {
        setActiveLoan(res.data.data.loans[0]);
      }
    } catch (err) {
      console.error('Failed to load loan info:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchActiveLoan();
  }, [page]);

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
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-[#DDD5C8]">
        <div>
          <h1 className="text-base font-extrabold text-charcoal tracking-tight">
            Payment History & Receipts
          </h1>
          <p className="text-2xs text-charcoal-secondary">
            Verified ledger of all online UPI and counter payments made towards your gold loans
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeLoan && (
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="btn-primary"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Pay Towards Loan
            </button>
          )}

          <button
            onClick={fetchPayments}
            className="p-1.5 text-charcoal hover:bg-[#EADCC8] rounded border border-[#DDD5C8]"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Payments Compact List */}
      <div className="card-compact">
        <div className="overflow-x-auto">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Date</th>
                <th>Receipt #</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Method</th>
                <th>Status</th>
                <th className="text-right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-charcoal-secondary">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-ferrari" />
                    Fetching payment history...
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td className="text-2xs font-mono text-charcoal-secondary">
                      {formatDateTime(p.paidAt || p.createdAt)}
                    </td>
                    <td className="font-mono text-2xs font-bold text-charcoal">
                      {p.receiptNumber}
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
                      <span className="badge badge-pending uppercase">
                        {p.paymentMethod}
                      </span>
                      {p.paymentMethod === 'CASH' && p.collectionSlot && (
                        <span className="block text-2xs text-charcoal-muted mt-0.5">
                          {p.collectionSlot}
                        </span>
                      )}
                      {p.paymentMethod === 'UPI' && p.referenceNumber && (
                        <span className="block text-2xs font-mono text-charcoal-muted mt-0.5">
                          UTR: {p.referenceNumber}
                        </span>
                      )}
                    </td>
                    <td>
                      {p.status === 'SUCCESS' ? (
                        <span className="badge badge-active">Approved</span>
                      ) : p.status === 'PENDING' ? (
                        <div>
                          <span className="badge badge-pending font-bold">
                            {p.paymentMethod === 'CASH' ? 'Pending Collection' : 'Pending Verification'}
                          </span>
                          <span className="block text-2xs text-amber-800 mt-0.5">
                            {p.paymentMethod === 'CASH' ? 'Executive will visit' : 'Awaiting admin check'}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="badge badge-overdue">Rejected</span>
                          {p.rejectionReason && (
                            <span className="block text-2xs text-coffee mt-0.5 max-w-xs truncate" title={p.rejectionReason}>
                              {p.rejectionReason}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="text-right">
                      {p.status === 'SUCCESS' ? (
                        <button
                          onClick={() => handleViewReceipt(p.receiptNumber)}
                          className="btn-secondary text-2xs py-0.5 px-2"
                        >
                          <Receipt className="w-3 h-3 text-coffee" />
                          Receipt
                        </button>
                      ) : (
                        <span className="text-2xs text-charcoal-muted italic">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-charcoal-secondary text-2xs">
                    No payment history recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#DDD5C8] text-2xs text-charcoal-secondary">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
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

      {/* Customer Payment Modal (UPI & Cash Collection) */}
      <CustomerPaymentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        loan={activeLoan}
        onSuccess={() => {
          fetchPayments();
        }}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
};

