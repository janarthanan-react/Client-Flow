import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Kanban,
  Plus,
  DollarSign,
  TrendingUp,
  User,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';
import { Deal, DealStage } from '../../types';
import { useForm } from 'react-hook-form';

const STAGES: Array<{ id: DealStage; label: string; color: string; border: string; badgeBg: string }> = [
  { id: 'PROSPECTING', label: 'Prospecting', color: 'bg-slate-500', border: 'border-t-slate-400', badgeBg: 'bg-slate-100 text-slate-700' },
  { id: 'QUALIFICATION', label: 'Qualification', color: 'bg-sky-500', border: 'border-t-sky-400', badgeBg: 'bg-sky-50 text-sky-700' },
  { id: 'PROPOSAL', label: 'Proposal', color: 'bg-indigo-500', border: 'border-t-indigo-500', badgeBg: 'bg-indigo-50 text-indigo-700' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-amber-500', border: 'border-t-amber-500', badgeBg: 'bg-amber-50 text-amber-700' },
  { id: 'CLOSED_WON', label: 'Closed Won', color: 'bg-emerald-500', border: 'border-t-emerald-500', badgeBg: 'bg-emerald-50 text-emerald-700' },
  { id: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-rose-500', border: 'border-t-rose-400', badgeBg: 'bg-rose-50 text-rose-700' },
];

export const PipelinePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  const { register, handleSubmit, reset } = useForm();

  // Query Deals
  const { data: dealsResponse, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const res = await apiClient.get('/deals');
      return res.data;
    },
  });

  // Query Customers for new deal dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers', 'dropdown'],
    queryFn: async () => {
      const res = await apiClient.get('/customers?limit=100');
      return res.data.data;
    },
  });

  // Mutation: Move Stage
  const moveStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: DealStage }) => {
      return apiClient.patch(`/deals/${id}/stage`, { stage });
    },
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      if (vars.stage === 'CLOSED_WON') {
        success('Deal Closed Won! 🎉', 'Revenue has been added to workspace totals.');
      } else {
        success('Stage Updated', `Deal moved to ${vars.stage.replace('_', ' ')}.`);
      }
    },
  });

  // Mutation: Create Deal
  const createDealMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post('/deals', {
        ...data,
        amount: parseFloat(data.amount) || 0,
        probability: parseInt(data.probability, 10) || 20,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setIsAddModalOpen(false);
      reset();
      success('Deal Created', 'New opportunity added to the sales pipeline.');
    },
    onError: (err: any) => {
      toastError('Error', err.response?.data?.message || 'Could not create deal');
    },
  });

  // Mutation: Delete Deal
  const deleteDealMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/deals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setDealToDelete(null);
      success('Deal Deleted', 'Deal removed from pipeline.');
    },
  });

  const deals: Deal[] = dealsResponse?.data || [];
  const meta = dealsResponse?.meta || { totalPipelineValue: 0, wonRevenue: 0, totalDeals: 0 };
  const stageSummary = meta.stageSummary || {};

  const handleMoveStage = (deal: Deal, direction: 'prev' | 'next') => {
    const currentIndex = STAGES.findIndex((s) => s.id === deal.stage);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < STAGES.length) {
      moveStageMutation.mutate({ id: deal.id, stage: STAGES[nextIndex].id });
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-6.5rem)] flex flex-col">
      {/* Header with Pipeline Statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive Kanban board with deal forecasting and stage progression.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-6 px-4 py-2 bg-white rounded-xl border border-slate-200/90 shadow-sm text-xs hover:shadow-md transition-shadow">
            <div>
              <span className="text-slate-400">Total Pipeline:</span>{' '}
              <span className="font-extrabold text-slate-900">
                ${meta.totalPipelineValue?.toLocaleString()}
              </span>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="text-slate-400">Won Revenue:</span>{' '}
              <span className="font-extrabold text-emerald-600">
                ${meta.wonRevenue?.toLocaleString()}
              </span>
            </div>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            New Deal
          </Button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 pt-1">
        {STAGES.map((stage, colIdx) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const stageTotal = stageSummary[stage.id]?.totalAmount || 0;

          return (
            <div
              key={stage.id}
              className={`w-72 shrink-0 flex flex-col bg-slate-100/70 rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden border-t-4 ${stage.border}`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200/80 bg-white/70 backdrop-blur-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <h2 className="text-xs font-bold text-slate-800">{stage.label}</h2>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stage.badgeBg}`}>
                    {stageDeals.length}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-700">
                  ${stageTotal.toLocaleString()}
                </span>
              </div>

              {/* Cards Stream */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto kanban-col">
                {stageDeals.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-center p-4 border border-dashed border-slate-300 rounded-xl text-slate-400 text-[11px]">
                    No deals in this stage
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 transition-all duration-200 ease-out space-y-3 group cursor-default"
                    >
                      {/* Deal title & amount */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-150">
                            {deal.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {deal.customer?.name || 'Customer'}
                          </p>
                        </div>
                        <p className="text-xs font-black text-slate-900 shrink-0">
                          ${deal.amount.toLocaleString()}
                        </p>
                      </div>

                      {/* Probability bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Probability</span>
                          <span className="font-bold text-slate-700">{deal.probability}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${stage.color}`}
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer: User, Date, Move Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] flex items-center justify-center shadow-2xs">
                            {deal.assignedToUser?.firstName?.[0] || 'U'}
                          </div>
                          <span className="truncate max-w-[80px]">
                            {deal.assignedToUser?.firstName || 'Assigned'}
                          </span>
                        </div>

                        {/* Stage move arrows */}
                        <div className="flex items-center gap-1">
                          {colIdx > 0 && (
                            <button
                              onClick={() => handleMoveStage(deal, 'prev')}
                              title="Move left"
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 hover:scale-110 active:scale-95 transition-all duration-150"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {colIdx < STAGES.length - 1 && (
                            <button
                              onClick={() => handleMoveStage(deal, 'next')}
                              title="Move right"
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:scale-110 active:scale-95 transition-all duration-150"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDealToDelete(deal)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all duration-150"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Deal Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Opportunity / Deal"
        description="Add a new potential deal to your sales pipeline"
      >
        <form onSubmit={handleSubmit((data) => createDealMutation.mutate(data))} className="space-y-4">
          <Input
            label="Deal Title"
            required
            placeholder="E.g. Enterprise Cloud License"
            {...register('title', { required: true })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Related Customer"
              required
              placeholder="Select customer"
              options={(customersData || []).map((c: any) => ({
                value: c.id,
                label: `${c.name} (${c.company || 'Direct'})`,
              }))}
              {...register('customerId', { required: true })}
            />
            <Input
              label="Deal Amount ($)"
              type="number"
              required
              defaultValue="25000"
              {...register('amount', { required: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Initial Stage"
              options={STAGES.map((s) => ({ value: s.id, label: s.label }))}
              defaultValue="PROSPECTING"
              {...register('stage')}
            />
            <Input
              label="Win Probability (%)"
              type="number"
              min="0"
              max="100"
              defaultValue="20"
              {...register('probability')}
            />
          </div>

          <Input label="Expected Close Date" type="date" {...register('expectedCloseDate')} />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createDealMutation.isPending}>
              Create Deal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Deal Confirmation */}
      {dealToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDealToDelete(null)}
          onConfirm={() => deleteDealMutation.mutate(dealToDelete.id)}
          title="Delete Deal"
          message={`Are you sure you want to delete "${dealToDelete.title}"?`}
          isLoading={deleteDealMutation.isPending}
        />
      )}
    </div>
  );
};
