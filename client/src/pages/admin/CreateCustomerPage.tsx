import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '../../utils/zodResolver';
import { z } from 'zod';
import api from '../../services/api';
import { UserPlus, ArrowLeft, CheckCircle2, Shield, Copy, Key } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Must be a valid 10-digit mobile number'),
  email: z.string().email('Valid email address is required'),
  dateOfBirth: z.string().optional(),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(5, 'Valid PIN code is required'),
  idType: z.enum(['AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE']),
  idNumber: z.string().min(4, 'ID number is required'),
});

type FormData = z.infer<typeof formSchema>;

export const CreateCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const [createdResult, setCreatedResult] = useState<any | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      city: 'Bengaluru',
      state: 'Karnataka',
      idType: 'AADHAAR',
    },
  });

  const onSubmit = async (values: FormData) => {
    try {
      setServerError(null);
      const res = await api.post('/customers', values);
      if (res.data?.success) {
        setCreatedResult(res.data.data);
      }
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const text = `Sri Lakshmi Gold Finance - Your Login Credentials:\nCustomer ID: ${createdResult.customer.customerId}\nMobile: ${createdResult.customer.phone}\nTemporary Password: ${createdResult.temporaryPassword}\nLogin URL: ${window.location.origin}/login\n(Please change your password upon first login)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C8]">
        <div className="flex items-center gap-2">
          <Link
            to="/admin/customers"
            className="p-1.5 text-charcoal hover:bg-[#EADCC8] rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-extrabold text-charcoal tracking-tight">
              Customer Onboarding & Registration
            </h1>
            <p className="text-2xs text-charcoal-secondary">
              Record personal KYC details and automatically provision customer login access
            </p>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 text-ferrari text-xs rounded">
          {serverError}
        </div>
      )}

      {/* Success Modal / Card with Generated Credentials */}
      {createdResult ? (
        <div className="card-compact bg-emerald-50/70 border-emerald-300 p-5 space-y-4 animate-in zoom-in-95">
          <div className="flex items-center gap-2 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Customer Successfully Registered!
            </h2>
          </div>

          <p className="text-xs text-charcoal">
            The customer record has been created with assigned Customer ID{' '}
            <strong>{createdResult.customer.customerId}</strong>. You can give these temporary credentials to the customer now:
          </p>

          <div className="bg-white border border-[#DDD5C8] p-4 rounded font-mono text-xs space-y-2 shadow-inner">
            <div className="flex justify-between items-center py-1 border-b border-[#DDD5C8]/60">
              <span className="text-charcoal-secondary">Customer Name:</span>
              <span className="font-bold">{createdResult.customer.name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#DDD5C8]/60">
              <span className="text-charcoal-secondary">Customer ID:</span>
              <span className="font-bold text-ferrari">{createdResult.customer.customerId}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#DDD5C8]/60">
              <span className="text-charcoal-secondary">Registered Mobile:</span>
              <span className="font-bold">{createdResult.customer.phone}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-charcoal-secondary">Temporary Password:</span>
              <span className="font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                {createdResult.temporaryPassword}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              onClick={handleCopyCredentials}
              className="btn-secondary text-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Credentials Copied to Clipboard!' : 'Copy Credentials for Customer'}
            </button>

            <div className="flex items-center gap-2">
              <Link
                to={`/admin/loans/create?customerId=${createdResult.customer.id}`}
                className="btn-primary text-xs"
              >
                Proceed to Issue Gold Loan
              </Link>
              <button
                onClick={() => {
                  setCreatedResult(null);
                  navigate('/admin/customers');
                }}
                className="btn-secondary text-xs"
              >
                Back to Customer List
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit(onSubmit)} className="card-compact space-y-4">
          {/* Personal Details */}
          <div>
            <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-2.5 pb-1 border-b border-[#DDD5C8]">
              1. Personal Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  Full Legal Name <span className="text-ferrari">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  {...register('name')}
                  className="input-field"
                />
                {errors.name && (
                  <span className="text-2xs text-ferrari block mt-0.5">{errors.name.message}</span>
                )}
              </div>

              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  Mobile Number (10 digits) <span className="text-ferrari">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  {...register('phone')}
                  className="input-field"
                />
                {errors.phone && (
                  <span className="text-2xs text-ferrari block mt-0.5">{errors.phone.message}</span>
                )}
              </div>

              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  Email Address <span className="text-ferrari">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. customer@example.com"
                  {...register('email')}
                  className="input-field"
                />
                {errors.email && (
                  <span className="text-2xs text-ferrari block mt-0.5">{errors.email.message}</span>
                )}
              </div>

              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  {...register('dateOfBirth')}
                  className="input-field"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  Residential Address <span className="text-ferrari">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Door/Flat no, Street, Landmark"
                  {...register('address')}
                  className="input-field"
                />
                {errors.address && (
                  <span className="text-2xs text-ferrari block mt-0.5">{errors.address.message}</span>
                )}
              </div>

              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  City <span className="text-ferrari">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Bengaluru"
                  {...register('city')}
                  className="input-field"
                />
                {errors.city && (
                  <span className="text-2xs text-ferrari block mt-0.5">{errors.city.message}</span>
                )}
              </div>

              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  State & PIN Code <span className="text-ferrari">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Karnataka"
                    {...register('state')}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="560001"
                    maxLength={6}
                    {...register('pincode')}
                    className="input-field"
                  />
                </div>
                {(errors.state || errors.pincode) && (
                  <span className="text-2xs text-ferrari block mt-0.5">
                    {errors.state?.message || errors.pincode?.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Identity & KYC Verification */}
          <div>
            <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-2.5 pb-1 border-b border-[#DDD5C8]">
              2. Government Identity & KYC
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  Government ID Type <span className="text-ferrari">*</span>
                </label>
                <select {...register('idType')} className="select-field">
                  <option value="AADHAAR">Aadhaar Card (12 digits)</option>
                  <option value="PAN">PAN Card (10 chars)</option>
                  <option value="VOTER_ID">Voter ID Card</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                  <option value="PASSPORT">Passport</option>
                </select>
              </div>

              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  ID Document Number <span className="text-ferrari">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4829-1234-5678"
                  {...register('idNumber')}
                  className="input-field"
                />
                {errors.idNumber && (
                  <span className="text-2xs text-ferrari block mt-0.5">{errors.idNumber.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Account Provisions Note */}
          <div className="p-3 bg-[#fff4f1] border border-[#DDD5C8] rounded text-2xs text-charcoal-secondary space-y-1">
            <div className="font-semibold text-charcoal flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-ferrari" /> Account Access Security
            </div>
            <p>
              Submitting this form will automatically generate a unique <strong>Customer ID</strong> (e.g. CUST-1006) and a secure temporary password. The customer will be prompted to reset their password on their first login.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDD5C8]">
            <Link to="/admin/customers" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {isSubmitting ? 'Registering...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

