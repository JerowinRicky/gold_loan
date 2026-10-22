import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  UserPlus,
  Search,
  Filter,
  Eye,
  PlusCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers', {
        params: { search, filter, page, limit: 12 },
      });
      if (res.data?.success) {
        setCustomers(res.data.data.customers);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalCount(res.data.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, filter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#DDD5C8]">
        <div>
          <h1 className="text-base font-extrabold text-charcoal tracking-tight">
            Customer Directory
          </h1>
          <p className="text-2xs text-charcoal-secondary">
            Total {totalCount} registered customers with credit and collateral profiles
          </p>
        </div>

        <Link to="/admin/customers/create" className="btn-primary">
          <UserPlus className="w-3.5 h-3.5" />
          Register New Customer
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="card-compact bg-[#FBF8F3] flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-charcoal-subtle" />
            <input
              type="text"
              placeholder="Search by name, 10-digit phone, or Customer ID..."
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
          <span className="text-2xs text-charcoal-secondary font-medium">Filter:</span>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="select-field w-auto text-xs py-1"
          >
            <option value="ALL">All Customers</option>
            <option value="HAS_LOAN">With Active Loan</option>
            <option value="NO_LOAN">No Active Loan</option>
            <option value="ACTIVE">Active Status</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setFilter('ALL');
              setPage(1);
              fetchCustomers();
            }}
            className="p-1.5 text-charcoal hover:bg-[#EADCC8] rounded border border-[#DDD5C8]"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Customer List Table */}
      <div className="card-compact">
        <div className="overflow-x-auto">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Full Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Active Loans</th>
                <th>Total Outstanding</th>
                <th>Last Payment</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-charcoal-secondary">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-ferrari" />
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono text-2xs font-bold text-charcoal">
                      {c.customerId || 'PENDING'}
                    </td>
                    <td className="font-semibold text-charcoal">
                      {c.name}
                    </td>
                    <td className="font-mono text-2xs text-charcoal-secondary">
                      {c.phone}
                    </td>
                    <td className="text-2xs text-charcoal-secondary">
                      {c.email}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          c.activeLoansCount > 0 ? 'badge-active' : 'badge-closed'
                        }`}
                      >
                        {c.activeLoansCount} Active
                      </span>
                    </td>
                    <td className="font-bold text-charcoal">
                      {Number(c.totalOutstanding) > 0 ? (
                        <span className="text-ferrari">{formatCurrency(c.totalOutstanding)}</span>
                      ) : (
                        <span className="text-charcoal-muted">₹0</span>
                      )}
                    </td>
                    <td className="text-2xs text-charcoal-secondary font-mono">
                      {c.lastPayment ? (
                        <div>
                          <span className="font-semibold text-charcoal block">
                            {formatCurrency(c.lastPayment.amount)}
                          </span>
                          <span>{formatDate(c.lastPayment.paidAt)}</span>
                        </div>
                      ) : (
                        <span className="text-charcoal-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-active">{c.status}</span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/admin/loans/create?customerId=${c.id}`}
                          className="btn-secondary text-2xs py-0.5 px-2 text-ferrari font-semibold"
                          title="Create loan for this customer"
                        >
                          <PlusCircle className="w-3 h-3" />
                          New Loan
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-charcoal-secondary text-2xs">
                    No customers found matching your criteria.
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

