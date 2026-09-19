import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Plus,
  Send,
  Briefcase,
  CheckSquare,
  Clock,
  Trash2,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../contexts/ToastContext';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success } = useToast();

  const [noteContent, setNoteContent] = useState('');
  const [activityType, setActivityType] = useState('NOTE');

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await apiClient.get(`/customers/${id}`);
      return res.data.data;
    },
  });

  const logActivityMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post(`/customers/${id}/activities`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      setNoteContent('');
      success('Activity Recorded', 'Activity saved to customer history.');
    },
  });

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading customer account...</div>;
  }

  if (!customer) {
    return (
      <div className="p-12 text-center">
        <p className="text-base font-bold text-slate-800">Customer account not found</p>
        <Link to="/customers" className="text-xs text-indigo-600 font-semibold mt-2 inline-block">
          Return to Customers
        </Link>
      </div>
    );
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    logActivityMutation.mutate({
      type: activityType,
      title: `${activityType}: ${noteContent.slice(0, 30)}...`,
      description: noteContent,
    });
  };

  const wonDeals = customer.deals?.filter((d: any) => d.stage === 'CLOSED_WON') || [];
  const wonRevenue = wonDeals.reduce((sum: number, d: any) => sum + d.amount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">{customer.name}</h1>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                customer.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {customer.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{customer.company || 'Private Client'}</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Lifetime Won Revenue</span>
            <p className="text-2xl font-black text-emerald-600">${wonRevenue.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Active Deals</span>
            <p className="text-2xl font-black text-slate-900">{customer.deals?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact info & Linked Deals */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
              Account Information
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href={`mailto:${customer.email}`} className="text-indigo-600 hover:underline">
                  {customer.email}
                </a>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.website && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <a href={customer.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                    {customer.website}
                  </a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Linked Deals List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Linked Deals ({customer.deals?.length || 0})
              </h3>
              <Link to="/pipeline" className="text-xs text-indigo-600 font-semibold hover:underline">
                View Pipeline
              </Link>
            </div>
            <div className="space-y-2">
              {(!customer.deals || customer.deals.length === 0) ? (
                <p className="text-xs text-slate-400 py-2">No deals opened for this customer.</p>
              ) : (
                customer.deals.map((deal: any) => (
                  <div key={deal.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{deal.title}</p>
                      <span className="text-[10px] text-slate-400">{deal.stage.replace('_', ' ')}</span>
                    </div>
                    <span className="font-bold text-slate-900">${deal.amount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Activities Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Note Input */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Log Note or Call
            </h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Log notes regarding contract renewal, technical requirements..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" isLoading={logActivityMutation.isPending} leftIcon={<Send className="w-3.5 h-3.5" />}>
                  Save to Account
                </Button>
              </div>
            </form>
          </div>

          {/* Timeline Feed */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
              Account Activity History
            </h3>
            {(!customer.activities || customer.activities.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-6">No activities logged yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {customer.activities.map((act: any) => (
                  <div key={act.id} className="py-3.5 first:pt-0 last:pb-0 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{act.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {act.description && (
                      <p className="text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {act.description}
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 inline-block">
                      By {act.performedByUser?.firstName || 'User'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
