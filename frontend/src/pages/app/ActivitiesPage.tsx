import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  Phone,
  Mail,
  Users,
  FileText,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Activity } from '../../types';

export const ActivitiesPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState('');

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', { type: typeFilter }],
    queryFn: async () => {
      const params = typeFilter ? `?type=${typeFilter}` : '';
      const res = await apiClient.get(`/activities${params}`);
      return res.data.data;
    },
  });

  const filterTabs = [
    { label: 'All Activities', value: '' },
    { label: 'Calls', value: 'CALL' },
    { label: 'Emails', value: 'EMAIL' },
    { label: 'Meetings', value: 'MEETING' },
    { label: 'Notes', value: 'NOTE' },
    { label: 'Status Changes', value: 'STATUS_CHANGE' },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <Phone className="w-4 h-4 text-emerald-500" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-sky-500" />;
      case 'MEETING':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'STATUS_CHANGE':
        return <RefreshCw className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Activity Log Stream</h1>
        <p className="text-xs text-slate-500 mt-1">
          Chronological audit of team calls, customer correspondence, and stage changes.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTypeFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              typeFilter === tab.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activities Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading activities...</div>
        ) : (!activities || activities.length === 0) ? (
          <div className="p-8 text-center text-xs text-slate-400">No activities found</div>
        ) : (
          <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.map((act: Activity) => (
              <div key={act.id} className="relative">
                <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-sm">
                  {getIcon(act.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{act.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {act.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                      {act.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                    <span>By {act.performedByUser?.firstName || 'System'}</span>
                    {act.customer && <span>• Customer: {act.customer.name}</span>}
                    {act.lead && <span>• Lead: {act.lead.firstName} {act.lead.lastName}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
