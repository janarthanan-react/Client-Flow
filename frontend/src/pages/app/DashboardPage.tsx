import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users2,
  Building2,
  DollarSign,
  TrendingUp,
  Target,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Check,
  Plus,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { apiClient } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../contexts/ToastContext';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  // Fetch primary dashboard analytics
  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/dashboard');
      return res.data.data;
    },
  });

  // Fetch monthly revenue data
  const { data: revenueData } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/revenue');
      return res.data.data;
    },
  });

  // Fetch lead sources
  const { data: sourcesData } = useQuery({
    queryKey: ['analytics', 'sources'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/sources');
      return res.data.data;
    },
  });

  // Fetch pipeline stage metrics
  const { data: pipelineData } = useQuery({
    queryKey: ['analytics', 'pipeline'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/pipeline');
      return res.data.data;
    },
  });

  // Local state for instant optimistic checkbox tick
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  // Mutation for quick task toggle
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiClient.patch(`/tasks/${id}`, { status });
    },
    onSuccess: (_, vars) => {
      success('Task Updated', vars.status === 'COMPLETED' ? 'Task marked as completed! 🎉' : 'Task restored to active.');
      // Keep tick visible for a moment before refetching so user enjoys the completion feeling
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        setCompletedTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(vars.id);
          return next;
        });
      }, 700);
    },
    onError: (err: any, vars) => {
      // Rollback on error
      setCompletedTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(vars.id);
        return next;
      });
      toastError('Error', err.response?.data?.message || 'Could not update task');
    },
  });

  const handleToggleTask = (id: string, currentStatus: string) => {
    const isCompleted = completedTaskIds.has(id) || currentStatus === 'COMPLETED';
    const nextStatus = isCompleted ? 'TODO' : 'COMPLETED';

    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (isCompleted) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    toggleTaskMutation.mutate({ id, status: nextStatus });
  };

  if (dashLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const metrics = dashData?.metrics || {
    totalLeads: 0,
    qualifiedLeads: 0,
    totalCustomers: 0,
    openDealsCount: 0,
    totalRevenue: 0,
    totalPipelineValue: 0,
    conversionRate: 0,
    winRate: 0,
  };

  const recentLeads = dashData?.recentLeads || [];
  const recentActivities = dashData?.recentActivities || [];
  const upcomingTasks = dashData?.upcomingTasks || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time revenue pipeline, lead flow velocity, and active deals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/leads"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-sm hover:shadow-indigo-500/25 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </Link>
          <Link
            to="/pipeline"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <Briefcase className="w-4 h-4" />
            Open Pipeline
          </Link>
        </div>
      </div>

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pipeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pipeline
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ${metrics.totalPipelineValue.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-indigo-600 font-bold">{metrics.openDealsCount} open deals</span>
            <span>across stages</span>
          </div>
        </div>

        {/* Won Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-emerald-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Closed Revenue
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            ${metrics.totalRevenue.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-emerald-600 font-bold">{metrics.winRate}% win rate</span>
            <span>on completed deals</span>
          </div>
        </div>

        {/* Total Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-purple-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Leads
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-xs">
              <Users2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.totalLeads}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-purple-600 font-bold">{metrics.conversionRate}% qualified</span>
            <span>conversion rate</span>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-sky-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Customers
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.totalCustomers}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-sky-600 font-bold">100% active</span>
            <span>account retention</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue Performance</h2>
              <p className="text-xs text-slate-500">Actual won revenue vs sales target</p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200/60">
              Current Year
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  }}
                />
                <Area type="monotone" dataKey="revenue" name="Won Revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="target" name="Monthly Target" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Donut Chart (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900">Lead Sources</h2>
              <Link to="/leads" className="text-xs text-indigo-600 font-semibold hover:underline">
                View all
              </Link>
            </div>
            <p className="text-xs text-slate-500">Distribution by acquisition channel</p>
          </div>
          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourcesData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {(sourcesData || []).map((entry: any, index: number) => {
                    const color = entry.source === 'OTHER' ? '#ec4899' : (entry.color || '#6366f1');
                    return (
                      <Cell key={`cell-${index}`} fill={color} />
                    );
                  })}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const color = data.source === 'OTHER' ? '#ec4899' : (data.color || '#6366f1');
                      const totalCount = (sourcesData || []).reduce((acc: number, curr: any) => acc + (curr.count || 0), 0);
                      const percentage = totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0;
                      return (
                        <div className="bg-slate-900 border border-slate-700/90 rounded-xl px-3.5 py-2.5 shadow-2xl text-xs z-50 pointer-events-none">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: color }}
                            />
                            <span className="font-semibold text-slate-200">
                              {data.name}
                            </span>
                          </div>
                          <div className="text-white font-bold text-sm flex items-baseline gap-1.5">
                            <span>{data.count} leads</span>
                            <span className="text-slate-400 text-xs font-medium">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            {(sourcesData || []).map((s: any, idx: number) => {
              const color = s.source === 'OTHER' ? '#ec4899' : (s.color || '#6366f1');
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-50 transition-colors duration-150"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-slate-600 truncate">{s.name}:</span>
                  <span className="font-bold text-slate-900 ml-auto">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Leads & Activity Timeline & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Inbound Leads</h2>
              <p className="text-xs text-slate-500">Latest prospects registered in CRM</p>
            </div>
            <Link
              to="/leads"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              All Leads{' '}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Est. Value</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentLeads.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-indigo-50/30 transition-colors duration-150">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{lead.company || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge statusValue={lead.status}>{lead.status}</Badge>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ${lead.estimatedValue?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {lead.assignedToUser ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center">
                            {lead.assignedToUser.firstName?.[0]}
                          </div>
                          <span>{lead.assignedToUser.firstName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Tasks Widget (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Priority Tasks</h2>
                <p className="text-xs text-slate-500">Actions requiring attention</p>
              </div>
              <Link to="/tasks" className="text-xs text-indigo-600 font-semibold hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-2.5">
              {upcomingTasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No pending tasks</p>
              ) : (
                upcomingTasks.map((t: any) => {
                  const isCompleted = completedTaskIds.has(t.id) || t.status === 'COMPLETED';
                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-all duration-200 shadow-2xs ${
                        isCompleted
                          ? 'bg-slate-100/70 border-slate-200/80 opacity-80'
                          : 'bg-slate-50/80 border-slate-200/80 hover:bg-indigo-50/30 hover:border-indigo-200/70 hover:-translate-y-0.5'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTask(t.id, t.status)}
                        className={`w-4 h-4 mt-0.5 rounded-md border flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer ${
                          isCompleted
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs scale-105'
                            : 'border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/60'
                        }`}
                        aria-label={`Mark ${t.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
                      >
                        {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-semibold truncate transition-all duration-150 ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge statusValue={t.priority} size="sm">
                            {t.priority}
                          </Badge>
                          {t.dueDate && (
                            <span className="text-[10px] text-slate-400">
                              Due {new Date(t.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <Link
            to="/tasks"
            className="mt-4 block w-full text-center py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-700 text-xs font-bold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            Manage All Tasks
          </Link>
        </div>
      </div>
    </div>
  );
};
