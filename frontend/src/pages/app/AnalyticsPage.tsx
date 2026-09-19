import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Award,
  Calendar,
  Percent,
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
import { CardSkeleton } from '../../components/common/Skeleton';

export const AnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');

  // Query primary dashboard data
  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['analytics', 'dashboard', dateRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/dashboard');
      return res.data.data;
    },
  });

  // Query revenue
  const { data: revenueData } = useQuery({
    queryKey: ['analytics', 'revenue', dateRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/revenue');
      return res.data.data;
    },
  });

  // Query lead growth
  const { data: leadsGrowthData } = useQuery({
    queryKey: ['analytics', 'leads', dateRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/leads');
      return res.data.data;
    },
  });

  // Query sources
  const { data: sourcesData } = useQuery({
    queryKey: ['analytics', 'sources', dateRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/sources');
      return res.data.data;
    },
  });

  // Query deals pipeline
  const { data: pipelineData } = useQuery({
    queryKey: ['analytics', 'pipeline', dateRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/pipeline');
      return res.data.data;
    },
  });

  // Query team
  const { data: teamData } = useQuery({
    queryKey: ['analytics', 'team', dateRange],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/team');
      return res.data.data;
    },
  });

  if (dashLoading) {
    return <CardSkeleton />;
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

  const avgDealValue =
    metrics.openDealsCount > 0
      ? Math.round(metrics.totalPipelineValue / metrics.openDealsCount)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Revenue & Sales Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Data-driven insights into sales funnel health, team velocity, and conversion performance.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateRange === range
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lead Conversion</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.conversionRate}%</p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">Qualified to Prospect</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deal Win Rate</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{metrics.winRate}%</p>
          <span className="text-[10px] text-slate-500 mt-1 inline-block">Closed Won deals ratio</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Deal Size</span>
          <p className="text-2xl font-black text-slate-900 mt-1">${avgDealValue.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500 mt-1 inline-block">Across active pipeline</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Booked Revenue</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">${metrics.totalRevenue.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">Closed revenue YTD</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Revenue Trajectory</h3>
            <p className="text-xs text-slate-500">Won revenue performance across months</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fill="url(#areaRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Creation & Qualification */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Lead Volume & Qualification</h3>
            <p className="text-xs text-slate-500">New leads vs qualified conversion</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsGrowthData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="total" name="Total Ingested" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="qualified" name="Qualified" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Team Leaderboard Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Sales Team Velocity Leaderboard</h3>
          <p className="text-xs text-slate-500">Performance benchmarking across assigned leads and won deals</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Representative</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Leads Managed</th>
                <th className="py-3 px-4">Deals Closed</th>
                <th className="py-3 px-4">Revenue Booked</th>
                <th className="py-3 px-4">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(teamData || []).map((member: any) => (
                <tr key={member.userId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{member.name}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{member.totalLeads}</td>
                  <td className="py-3 px-4 font-semibold text-indigo-600">{member.wonDeals}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">${member.wonRevenue.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${member.winRate}%` }}
                        />
                      </div>
                      <span className="font-bold">{member.winRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
