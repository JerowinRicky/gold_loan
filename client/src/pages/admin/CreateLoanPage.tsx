import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '../../utils/zodResolver';
import { z } from 'zod';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import {
  Coins,
  ArrowLeft,
  Plus,
  Trash2,
  Gem,
  CheckCircle2,
  Calculator,
  Upload,
} from 'lucide-react';

const goldItemSchema = z.object({
  itemType: z.string().min(2, 'Item type required'),
  description: z.string().min(2, 'Description required'),
  grossWeight: z.coerce.number().positive('Must be > 0'),
  netWeight: z.coerce.number().positive('Must be > 0'),
  purity: z.string().min(2, 'Purity required'),
  estimatedValue: z.coerce.number().positive('Value must be > 0'),
  loanValue: z.coerce.number().positive('Loan value must be > 0'),
  notes: z.string().optional(),
});

const loanFormSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  loanAmount: z.coerce.number().positive('Loan amount must be greater than 0'),
  interestRate: z.coerce.number().positive('Interest rate must be positive'),
  durationMonths: z.coerce.number().int().min(1).max(36),
  startDate: z.string().min(1, 'Start date is required'),
  processingFee: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  goldItems: z.array(goldItemSchema).min(1, 'At least one gold item is required'),
});

type FormData = z.infer<typeof loanFormSchema>;

export const CreateLoanPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState<any[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      customerId: preselectedCustomerId,
      interestRate: 2.0,
      durationMonths: 6,
      startDate: new Date().toISOString().split('T')[0],
      processingFee: 500,
      goldItems: [
        {
          itemType: 'Gold Chain',
          description: '22K Hallmarked curb chain with hook lock',
          grossWeight: 18.42,
          netWeight: 17.95,
          purity: '22K (916)',
          estimatedValue: 195000,
          loanValue: 135000,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'goldItems',
  });

  const watchedAmount = watch('loanAmount') || 0;
  const watchedRate = watch('interestRate') || 0;
  const watchedDuration = watch('durationMonths') || 0;
  const watchedGoldItems = watch('goldItems') || [];

  // Fetch customer list for dropdown
  useEffect(() => {
    api.get('/customers?limit=100').then((res) => {
      if (res.data?.success) {
        setCustomers(res.data.data.customers);
      }
    });
  }, []);

  const totalAssessedValue = watchedGoldItems.reduce(
    (acc, item) => acc + (Number(item.estimatedValue) || 0),
    0
  );
  const totalNetWeight = watchedGoldItems.reduce(
    (acc, item) => acc + (Number(item.netWeight) || 0),
    0
  );
  const estMonthlyInterest = ((Number(watchedAmount) * Number(watchedRate)) / 100).toFixed(2);

  const onSubmit = async (values: FormData) => {
    try {
      setServerError(null);
      const res = await api.post('/loans', values);
      if (res.data?.success) {
        navigate(`/admin/loans/${res.data.data.id}`);
      }
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to create gold loan');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C8]">
        <div className="flex items-center gap-2">
          <Link
            to="/admin/loans"
            className="p-1.5 text-charcoal hover:bg-[#EADCC8] rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-extrabold text-charcoal tracking-tight">
              Sanction New Gold Loan & Collateral Pledge
            </h1>
            <p className="text-2xs text-charcoal-secondary">
              Record physical jewelry assessment, weight verification, and generate repayment terms
            </p>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 text-ferrari text-xs rounded">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Customer & Loan Terms */}
        <div className="card-compact space-y-3">
          <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider pb-1 border-b border-[#DDD5C8] flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-ferrari" />
            1. Borrower & Financial Loan Terms
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Customer Select */}
            <div className="sm:col-span-3">
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Select Customer / Borrower <span className="text-ferrari">*</span>
              </label>
              <select {...register('customerId')} className="select-field">
                <option value="">-- Choose registered customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerId ? `[${c.customerId}] ` : ''}{c.name} • {c.phone}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <span className="text-2xs text-ferrari block mt-0.5">{errors.customerId.message}</span>
              )}
            </div>

            {/* Loan Amount */}
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Loan Sanctioned (₹) <span className="text-ferrari">*</span>
              </label>
              <input
                type="number"
                step="500"
                placeholder="e.g. 50000"
                {...register('loanAmount')}
                className="input-field font-bold"
              />
              {errors.loanAmount && (
                <span className="text-2xs text-ferrari block mt-0.5">{errors.loanAmount.message}</span>
              )}
            </div>

            {/* Interest Rate */}
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Monthly Interest Rate (%) <span className="text-ferrari">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 2.0"
                {...register('interestRate')}
                className="input-field"
              />
              <span className="text-2xs text-charcoal-muted block mt-0.5">
                Standard: 1.8% to 2.0% per month
              </span>
            </div>

            {/* Duration */}
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Repayment Tenure (Months) <span className="text-ferrari">*</span>
              </label>
              <select {...register('durationMonths')} className="select-field">
                <option value={3}>3 Months</option>
                <option value={6}>6 Months (Standard)</option>
                <option value={12}>12 Months (1 Year)</option>
                <option value={24}>24 Months</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Loan Sanction Date <span className="text-ferrari">*</span>
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="input-field"
              />
            </div>

            {/* Processing Fee */}
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Processing Fee / Charges (₹)
              </label>
              <input
                type="number"
                step="50"
                {...register('processingFee')}
                className="input-field"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-3">
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Loan Remarks / Special Conditions
              </label>
              <input
                type="text"
                placeholder="e.g. Traditional family jewelry, borrower requested 6-month term"
                {...register('notes')}
                className="input-field"
              />
            </div>
          </div>

          {/* Quick Real-Time Financial Preview Pill */}
          <div className="p-2.5 bg-[#fff4f1] border border-[#DDD5C8] rounded flex flex-wrap items-center justify-between text-2xs gap-3">
            <div>
              <span className="text-charcoal-secondary block">Monthly Interest:</span>
              <span className="font-extrabold text-charcoal">₹{estMonthlyInterest} / month</span>
            </div>
            <div>
              <span className="text-charcoal-secondary block">Total Collateral Net Weight:</span>
              <span className="font-bold text-charcoal">{totalNetWeight.toFixed(2)} grams</span>
            </div>
            <div>
              <span className="text-charcoal-secondary block">Total Market Assessed Value:</span>
              <span className="font-extrabold text-emerald-800">{formatCurrency(totalAssessedValue)}</span>
            </div>
            <div>
              <span className="text-charcoal-secondary block">Loan to Value (LTV):</span>
              <span className="font-bold text-ferrari">
                {totalAssessedValue > 0
                  ? `${Math.round((Number(watchedAmount) / totalAssessedValue) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Pledged Gold Items Section */}
        <div className="card-compact space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#DDD5C8]">
            <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5 text-amber-700" />
              2. Pledged Gold Items & Ornaments ({fields.length})
            </h2>

            <button
              type="button"
              onClick={() =>
                append({
                  itemType: 'Gold Ring',
                  description: '22K Hallmarked ornament',
                  grossWeight: 6.5,
                  netWeight: 6.2,
                  purity: '22K (916)',
                  estimatedValue: 65000,
                  loanValue: 45000,
                })
              }
              className="btn-secondary text-2xs py-1 px-2"
            >
              <Plus className="w-3 h-3 text-ferrari" />
              Add Another Ornament
            </button>
          </div>

          {errors.goldItems && (
            <span className="text-2xs text-ferrari block">{errors.goldItems.message}</span>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-3 bg-[#FBF8F3] border border-[#DDD5C8] rounded space-y-2 relative"
              >
                <div className="flex items-center justify-between text-2xs font-bold text-charcoal border-b border-[#DDD5C8]/70 pb-1">
                  <span>Ornament Item #{index + 1}</span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-ferrari hover:text-red-700 flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-2xs font-semibold text-charcoal block mb-0.5">
                      Item Category <span className="text-ferrari">*</span>
                    </label>
                    <select
                      {...register(`goldItems.${index}.itemType` as const)}
                      className="select-field"
                    >
                      <option value="Gold Chain">Gold Chain</option>
                      <option value="Gold Ring">Gold Ring</option>
                      <option value="Gold Bangles">Gold Bangles</option>
                      <option value="Gold Necklace">Gold Necklace</option>
                      <option value="Gold Bracelet">Gold Bracelet</option>
                      <option value="Gold Coins">Gold Bullion Coins</option>
                      <option value="Gold Earrings">Gold Earrings</option>
                      <option value="Other">Other Ornament</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-2xs font-semibold text-charcoal block mb-0.5">
                      Detailed Physical Description <span className="text-ferrari">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 22K Hallmarked curb chain with S-hook"
                      {...register(`goldItems.${index}.description` as const)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-charcoal block mb-0.5">
                      Purity / Hallmarking <span className="text-ferrari">*</span>
                    </label>
                    <select
                      {...register(`goldItems.${index}.purity` as const)}
                      className="select-field"
                    >
                      <option value="22K (916)">22K (916 Hallmarked)</option>
                      <option value="24K (999)">24K (999 Pure Bullion)</option>
                      <option value="20K">20K Standard</option>
                      <option value="18K (750)">18K (750 Purity)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-charcoal block mb-0.5">
                      Gross Weight (g) <span className="text-ferrari">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="18.42"
                      {...register(`goldItems.${index}.grossWeight` as const)}
                      className="input-field font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-charcoal block mb-0.5">
                      Net Gold Weight (g) <span className="text-ferrari">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="17.95"
                      {...register(`goldItems.${index}.netWeight` as const)}
                      className="input-field font-mono font-bold text-charcoal"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-charcoal block mb-0.5">
                      Assessed Market Value (₹) <span className="text-ferrari">*</span>
                    </label>
                    <input
                      type="number"
                      step="500"
                      placeholder="195000"
                      {...register(`goldItems.${index}.estimatedValue` as const)}
                      className="input-field font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-charcoal block mb-0.5">
                      Max Loan Eligibility (₹) <span className="text-ferrari">*</span>
                    </label>
                    <input
                      type="number"
                      step="500"
                      placeholder="135000"
                      {...register(`goldItems.${index}.loanValue` as const)}
                      className="input-field font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDD5C8]">
          <Link to="/admin/loans" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isSubmitting ? 'Sanctioning Loan...' : 'Sanction & Issue Gold Loan'}
          </button>
        </div>
      </form>
    </div>
  );
};

