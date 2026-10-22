import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Coins,
  Search,
  Filter,
  PlusCircle,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const LoansPage: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/loans', {
        params: { search, status, page, limit: 12 },
      });
      if (res.data?.success) {
        setLoans(res.data.data.loans);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalCount(res.data.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [page, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLoans();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#DDD5C8]">
        <div>
          <h1 className="text-base font-extrabold text-charcoal tracking-tight">
            Gold Loan Accounts
          </h1>
          <p className="text-2xs text-charcoal-secondary">
            Total {totalCount} loan contracts pledged with gold collateral
          </p>
        </div>

        <Link to="/admin/loans/create" className="btn-primary">
          <PlusCircle className="w-3.5 h-3.5" />
          Sanction New Gold Loan
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="card-compact bg-[#FBF8F3] flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-charcoal-subtle" />
            <input
              type="text"
              placeholder="Search by loan number (GL-...), customer name or phone..."
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
          <span className="text-2xs text-charcoal-secondary font-medium">Status:</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="select-field w-auto text-xs py-1"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CLOSED">Closed & Settled</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setStatus('ALL');
              setPage(1);
              fetchLoans();
            }}
            className="p-1.5 text-charcoal hover:bg-[#EADCC8] rounded border border-[#DDD5C8]"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Loans Table */}
      <div className="card-compact">
        <div className="overflow-x-auto">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Loan Number</th>
                <th>Customer</th>
                <th>Sanctioned Amount</th>
                <th>Monthly Rate</th>
                <th>Tenure</th>
                <th>Start Date</th>
                <th>Maturity Date</th>
                <th>Total Outstanding</th>
                <th>Gold Release</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-6 text-charcoal-secondary">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-ferrari" />
                    Loading loan records...
                  </td>
                </tr>
              ) : loans.length > 0 ? (
                loans.map((l) => (
                  <tr key={l.id}>
                    <td className="font-mono text-2xs font-bold text-ferrari">
                      {l.loanNumber}
                    </td>
                    <td>
                      <span className="font-semibold block">{l.customer?.name}</span>
                      <span className="text-2xs text-charcoal-secondary">
                        {l.customer?.customerId} • {l.customer?.phone}
                      </span>
                    </td>
                    <td className="font-bold text-charcoal">
                      {formatCurrency(l.loanAmount)}
                    </td>
                    <td className="text-2xs font-mono font-semibold">
                      {l.interestRate}% / mo
                    </td>
                    <td className="text-2xs text-charcoal-secondary font-mono">
                      {l.durationMonths} Months
                    </td>
                    <td className="text-2xs text-charcoal-secondary font-mono">
                      {formatDate(l.startDate)}
                    </td>
                    <td className="text-2xs font-mono">
                      {formatDate(l.maturityDate)}
                    </td>
                    <td className="font-bold text-charcoal">
                      {Number(l.financials?.totalOutstanding) > 0 ? (
                        <span className={l.status === 'OVERDUE' ? 'text-ferrari' : 'text-charcoal'}>
                          {formatCurrency(l.financials?.totalOutstanding)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">Settled</span>
                      )}
                    </td>
                    <td>
                      {l.goldReleased ? (
                        <span className="badge badge-active flex items-center gap-1 w-max">
                          <ShieldCheck className="w-2.5 h-2.5" /> Released
                        </span>
                      ) : (
                        <span className="text-2xs text-charcoal-secondary">In Safe Vault</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          l.status === 'ACTIVE'
                            ? 'badge-active'
                            : l.status === 'OVERDUE'
                            ? 'badge-overdue'
                            : 'badge-closed'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/admin/loans/${l.id}`}
                        className="btn-secondary text-2xs py-0.5 px-2 font-semibold"
                      >
                        <ExternalLink className="w-3 h-3 text-ferrari" />
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="text-center py-6 text-charcoal-secondary text-2xs">
                    No loans found matching your search.
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
    </div>
  );
};

