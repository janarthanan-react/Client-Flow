import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  Building2,
  Trash2,
  Edit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Sparkles,
  Users2,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { Lead } from '../../types';

export const LeadsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  // Filter and pagination state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);

  // Form for New Lead
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Query leads
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', { page, search, status: statusFilter, source: sourceFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(sourceFilter && { source: sourceFilter }),
      });
      const res = await apiClient.get(`/leads?${params.toString()}`);
      return res.data;
    },
  });

  // Query team members for assignment
  const { data: teamData } = useQuery({
    queryKey: ['team', 'members'],
    queryFn: async () => {
      const res = await apiClient.get('/organizations/members');
      return res.data.data.members;
    },
  });

  // Mutation: Create Lead
  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post('/leads', {
        ...data,
        estimatedValue: parseFloat(data.estimatedValue) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setIsAddModalOpen(false);
      reset();
      success('Lead Created', 'New prospect has been added to your CRM.');
    },
    onError: (err: any) => {
      toastError('Error', err.response?.data?.message || 'Could not create lead');
    },
  });

  // Mutation: Delete Lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setLeadToDelete(null);
      success('Lead Deleted', 'The lead has been removed from workspace.');
    },
  });

  // Mutation: Convert Lead to Customer
  const convertLeadMutation = useMutation({
    mutationFn: async ({ id, createDeal }: { id: string; createDeal: boolean }) => {
      return apiClient.post(`/leads/${id}/convert`, { createDeal });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setLeadToConvert(null);
      success('Lead Converted! 🎉', 'Prospect successfully converted to Customer.');
    },
  });

  // Mutation: Bulk Status Update
  const bulkStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiClient.patch('/leads/bulk-status', {
        leadIds: selectedLeadIds,
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedLeadIds([]);
      success('Bulk Update', 'Status updated for selected leads.');
    },
  });

  const leads: Lead[] = leadsData?.data || [];
  const meta = leadsData?.meta || { page: 1, totalPages: 1, total: 0 };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(leads.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lead Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture, qualify, assign, and convert sales prospects.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Lead
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search leads by name, email, company..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200/90 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 bg-slate-50/80 focus:bg-white transition-all duration-200 shadow-2xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-xl border border-slate-200/90 py-2 px-3 bg-white text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 hover:border-slate-300 transition-all duration-150 shadow-2xs"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="UNQUALIFIED">Unqualified</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-xl border border-slate-200/90 py-2 px-3 bg-white text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 hover:border-slate-300 transition-all duration-150 shadow-2xs"
          >
            <option value="">All Sources</option>
            <option value="WEBSITE">Website</option>
            <option value="REFERRAL">Referral</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="COLD_OUTREACH">Cold Outreach</option>
            <option value="INBOUND">Inbound</option>
          </select>
        </div>

        {/* Bulk action toolbar */}
        {selectedLeadIds.length > 0 && (
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 text-xs animate-scale-in">
            <span className="font-bold text-indigo-900">{selectedLeadIds.length} selected</span>
            <button
              onClick={() => bulkStatusMutation.mutate('QUALIFIED')}
              className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-xs"
            >
              Mark Qualified
            </button>
            <button
              onClick={() => bulkStatusMutation.mutate('CONTACTED')}
              className="px-2.5 py-1 bg-white text-slate-700 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-xs"
            >
              Mark Contacted
            </button>
          </div>
        )}
      </div>

      {/* Leads Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={<Users2 className="w-8 h-8" />}
          title="No leads found"
          description="Create your first lead to begin tracking your sales pipeline."
          actionLabel="Create Lead"
          onAction={() => setIsAddModalOpen(true)}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.length === leads.length && leads.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Lead Name</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Est. Value</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-indigo-50/30 transition-colors duration-150 group">
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => handleToggleSelect(lead.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-150"
                      >
                        {lead.firstName} {lead.lastName}
                      </Link>
                      <p className="text-[11px] text-slate-400">{lead.email}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {lead.company || '—'}
                      {lead.title && <p className="text-[10px] text-slate-400">{lead.title}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge statusValue={lead.status}>{lead.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="text-[11px] font-medium bg-slate-100/90 border border-slate-200/60 px-2 py-0.5 rounded-md">
                        {lead.source.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ${lead.estimatedValue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {lead.assignedToUser ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center shadow-2xs">
                            {lead.assignedToUser.firstName?.[0]}
                          </div>
                          <span className="text-slate-800 font-medium">{lead.assignedToUser.firstName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {lead.status !== 'QUALIFIED' ? (
                          <button
                            onClick={() => setLeadToConvert(lead)}
                            title="Convert to Customer"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:scale-110 active:scale-95 transition-all duration-150"
                          >
                            <Building2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                            Customer
                          </span>
                        )}
                        <Link
                          to={`/leads/${lead.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 hover:scale-110 active:scale-95 transition-all duration-150"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setLeadToDelete(lead)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all duration-150"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {leads.length} of {meta.total} leads
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold">
                Page {meta.page} of {meta.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Lead"
        description="Enter prospect details to add to CRM pipeline"
      >
        <form onSubmit={handleSubmit((data) => createLeadMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" required {...register('firstName', { required: true })} />
            <Input label="Last Name" required {...register('lastName', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" required {...register('email', { required: true })} />
            <Input label="Phone" {...register('phone')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Company" {...register('company')} />
            <Input label="Job Title" {...register('title')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status"
              options={[
                { value: 'NEW', label: 'New' },
                { value: 'CONTACTED', label: 'Contacted' },
                { value: 'QUALIFIED', label: 'Qualified' },
                { value: 'PROPOSAL', label: 'Proposal' },
                { value: 'UNQUALIFIED', label: 'Unqualified' },
              ]}
              {...register('status')}
            />
            <Select
              label="Lead Source"
              options={[
                { value: 'WEBSITE', label: 'Website Form' },
                { value: 'REFERRAL', label: 'Referral' },
                { value: 'LINKEDIN', label: 'LinkedIn' },
                { value: 'COLD_OUTREACH', label: 'Cold Outreach' },
                { value: 'INBOUND', label: 'Inbound' },
                { value: 'OTHER', label: 'Other' },
              ]}
              {...register('source')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Estimated Value ($)" type="number" defaultValue="5000" {...register('estimatedValue')} />
            <Select
              label="Assign to Sales Rep"
              placeholder="Select team member"
              options={(teamData || []).map((m: any) => ({
                value: m.user.id,
                label: `${m.user.firstName} ${m.user.lastName} (${m.role})`,
              }))}
              {...register('assignedToUserId')}
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createLeadMutation.isPending}>
              Create Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* Convert Lead Modal */}
      {leadToConvert && (
        <Modal
          isOpen={true}
          onClose={() => setLeadToConvert(null)}
          title="Convert Lead to Customer"
          description={`Convert ${leadToConvert.firstName} ${leadToConvert.lastName} (${leadToConvert.company || 'N/A'}) into a full customer.`}
        >
          <div className="space-y-4 text-xs text-slate-600">
            <p>
              This will create a new Customer record, mark the lead as <strong>QUALIFIED</strong>, and optionally open a related sales Deal in your pipeline.
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p><strong>Customer Name:</strong> {leadToConvert.firstName} {leadToConvert.lastName}</p>
              <p><strong>Email:</strong> {leadToConvert.email}</p>
              <p><strong>Company:</strong> {leadToConvert.company || 'N/A'}</p>
              <p><strong>Estimated Deal Value:</strong> ${leadToConvert.estimatedValue.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setLeadToConvert(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => convertLeadMutation.mutate({ id: leadToConvert.id, createDeal: true })}
                isLoading={convertLeadMutation.isPending}
              >
                Convert & Create Deal
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Lead Dialog */}
      {leadToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setLeadToDelete(null)}
          onConfirm={() => deleteLeadMutation.mutate(leadToDelete.id)}
          title="Delete Lead"
          message={`Are you sure you want to delete lead "${leadToDelete.firstName} ${leadToDelete.lastName}"? This action cannot be undone.`}
          isLoading={deleteLeadMutation.isPending}
        />
      )}
    </div>
  );
};
