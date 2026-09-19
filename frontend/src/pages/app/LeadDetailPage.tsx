import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  Send,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [activityType, setActivityType] = useState('NOTE');

  // Query Lead Details
  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await apiClient.get(`/leads/${id}`);
      return res.data.data;
    },
  });

  // Mutation: Log Activity / Note
  const logActivityMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post('/activities', {
        leadId: id,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      setNoteContent('');
      success('Activity Logged', 'Your note has been added to the timeline.');
    },
  });

  // Mutation: Convert Lead
  const convertMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/leads/${id}/convert`, { createDeal: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      success('Lead Converted', 'Successfully converted to customer with initial deal.');
    },
  });

  // Mutation: Delete Lead
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      navigate('/leads');
      success('Lead Deleted', 'Lead removed successfully.');
    },
  });

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading lead details...</div>;
  }

  if (!lead) {
    return (
      <div className="p-12 text-center">
        <p className="text-base font-bold text-slate-800">Lead not found</p>
        <Link to="/leads" className="text-xs text-indigo-600 font-semibold mt-2 inline-block">
          Return to Leads
        </Link>
      </div>
    );
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    logActivityMutation.mutate({
      type: activityType,
      title: `${activityType.replace('_', ' ')}: ${noteContent.slice(0, 30)}...`,
      description: noteContent,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/leads')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>
        <div className="flex items-center gap-2">
          {lead.status !== 'QUALIFIED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => convertMutation.mutate()}
              isLoading={convertMutation.isPending}
              leftIcon={<Building2 className="w-4 h-4 text-emerald-600" />}
            >
              Convert to Customer
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            onClick={() => setIsDeleteOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">
              {lead.firstName} {lead.lastName}
            </h1>
            <Badge statusValue={lead.status}>{lead.status}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>{lead.company || 'Individual Prospect'}</span>
            {lead.title && <span>• {lead.title}</span>}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 font-medium">Estimated Value</span>
          <p className="text-2xl font-black text-slate-900 mt-0.5">
            ${lead.estimatedValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Grid: Details + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact & Lead info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
              Contact Details
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline">
                  {lead.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{lead.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Created {new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
              Assignment & Origin
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">Lead Source</span>
                <p className="font-semibold text-slate-800 mt-0.5">{lead.source.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Assigned Representative</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {lead.assignedToUser
                    ? `${lead.assignedToUser.firstName} ${lead.assignedToUser.lastName}`
                    : 'Unassigned'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Notes (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Note Input Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Add Note or Log Activity
              </h3>
              <div className="flex items-center gap-1">
                {['NOTE', 'CALL', 'MEETING', 'EMAIL'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActivityType(t)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      activityType === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder={`Log a ${activityType.toLowerCase()} or note about this prospect...`}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" isLoading={logActivityMutation.isPending} leftIcon={<Send className="w-3.5 h-3.5" />}>
                  Save Activity
                </Button>
              </div>
            </form>
          </div>

          {/* Activity Timeline Stream */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
              Activity Timeline
            </h3>

            {(!lead.activities || lead.activities.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-6">No activities recorded yet</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {lead.activities.map((act: any) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-indigo-50 border-2 border-indigo-600 flex items-center justify-center" />
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{act.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {act.description && (
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {act.description}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        By {act.performedByUser?.firstName || 'System'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {isDeleteOpen && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
          title="Delete Lead"
          message={`Are you sure you want to delete ${lead.firstName} ${lead.lastName}? This cannot be undone.`}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};
