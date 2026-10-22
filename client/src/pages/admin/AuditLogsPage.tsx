import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { History, Shield, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [entityType, setEntityType] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/audit-logs', {
        params: { entityType, page, limit: 20 },
      });
      if (res.data?.success) {
        setLogs(res.data.data.logs);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityType, page]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#DDD5C8]">
        <div>
          <h1 className="text-base font-extrabold text-charcoal tracking-tight">
            Compliance & Financial Modification Audit Trail
          </h1>
          <p className="text-2xs text-charcoal-secondary">
            Immutable log of all financial modifications, loan creations, repayments, and gold release authorizations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-charcoal-secondary" />
          <span className="text-2xs font-semibold text-charcoal">Filter Entity:</span>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="select-field w-auto text-xs py-1"
          >
            <option value="ALL">All Entities</option>
            <option value="LOAN">Loans</option>
            <option value="PAYMENT">Payments</option>
            <option value="CUSTOMER">Customers</option>
            <option value="APPOINTMENT">Appointments</option>
            <option value="GOLD_ITEM">Gold Items</option>
            <option value="SETTINGS">Settings</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-compact">
        <div className="overflow-x-auto">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Authorizing User</th>
                <th>Action Type</th>
                <th>Entity Target</th>
                <th>Entity ID</th>
                <th>Modification Audit Value</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-charcoal-secondary">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-ferrari" />
                    Fetching audit trail...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-2xs font-mono text-charcoal-secondary whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="font-semibold text-charcoal whitespace-nowrap">
                      {log.userName || 'System'}
                    </td>
                    <td>
                      <span className="badge badge-active text-2xs font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-pending">{log.entityType}</span>
                    </td>
                    <td className="font-mono text-2xs text-charcoal-muted max-w-[120px] truncate">
                      {log.entityId}
                    </td>
                    <td className="text-2xs font-mono max-w-sm truncate text-charcoal-secondary">
                      {log.newValue || log.oldValue || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-charcoal-secondary text-2xs">
                    No audit records found.
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
    </div>
  );
};

