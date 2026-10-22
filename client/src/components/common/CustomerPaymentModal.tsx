import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  CreditCard,
  QrCode,
  Banknote,
  Upload,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  RefreshCw,
  X,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: any;
  onSuccess?: () => void;
}

export const CustomerPaymentModal: React.FC<CustomerPaymentModalProps> = ({
  isOpen,
  onClose,
  loan,
  onSuccess,
}) => {
  const { user } = useAuth();

  // Settings & Options from Admin
  const [paymentSettings, setPaymentSettings] = useState<{
    upiEnabled: boolean;
    upiId: string;
    upiPhone: string;
    upiName: string;
    cashCollectionEnabled: boolean;
  } | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);

  // Payment Form States
  const [payType, setPayType] = useState<'INTEREST_ONLY' | 'PRINCIPAL_PARTIAL' | 'FULL_SETTLEMENT'>('INTEREST_ONLY');
  const [amount, setAmount] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CASH'>('UPI');

  // UPI Specific States
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Cash Collection Specific States
  const [collectionDate, setCollectionDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  // General States
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    method: 'UPI' | 'CASH';
    receiptNumber: string;
    message: string;
    details?: string;
  } | null>(null);

  // Initialize data on modal open
  useEffect(() => {
    if (isOpen) {
      setSuccessResult(null);
      setErrorMessage(null);
      setUtrNumber('');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setSelectedSlotId('');
      setNotes('');

      // Set default payment amount based on next payment
      const nextDue = Number(loan?.financials?.nextPaymentAmount || 0);
      setAmount(nextDue > 0 ? nextDue : 1000);
      setPayType('INTEREST_ONLY');

      // Fetch payment settings from backend
      setLoadingSettings(true);
      api.get('/payments/settings')
        .then((res) => {
          if (res.data?.success) {
            setPaymentSettings(res.data.data);
            if (!res.data.data.upiEnabled && res.data.data.cashCollectionEnabled) {
              setSelectedMethod('CASH');
            } else {
              setSelectedMethod('UPI');
            }
          }
        })
        .catch((err) => console.error('Failed to load payment settings:', err))
        .finally(() => setLoadingSettings(false));

      // Fetch customer profile to get address
      setLoadingProfile(true);
      api.get('/auth/profile')
        .then((res) => {
          if (res.data?.success) {
            setCustomerProfile(res.data.data);
          }
        })
        .catch((err) => console.error('Failed to load profile address:', err))
        .finally(() => setLoadingProfile(false));
    }
  }, [isOpen, loan]);

  // Load available slots whenever date or method changes to CASH
  useEffect(() => {
    if (isOpen && selectedMethod === 'CASH' && collectionDate) {
      setLoadingSlots(true);
      api.get(`/appointments/available-slots?date=${collectionDate}`)
        .then((res) => {
          if (res.data?.success) {
            const slotList = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.slots || []);
            setAvailableSlots(slotList);
          }
        })
        .catch((err) => console.error('Failed to load slots:', err))
        .finally(() => setLoadingSlots(false));
    }
  }, [isOpen, selectedMethod, collectionDate]);

  const handleCopyUpi = () => {
    if (paymentSettings?.upiId) {
      navigator.clipboard.writeText(paymentSettings.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    setErrorMessage(null);

    if (amount <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (selectedMethod === 'UPI') {
        if (!utrNumber.trim()) {
          setErrorMessage('Please enter the 12-digit UPI UTR / Transaction Reference Number.');
          setIsSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append('loanId', loan.id);
        formData.append('amount', String(amount));
        formData.append('paymentType', payType);
        formData.append('referenceNumber', utrNumber.trim());
        if (notes) formData.append('notes', notes);
        if (screenshotFile) formData.append('screenshot', screenshotFile);

        const res = await api.post('/payments/submit-upi', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.success) {
          setSuccessResult({
            method: 'UPI',
            receiptNumber: res.data.data.receiptNumber,
            message: 'Your UPI payment has been submitted for admin verification.',
            details: `Ref / UTR: ${utrNumber}. Once store staff matches the bank entry, your ledger is credited and official receipt is issued.`,
          });
          if (onSuccess) onSuccess();
        }
      } else if (selectedMethod === 'CASH') {
        if (!selectedSlotId) {
          setErrorMessage('Please select a preferred executive visit time slot.');
          setIsSubmitting(false);
          return;
        }

        const res = await api.post('/payments/request-cash-collection', {
          loanId: loan.id,
          amount,
          paymentType: payType,
          slotId: selectedSlotId,
          date: collectionDate,
          notes: notes || undefined,
        });

        if (res.data?.success) {
          setSuccessResult({
            method: 'CASH',
            receiptNumber: res.data.data.payment.receiptNumber,
            message: 'Doorstep Cash Collection visit confirmed!',
            details: `Executive will visit your address on ${res.data.data.collectionSlot}. Address: ${res.data.data.address}.`,
          });
          if (onSuccess) onSuccess();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Payment submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const address = customerProfile?.profile?.address
    ? [
        customerProfile.profile.address,
        customerProfile.profile.city,
        customerProfile.profile.state,
        customerProfile.profile.pincode ? `PIN: ${customerProfile.profile.pincode}` : '',
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Make Gold Loan Payment"
      size="lg"
    >
      {successResult ? (
        <div className="space-y-4 py-2 animate-in zoom-in-95">
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
              {successResult.message}
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
              {successResult.details}
            </p>
            <div className="pt-2">
              <span className="font-mono text-2xs font-bold text-emerald-950 bg-emerald-100/80 px-2.5 py-1 rounded border border-emerald-300">
                Tracking Ref: {successResult.receiptNumber}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#DDD5C8]">
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Done & View Loan Account
            </button>
          </div>
        </div>
      ) : loadingSettings ? (
        <div className="py-12 text-center text-xs text-charcoal-secondary">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-coffee" />
          Loading store payment channels...
        </div>
      ) : !paymentSettings?.upiEnabled && !paymentSettings?.cashCollectionEnabled ? (
        <div className="p-5 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-700 mx-auto" />
          <h3 className="text-xs font-bold text-charcoal">Online Channels Currently Disabled</h3>
          <p className="text-2xs text-charcoal-secondary max-w-sm mx-auto">
            Store management has temporarily suspended digital payment submissions. Please visit our branch counter during working hours (10:00 AM – 7:00 PM) for cash or counter card payments.
          </p>
          <button onClick={onClose} className="btn-secondary text-2xs">
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {errorMessage && (
            <div className="p-2.5 bg-red-50 text-coffee border border-red-200 rounded text-2xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loan Context Summary */}
          <div className="p-2.5 bg-[#fff4f1] border border-[#DDD5C8] rounded text-2xs space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-charcoal-secondary font-semibold">Loan Account:</span>
              <span className="font-mono font-bold text-coffee">{loan?.loanNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-charcoal-secondary">Total Current Outstanding:</span>
              <span className="font-bold text-charcoal">
                {formatCurrency(loan?.financials?.totalOutstanding)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-charcoal-secondary">Next Monthly Interest Due:</span>
              <span className="font-bold text-emerald-800">
                {formatCurrency(loan?.financials?.nextPaymentAmount)}
              </span>
            </div>
          </div>

          {/* Step 1: Select Payment Type */}
          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              1. Select Payment Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-2xs">
              <button
                type="button"
                onClick={() => {
                  setPayType('INTEREST_ONLY');
                  setAmount(Number(loan?.financials?.nextPaymentAmount || 0));
                }}
                className={`p-2 border rounded text-left transition-colors ${
                  payType === 'INTEREST_ONLY'
                    ? 'border-coffee bg-[#F4ECE6] text-coffee font-bold'
                    : 'border-[#DDD5C8] bg-white text-charcoal'
                }`}
              >
                <span>Interest Only Due</span>
                <span className="block font-bold mt-0.5">
                  {formatCurrency(loan?.financials?.nextPaymentAmount)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPayType('PRINCIPAL_PARTIAL');
                  setAmount(1000);
                }}
                className={`p-2 border rounded text-left transition-colors ${
                  payType === 'PRINCIPAL_PARTIAL'
                    ? 'border-coffee bg-[#F4ECE6] text-coffee font-bold'
                    : 'border-[#DDD5C8] bg-white text-charcoal'
                }`}
              >
                <span>Principal Reduction</span>
                <span className="block font-normal text-charcoal-secondary mt-0.5">Custom Amount</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPayType('FULL_SETTLEMENT');
                  setAmount(Number(loan?.financials?.totalOutstanding || 0));
                }}
                className={`p-2 border rounded text-left transition-colors ${
                  payType === 'FULL_SETTLEMENT'
                    ? 'border-coffee bg-[#F4ECE6] text-coffee font-bold'
                    : 'border-[#DDD5C8] bg-white text-charcoal'
                }`}
              >
                <span>Full Loan Settlement</span>
                <span className="block font-bold mt-0.5">
                  {formatCurrency(loan?.financials?.totalOutstanding)}
                </span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Payment Amount (₹) <span className="text-coffee">*</span>
            </label>
            <input
              type="number"
              step="50"
              required
              min={100}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="input-field font-extrabold text-sm"
            />
          </div>

          {/* Step 2: Choose Payment Method (Only UPI or Cash Collection) */}
          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              2. Select Payment Method <span className="text-coffee">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {paymentSettings?.upiEnabled && (
                <button
                  type="button"
                  onClick={() => setSelectedMethod('UPI')}
                  className={`p-3 border rounded text-left flex items-start gap-2.5 transition-all ${
                    selectedMethod === 'UPI'
                      ? 'border-coffee bg-[#F4ECE6] ring-1 ring-coffee shadow-subtle'
                      : 'border-[#DDD5C8] bg-[#FFFDF9] hover:border-coffee/50'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-coffee flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs text-charcoal block">Direct UPI Payment</span>
                    <span className="text-2xs text-charcoal-secondary block mt-0.5">
                      Pay via GooglePay / PhonePe / Paytm to shop UPI and upload screenshot.
                    </span>
                  </div>
                </button>
              )}

              {paymentSettings?.cashCollectionEnabled && (
                <button
                  type="button"
                  onClick={() => setSelectedMethod('CASH')}
                  className={`p-3 border rounded text-left flex items-start gap-2.5 transition-all ${
                    selectedMethod === 'CASH'
                      ? 'border-coffee bg-[#F4ECE6] ring-1 ring-coffee shadow-subtle'
                      : 'border-[#DDD5C8] bg-[#FFFDF9] hover:border-coffee/50'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-800 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs text-charcoal block">Doorstep Cash Collection</span>
                    <span className="text-2xs text-charcoal-secondary block mt-0.5">
                      Executive visits your profile address at your chosen time slot.
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* ================= METHOD 1: UPI TRANSFER ================= */}
          {selectedMethod === 'UPI' && (
            <div className="card-compact bg-[#FBF8F3] space-y-3 border-coffee/30 animate-in fade-in">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#DDD5C8]">
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-coffee" /> Shop UPI Payment Details
                </span>
                <span className="badge badge-active text-2xs">Instant Verification</span>
              </div>

              {/* UPI Box */}
              <div className="p-3 bg-white border border-[#DDD5C8] rounded flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-2xs text-charcoal-muted uppercase tracking-wider block font-semibold">
                    Payee / Shop VPA
                  </span>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="font-mono font-extrabold text-sm text-coffee">
                      {paymentSettings?.upiId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="p-1 text-charcoal-secondary hover:text-coffee hover:bg-[#EADCC8] rounded transition-colors"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-2xs text-charcoal-secondary block">
                    Payee Name: <strong>{paymentSettings?.upiName}</strong> • Phone: {paymentSettings?.upiPhone}
                  </span>
                </div>

                <div className="p-2 bg-[#fff4f1] border border-[#DDD5C8] rounded text-center text-2xs font-mono text-coffee font-semibold">
                  Amount: {formatCurrency(amount)}
                </div>
              </div>

              {/* UTR Input */}
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  12-Digit UPI Transaction ID / UTR Number <span className="text-coffee">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 428910284912"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="input-field font-mono font-bold"
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  Upload Payment Screenshot <span className="text-coffee">*</span>
                </label>
                
                {screenshotPreview ? (
                  <div className="relative inline-block border border-[#DDD5C8] rounded p-1 bg-white">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot Preview"
                      className="h-28 w-auto object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotFile(null);
                        setScreenshotPreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-coffee text-white p-1 rounded-full shadow hover:bg-coffee-hover"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[#DDD5C8] hover:border-coffee rounded p-3 text-center cursor-pointer block bg-white transition-colors">
                    <Upload className="w-5 h-5 mx-auto text-charcoal-muted mb-1" />
                    <span className="text-2xs font-semibold text-coffee block">
                      Click to upload UPI confirmation screenshot
                    </span>
                    <span className="text-2xs text-charcoal-secondary block">
                      Supports JPG, PNG, WEBP (Max 10MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* ================= METHOD 2: DOORSTEP CASH ================= */}
          {selectedMethod === 'CASH' && (
            <div className="card-compact bg-[#FBF8F3] space-y-3 border-coffee/30 animate-in fade-in">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#DDD5C8]">
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-800" /> Doorstep Cash Collection
                </span>
                <span className="text-2xs text-charcoal-muted flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" /> Verified Executive
                </span>
              </div>

              {/* Customer Address Preview */}
              <div className="p-2.5 bg-white border border-[#DDD5C8] rounded space-y-1">
                <span className="text-2xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-coffee" /> Executive Visit Address (from Profile)
                </span>
                {loadingProfile ? (
                  <div className="text-2xs text-charcoal-secondary">Loading address...</div>
                ) : address ? (
                  <div>
                    <span className="text-xs font-semibold text-charcoal block">{address}</span>
                    <span className="text-2xs text-charcoal-secondary block mt-0.5">
                      Contact: <strong>{user?.phone}</strong> ({user?.name})
                    </span>
                  </div>
                ) : (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-2xs text-amber-900 space-y-1">
                    <span>No residential address found in your profile.</span>
                    <Link to="/profile" className="text-coffee font-bold underline block">
                      Update Profile Address Now →
                    </Link>
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  Select Collection Date <span className="text-coffee">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={collectionDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  Select Time Slot ({formatDate(collectionDate)}) <span className="text-coffee">*</span>
                </label>

                {loadingSlots ? (
                  <div className="text-center py-3 text-2xs text-charcoal-secondary">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin inline mr-1 text-coffee" />
                    Checking executive slot availability...
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-0.5">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`py-1.5 px-2.5 rounded-md text-2xs font-mono transition-all text-center ${
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
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-2xs rounded">
                    No available executive slots configured for this date. Please select another date.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Notes / Instructions */}
          <div>
            <label className="text-2xs font-semibold text-charcoal block mb-1">
              Special Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder={selectedMethod === 'CASH' ? 'e.g. Landmark near post office' : 'e.g. Paid via Google Pay'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDD5C8]">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (selectedMethod === 'CASH' && !address)}
              className="btn-primary"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSubmitting
                ? 'Submitting...'
                : selectedMethod === 'UPI'
                ? `Submit UPI Payment (${formatCurrency(amount)})`
                : `Confirm Doorstep Cash (${formatCurrency(amount)})`}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

