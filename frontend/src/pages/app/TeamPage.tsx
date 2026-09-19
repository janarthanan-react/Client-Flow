import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Users2,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { OrganizationMember, Role } from '../../types';

export const TeamPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, currentOrg } = useAuth();
  const { success, error: toastError } = useToast();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember | null>(null);

  const { register, handleSubmit, reset } = useForm();

  // Query team members and invitations
  const { data: teamData, isLoading } = useQuery({
    queryKey: ['team', 'members'],
    queryFn: async () => {
      const res = await apiClient.get('/organizations/members');
      return res.data.data;
    },
  });

  // Mutation: Invite member
  const inviteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post('/organizations/members/invite', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', 'members'] });
      setIsInviteModalOpen(false);
      reset();
      success('Invitation Sent', 'An invitation email with activation link has been sent.');
    },
    onError: (err: any) => {
      toastError('Invitation Failed', err.response?.data?.message || 'Could not send invitation');
    },
  });

  // Mutation: Change role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: Role }) => {
      return apiClient.patch(`/organizations/members/${memberId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', 'members'] });
      success('Role Updated', 'Member permissions updated successfully.');
    },
    onError: (err: any) => {
      toastError('Error', err.response?.data?.message || 'Failed to update role');
    },
  });

  // Mutation: Remove member
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return apiClient.delete(`/organizations/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', 'members'] });
      setMemberToRemove(null);
      success('Member Removed', 'User has been removed from workspace.');
    },
    onError: (err: any) => {
      toastError('Error', err.response?.data?.message || 'Could not remove member');
    },
  });

  const members: OrganizationMember[] = teamData?.members || [];
  const pendingInvitations = teamData?.pendingInvitations || [];

  const isOwnerOrAdmin = currentOrg?.role === 'OWNER' || currentOrg?.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage organization members, assign roles, and invite sales representatives.
          </p>
        </div>
        {isOwnerOrAdmin && (
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Invite Member
          </Button>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Active Members ({members.length})
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4">Email Status</th>
                {isOwnerOrAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center">
                        {m.user.firstName?.[0]}
                        {m.user.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {m.user.firstName} {m.user.lastName}
                          {m.userId === user?.id && (
                            <span className="ml-2 text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400">{m.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {isOwnerOrAdmin && m.role !== 'OWNER' ? (
                      <select
                        value={m.role}
                        onChange={(e) =>
                          updateRoleMutation.mutate({ memberId: m.id, role: e.target.value as Role })
                        }
                        className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="SALES">SALES</option>
                        <option value="MEMBER">MEMBER</option>
                      </select>
                    ) : (
                      <Badge statusValue={m.role}>{m.role}</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(m.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  </td>
                  {isOwnerOrAdmin && (
                    <td className="py-3.5 px-4 text-right">
                      {m.role !== 'OWNER' && m.userId !== user?.id && (
                        <button
                          onClick={() => setMemberToRemove(m)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {pendingInvitations.map((inv: any) => (
              <div key={inv.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{inv.email}</span>
                  <span className="text-slate-400 ml-2">Invited as {inv.role}</span>
                </div>
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                  Awaiting Acceptance
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
        description="Send an email invite to join your organization"
      >
        <form onSubmit={handleSubmit((data) => inviteMutation.mutate(data))} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="colleague@company.com"
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            {...register('email', { required: true })}
          />
          <Select
            label="Role & Permissions"
            options={[
              { value: 'ADMIN', label: 'Admin (Full manage access)' },
              { value: 'SALES', label: 'Sales (Manage leads, deals, tasks)' },
              { value: 'MEMBER', label: 'Member (Read-only / standard tasks)' },
            ]}
            defaultValue="SALES"
            {...register('role')}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={inviteMutation.isPending}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirmation */}
      {memberToRemove && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setMemberToRemove(null)}
          onConfirm={() => removeMemberMutation.mutate(memberToRemove.id)}
          title="Remove Member"
          message={`Are you sure you want to remove ${memberToRemove.user.firstName} ${memberToRemove.user.lastName} from the organization?`}
          isLoading={removeMemberMutation.isPending}
        />
      )}
    </div>
  );
};
