import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate, formatWeight } from '../../utils/formatters';
import {
  Coins,
  Gem,
  Calendar,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Lock,
} from 'lucide-react';

export const CustomerLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/loans');
      if (res.data?.success) {
        setLoans(res.data.data.loans);
      }
    } catch (err) {
      console.error('Failed to load customer loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="pb-1 border-b border-[#DDD5C8]">
        <h1 className="text-base font-extrabold text-charcoal tracking-tight">
          Your Gold Loan Accounts
        </h1>
        <p className="text-2xs text-charcoal-secondary">
          Detailed breakdown of your active pledges, schedules, and collateral custody
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-charcoal-secondary text-xs">
          <RefreshCw className="w-5 h-5 animate-spin inline mr-2 text-coffee" />
          Loading your loan records...
        </div>
      ) : loans.length > 0 ? (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="card-compact bg-[#FFFDF9] border border-[#DDD5C8] shadow-card space-y-3"
            >
              {/* Account Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C8]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-coffee">
                      {loan.loanNumber}
                    </span>
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
                  </div>
                  <span className="text-2xs text-charcoal-secondary font-mono block">
                    Sanctioned: {formatDate(loan.startDate)} • Maturity: {formatDate(loan.maturityDate)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-2xs text-charcoal-muted block">Tenure</span>
                  <span className="text-xs font-semibold text-charcoal">
                    {loan.durationMonths} Months
                  </span>
                </div>
              </div>

              {/* Financial Balances Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1 text-2xs">
                <div className="p-2.5 bg-[#FBF8F3] border border-[#DDD5C8]/60 rounded">
                  <span className="text-charcoal-muted block">Sanctioned:</span>
                  <span className="text-xs font-bold text-charcoal">
                    {formatCurrency(loan.loanAmount)}
                  </span>
                </div>
                <div className="p-2.5 bg-[#FBF8F3] border border-[#DDD5C8]/60 rounded">
                  <span className="text-charcoal-muted block">Interest Rate:</span>
                  <span className="text-xs font-bold text-charcoal font-mono">
                    {loan.interestRate}% / mo
                  </span>
                </div>
                <div className="p-2.5 bg-[#FBF8F3] border border-[#DDD5C8]/60 rounded">
                  <span className="text-charcoal-muted block">Accumulated:</span>
                  <span className="text-xs font-bold text-charcoal">
                    {formatCurrency(loan.financials?.accumulatedInterestDue)}
                  </span>
                </div>
                <div className="p-2.5 bg-[#FBF8F3] border border-[#DDD5C8]/60 rounded">
                  <span className="text-charcoal-muted block">Total Outstanding:</span>
                  <span className="text-xs font-bold text-coffee">
                    {formatCurrency(loan.financials?.totalOutstanding)}
                  </span>
                </div>
              </div>

              {/* Collateral Ornaments */}
              <div className="space-y-2 pt-1 border-t border-[#DDD5C8]/60">
                <span className="text-2xs font-bold text-charcoal uppercase tracking-wider block">
                  Collateral Ornaments Under Custody
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {loan.goldItems?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-[#F8F4ED]/60 border border-[#DDD5C8] rounded flex items-center justify-between gap-3 text-xs shadow-subtle hover:border-coffee/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-11 h-11 rounded border border-[#DDD5C8] bg-black/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0].fileUrl}
                              alt={item.description}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Gem className="w-4 h-4 text-amber-700/60" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-charcoal block truncate">{item.itemType}</span>
                          <span className="text-2xs text-charcoal-secondary block truncate">{item.description}</span>
                        </div>
                      </div>

                      <div className="text-right text-2xs font-mono flex-shrink-0">
                        <span className="font-bold text-charcoal block">{formatWeight(item.netWeight)}</span>
                        <span className="text-amber-800 font-semibold">{item.purity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Note */}
              <div className="p-2 bg-[#fff4f1] border border-[#DDD5C8] rounded flex items-center justify-between text-2xs text-charcoal-secondary">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-charcoal-muted" /> Financial terms managed by store administration
                </span>
                {loan.goldReleased ? (
                  <span className="text-emerald-800 font-semibold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Gold Released
                  </span>
                ) : (
                  <span>Secured in Vault</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-compact text-center py-8 text-charcoal-secondary text-xs">
          No gold loan accounts found on record for your profile.
        </div>
      )}
    </div>
  );
};

