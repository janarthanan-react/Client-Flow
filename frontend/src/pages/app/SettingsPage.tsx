import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  User,
  Building2,
  Lock,
  Bell,
  CheckCircle2,
  Shield,
  Save,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export const SettingsPage: React.FC = () => {
  const { user, currentOrg, refreshUserData } = useAuth();
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'security' | 'notifications'>('profile');

  // Profile Form
  const { register: registerProfile, handleSubmit: handleProfileSubmit } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  // Org Form
  const { register: registerOrg, handleSubmit: handleOrgSubmit } = useForm({
    defaultValues: {
      name: currentOrg?.name || '',
      logoUrl: currentOrg?.logoUrl || '',
    },
  });

  // Password Form
  const { register: registerPass, handleSubmit: handlePassSubmit, reset: resetPass } = useForm();

  // Mutation: Update Profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.patch('/users/profile', data);
    },
    onSuccess: () => {
      refreshUserData();
      success('Profile Updated', 'Your profile details have been saved.');
    },
  });

  // Mutation: Update Organization
  const updateOrgMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.patch('/organizations', data);
    },
    onSuccess: () => {
      refreshUserData();
      success('Organization Saved', 'Organization settings updated.');
    },
  });

  // Mutation: Change Password
  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post('/auth/change-password', data);
    },
    onSuccess: () => {
      resetPass();
      success('Password Changed', 'Your security password has been updated.');
    },
    onError: (err: any) => {
      toastError('Error', err.response?.data?.message || 'Could not change password');
    },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings & Workspace</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure user preferences, organization identity, and account security.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'profile', label: 'User Profile', icon: User },
          { id: 'organization', label: 'Organization', icon: Building2 },
          { id: 'security', label: 'Security & Password', icon: Lock },
          { id: 'notifications', label: 'Preferences', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
            <p className="text-xs text-slate-500">Update your name and profile avatar</p>
          </div>
          <form
            onSubmit={handleProfileSubmit((data) => updateProfileMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" required {...registerProfile('firstName')} />
              <Input label="Last Name" required {...registerProfile('lastName')} />
            </div>
            <Input label="Email" type="email" value={user?.email} disabled helperText="Email address is tied to your account identity." />
            <Input label="Avatar Image URL" placeholder="https://" {...registerProfile('avatarUrl')} />
            <div className="pt-2 flex justify-end">
              <Button type="submit" isLoading={updateProfileMutation.isPending} leftIcon={<Save className="w-4 h-4" />}>
                Save Profile
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Organization Tab */}
      {activeTab === 'organization' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Organization Settings</h3>
            <p className="text-xs text-slate-500">Workspace name and branding identity</p>
          </div>
          <form
            onSubmit={handleOrgSubmit((data) => updateOrgMutation.mutate(data))}
            className="space-y-4"
          >
            <Input label="Organization / Company Name" required {...registerOrg('name')} />
            <Input label="Logo URL" placeholder="https://" {...registerOrg('logoUrl')} />
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-semibold text-slate-700">Workspace Slug</p>
              <p className="text-slate-500 font-mono">{currentOrg?.slug || 'acme-corp'}</p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button type="submit" isLoading={updateOrgMutation.isPending} leftIcon={<Save className="w-4 h-4" />}>
                Save Organization
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
            <p className="text-xs text-slate-500">Ensure account is protected by a strong password</p>
          </div>
          <form
            onSubmit={handlePassSubmit((data) => changePasswordMutation.mutate(data))}
            className="space-y-4"
          >
            <Input label="Current Password" type="password" required {...registerPass('currentPassword', { required: true })} />
            <Input label="New Password" type="password" required placeholder="Min 8 characters, 1 uppercase, 1 number" {...registerPass('newPassword', { required: true })} />
            <div className="pt-2 flex justify-end">
              <Button type="submit" isLoading={changePasswordMutation.isPending} leftIcon={<Save className="w-4 h-4" />}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Notification Preferences Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Notification Alerts</h3>
            <p className="text-xs text-slate-500">Choose which CRM events send email & in-app alerts</p>
          </div>
          <div className="space-y-4 text-xs">
            {[
              { title: 'New Lead Assignment', desc: 'Notify when a prospect is assigned to your sales queue', defaultChecked: true },
              { title: 'Deal Stage Progression', desc: 'Notify when a deal is moved to Closed Won', defaultChecked: true },
              { title: 'Task Due Reminders', desc: 'Notify 24 hours before a priority task deadline', defaultChecked: true },
              { title: 'Subscription & Invoice Receipts', desc: 'Receive billing statements and renewal confirmations', defaultChecked: true },
            ].map((pref, i) => (
              <label key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                <input type="checkbox" defaultChecked={pref.defaultChecked} className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                <div>
                  <p className="font-bold text-slate-900">{pref.title}</p>
                  <p className="text-slate-500 mt-0.5">{pref.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="pt-2 flex justify-end">
            <Button onClick={() => success('Preferences Saved', 'Your notification alert settings have been updated.')}>
              Save Preferences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
