import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../api/client';
import { TableSkeleton } from '../../components/common/Skeleton';
import { AuditLog } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ['audit-logs', { page, action: actionFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(actionFilter && { action: actionFilter }),
      });
      const res = await apiClient.get(`/audit-logs?${params.toString()}`);
      return res.data;
    },
  });

  const logs: AuditLog[] = logsResponse?.data || [];
  const meta = logsResponse?.meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security & Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable audit trail recording security events, data modifications, and user access.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Audit Actions</option>
          <option value="USER_LOGIN">User Login</option>
          <option value="CREATE_LEAD">Create Lead</option>
          <option value="UPDATE_LEAD">Update Lead</option>
          <option value="DELETE_LEAD">Delete Lead</option>
          <option value="CREATE_DEAL">Create Deal</option>
          <option value="UPDATE_DEAL_STAGE">Update Deal Stage</option>
          <option value="INVITE_MEMBER">Invite Member</option>
          <option value="REGISTER_ORGANIZATION">Register Organization</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">IP & Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.user ? (
                        <span className="font-bold text-slate-900">
                          {log.user.firstName} {log.user.lastName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">System</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {log.entity} {log.entityId && <span className="text-[10px] text-slate-400">({log.entityId.slice(0, 8)})</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] truncate max-w-xs">
                      {log.ipAddress} • {log.userAgent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {logs.length} of {meta.total} audit events
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded border border-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold">
                Page {meta.page} of {meta.totalPages || 1}
              </span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 rounded border border-slate-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
