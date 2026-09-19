import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  DollarSign,
  Briefcase,
  Trash2,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { Customer } from '../../types';

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const { register, handleSubmit, reset } = useForm();

  // Query customers
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', { page, search, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await apiClient.get(`/customers?${params.toString()}`);
      return res.data;
    },
  });

  // Mutation: Create Customer
  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post('/customers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setIsAddModalOpen(false);
      reset();
      success('Customer Added', 'New customer has been recorded.');
    },
    onError: (err: any) => {
      toastError('Error', err.response?.data?.message || 'Could not add customer');
    },
  });

  // Mutation: Delete Customer
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setCustomerToDelete(null);
      success('Customer Deleted', 'Customer removed successfully.');
    },
  });

  const customers: Customer[] = customersData?.data || [];
  const meta = customersData?.meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage active client accounts, contract histories, and linked deals.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Customer
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search customers by name, email, company..."
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
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="CHURNED">Churned</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="No customers found"
          description="Convert qualified leads or add client accounts manually."
          actionLabel="Add Customer"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Lifetime Won</th>
                  <th className="py-3.5 px-4">Active Pipeline</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-indigo-50/30 transition-colors duration-150 group">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/customers/${c.id}`}
                        className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-150"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{c.company || '—'}</td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-900 font-medium">{c.email}</p>
                      {c.phone && <p className="text-[10px] text-slate-400">{c.phone}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : c.status === 'INACTIVE'
                            ? 'bg-slate-100 text-slate-600 border-slate-200/80'
                            : 'bg-rose-50 text-rose-700 border-rose-200/80'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      ${c.totalRevenue?.toLocaleString() || 0}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      ${c.totalPipeline?.toLocaleString() || 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/customers/${c.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 hover:scale-110 active:scale-95 transition-all duration-150"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setCustomerToDelete(c)}
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
              Showing {customers.length} of {meta.total} customers
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

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Customer"
        description="Enter client contact and company information"
      >
        <form onSubmit={handleSubmit((data) => createCustomerMutation.mutate(data))} className="space-y-4">
          <Input label="Customer / Account Name" required {...register('name', { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Company Name" {...register('company')} />
            <Input label="Work Email" type="email" required {...register('email', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone Number" {...register('phone')} />
            <Input label="Website URL" placeholder="https://" {...register('website')} />
          </div>
          <Input label="Physical Address / City" {...register('address')} />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createCustomerMutation.isPending}>
              Create Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {customerToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setCustomerToDelete(null)}
          onConfirm={() => deleteCustomerMutation.mutate(customerToDelete.id)}
          title="Delete Customer"
          message={`Are you sure you want to delete ${customerToDelete.name}? All linked deals and tasks will be affected.`}
          isLoading={deleteCustomerMutation.isPending}
        />
      )}
    </div>
  );
};
