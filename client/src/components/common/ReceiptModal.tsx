import React, { useRef } from 'react';
import { Modal } from './Modal';
import { Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: any | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receipt }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Payment Receipt" maxWidth="md">
      <div className="space-y-4">
        {/* Printable Receipt Paper Container */}
        <div
          ref={receiptRef}
          id="printable-receipt"
          className="bg-white border-2 border-dashed border-[#DDD5C8] p-5 rounded font-mono text-xs text-charcoal shadow-inner"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b border-[#DDD5C8]">
            <div className="inline-flex items-center gap-1.5 justify-center mb-1">
              <span className="w-5 h-5 rounded bg-ferrari text-white font-sans font-bold flex items-center justify-center text-2xs">
                ₹
              </span>
              <span className="font-sans font-extrabold text-sm text-charcoal uppercase tracking-tight">
                {receipt.shop?.name || 'Sri Lakshmi Gold Finance'}
              </span>
            </div>
            <p className="text-2xs text-charcoal-secondary">{receipt.shop?.address}</p>
            <p className="text-2xs text-charcoal-secondary">
              Phone: {receipt.shop?.phone} | Email: {receipt.shop?.email}
            </p>
            <div className="inline-block mt-2 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-2xs font-sans font-bold uppercase tracking-wider">
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Payment Acknowledgment
              </span>
            </div>
          </div>

          {/* Receipt Meta */}
          <div className="grid grid-cols-2 gap-2 py-2.5 border-b border-[#DDD5C8] text-2xs">
            <div>
              <span className="text-charcoal-secondary block">Receipt Number:</span>
              <span className="font-bold text-charcoal">{receipt.receiptNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-charcoal-secondary block">Date & Time:</span>
              <span className="font-bold text-charcoal">{formatDateTime(receipt.paidAt)}</span>
            </div>
          </div>

          {/* Customer & Loan Details */}
          <div className="py-2.5 border-b border-[#DDD5C8] space-y-1.5 text-2xs">
            <div className="flex justify-between">
              <span className="text-charcoal-secondary">Customer Name:</span>
              <span className="font-bold">{receipt.customer?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-secondary">Customer ID / Phone:</span>
              <span>{receipt.customer?.customerId} • {receipt.customer?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-secondary">Gold Loan Account:</span>
              <span className="font-bold text-ferrari">{receipt.loan?.loanNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-secondary">Payment Mode:</span>
              <span className="font-semibold uppercase">{receipt.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-secondary">Reference / UTR:</span>
              <span>{receipt.referenceNumber || 'N/A'}</span>
            </div>
          </div>

          {/* Amount Paid Box */}
          <div className="my-3 p-3 bg-[#fff4f1] border border-[#DDD5C8] rounded flex items-center justify-between">
            <div>
              <span className="text-2xs font-sans font-semibold text-charcoal-secondary uppercase tracking-wider block">
                Amount Received
              </span>
              <span className="text-2xs text-charcoal-muted">
                Type: {receipt.paymentType?.replace('_', ' ')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-sans font-extrabold text-charcoal block">
                {formatCurrency(receipt.amount)}
              </span>
              <span className="text-2xs text-emerald-700 font-bold font-sans">PAID & VERIFIED</span>
            </div>
          </div>

          {/* Account Balance Summary */}
          <div className="py-2 border-b border-[#DDD5C8] space-y-1 text-2xs">
            <div className="flex justify-between">
              <span className="text-charcoal-secondary">Original Loan Sanctioned:</span>
              <span>{formatCurrency(receipt.loan?.originalLoanAmount)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-charcoal">Remaining Outstanding:</span>
              <span className="text-ferrari">{formatCurrency(receipt.loan?.remainingOutstanding)}</span>
            </div>
          </div>

          {/* Signature & Disclaimer */}
          <div className="pt-4 flex items-end justify-between text-2xs">
            <div>
              <span className="text-charcoal-muted block">Received by:</span>
              <span className="font-semibold">{receipt.receivedBy || 'Authorized Officer'}</span>
              <div className="inline-flex items-center gap-1 text-emerald-800 font-sans text-2xs mt-1">
                <ShieldCheck className="w-3 h-3" /> System Verified
              </div>
            </div>

            <div className="text-center">
              <div className="w-32 border-b border-charcoal mb-1"></div>
              <span className="text-2xs text-charcoal-secondary font-sans font-semibold">
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button onClick={handlePrint} className="btn-primary">
            <Printer className="w-3.5 h-3.5" />
            Print / Save as PDF
          </button>
        </div>
      </div>
    </Modal>
  );
};

