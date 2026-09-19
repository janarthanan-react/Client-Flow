import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Download,
  AlertCircle,
  ExternalLink,
  Settings,
  Lock,
  Copy,
  Check,
  Loader2,
  Building,
  User,
  Calendar,
  Layers,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { BillingDetails, SubscriptionPlan } from '../../types';

interface StripeConfigStatus {
  isConfigured: boolean;
  mode: 'live' | 'test' | 'mock';
  publishableKey?: string;
}

export const BillingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Modals state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'BUSINESS'>('PRO');
  const [activePaymentTab, setActivePaymentTab] = useState<'card' | 'stripe'>('card');

  // Stripe config state
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [copiedCard, setCopiedCard] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardZip, setCardZip] = useState('');

  // 1. Fetch current billing details
  const { data: billingData, isLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: async () => {
      const res = await apiClient.get('/billing');
      return res.data.data as BillingDetails;
    },
  });

  // 2. Fetch Stripe gateway status
  const { data: configStatus, refetch: refetchConfigStatus } = useQuery<StripeConfigStatus>({
    queryKey: ['billing-config-status'],
    queryFn: async () => {
      const res = await apiClient.get('/billing/config-status');
      return res.data.data;
    },
  });

  // 3. Verify Stripe Checkout Session on return
  const verifySessionMutation = useMutation({
    mutationFn: async ({ sessionId, plan }: { sessionId: string; plan?: string }) => {
      const res = await apiClient.post('/billing/verify-session', { sessionId, plan });
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      success('Payment Successful! 🎉', `Your workspace has been upgraded to ${data.plan}.`);
      setSearchParams({});
    },
    onError: (err: any) => {
      toastError(
        'Session Verification Issue',
        err.response?.data?.message || 'Could not verify payment session'
      );
      setSearchParams({});
    },
  });

  // Check URL parameters for returning from Stripe Checkout
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const isSuccess = searchParams.get('success') === 'true';
    const isCanceled = searchParams.get('canceled') === 'true';
    const plan = searchParams.get('plan') || undefined;

    if (sessionId && isSuccess) {
      verifySessionMutation.mutate({ sessionId, plan });
    } else if (isCanceled) {
      toastError('Checkout Cancelled', 'No charges were made to your account.');
      setSearchParams({});
    }
  }, [searchParams]);

  // 4. Create Hosted Checkout Session Mutation (Stripe Checkout)
  const checkoutMutation = useMutation({
    mutationFn: async (plan: 'PRO' | 'BUSINESS') => {
      const res = await apiClient.post('/billing/checkout', { plan });
      return res.data.data;
    },
    onSuccess: (data, plan) => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      if (data.checkoutUrl) {
        if (data.mocked) {
          success('Plan Updated! 🎉', `Workspace upgraded to ${plan} successfully.`);
          setIsPaymentModalOpen(false);
        } else {
          window.location.href = data.checkoutUrl;
        }
      }
    },
    onError: (err: any) => {
      toastError('Checkout Failed', err.response?.data?.message || 'Could not initiate checkout');
    },
  });

  // 5. Direct Card Payment Mutation
  const cardPaymentMutation = useMutation({
    mutationFn: async (payload: {
      plan: 'PRO' | 'BUSINESS';
      paymentMethod: string;
      card: {
        number: string;
        name: string;
        expMonth: string;
        expYear: string;
        cvc: string;
        zip?: string;
      };
    }) => {
      const res = await apiClient.post('/billing/pay', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      success(
        'Payment Succeeded! 🎉',
        `$${selectedPlan === 'PRO' ? '29.00' : '79.00'} charged successfully. Upgraded to ${data.plan}.`
      );
      setIsPaymentModalOpen(false);
      resetCardForm();
    },
    onError: (err: any) => {
      toastError('Payment Failed', err.response?.data?.message || 'Card payment declined');
    },
  });

  // 6. Customer Portal Mutation
  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/billing/portal');
      return res.data.data;
    },
    onSuccess: (data) => {
      if (data.portalUrl) {
        if (data.portalUrl.includes('mock')) {
          success('Portal Active', 'Redirecting to mock Stripe Customer Portal.');
        } else {
          window.location.href = data.portalUrl;
        }
      }
    },
  });

  // 7. Save Stripe Configuration Mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (payload: { secretKey: string; publishableKey?: string }) => {
      const res = await apiClient.post('/billing/config', payload);
      return res.data.data;
    },
    onSuccess: () => {
      success('Stripe Configured!', 'Real Stripe Payment Gateway is now connected and active.');
      setIsConfigModalOpen(false);
      refetchConfigStatus();
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
    onError: (err: any) => {
      toastError('Setup Failed', err.response?.data?.message || 'Could not save Stripe keys');
    },
  });

  const resetCardForm = () => {
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvc('');
    setCardZip('');
  };

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardName('Sarah Jenkins');
    setCardExpiry('12/28');
    setCardCvc('123');
    setCardZip('94105');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      toastError('Invalid Card', 'Please enter a valid 16-digit card number.');
      return;
    }
    const [expMonth, expYear] = cardExpiry.split('/');
    if (!expMonth || !expYear) {
      toastError('Invalid Expiration', 'Please enter expiration date in MM/YY format.');
      return;
    }

    cardPaymentMutation.mutate({
      plan: selectedPlan,
      paymentMethod: 'card',
      card: {
        number: cardNumber,
        name: cardName,
        expMonth,
        expYear,
        cvc: cardCvc,
        zip: cardZip,
      },
    });
  };

  const handleOpenPayment = (plan: 'PRO' | 'BUSINESS') => {
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const handleSaveStripeKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeSecretKey.trim()) {
      toastError('Validation Error', 'Please provide a valid Stripe secret key (sk_test_... or sk_live_...)');
      return;
    }
    saveConfigMutation.mutate({
      secretKey: stripeSecretKey.trim(),
      publishableKey: stripePublishableKey.trim() || undefined,
    });
  };

  const copyTestCard = () => {
    navigator.clipboard.writeText('4242424242424242');
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading subscription details...</div>;
  }

  const currentPlan = billingData?.plan || 'FREE';
  const usage = billingData?.usage || {
    leads: { used: 0, limit: 50, percentage: 0 },
    members: { used: 1, limit: 3, percentage: 33 },
  };

  const isRealStripe = configStatus?.isConfigured;
  const stripeMode = configStatus?.mode || 'mock';

  const plans = [
    {
      id: 'FREE' as SubscriptionPlan,
      name: 'Starter Plan',
      price: '$0',
      period: 'forever',
      description: 'For solo freelancers & startups exploring CRM capabilities.',
      features: ['Up to 50 active leads', 'Up to 3 team members', 'Kanban sales pipeline', 'Basic activity tracking'],
      limitLeads: 50,
      limitMembers: 3,
    },
    {
      id: 'PRO' as SubscriptionPlan,
      name: 'Pro Workspace',
      price: '$29',
      period: 'per month',
      description: 'Engineered for growing sales teams and agencies.',
      features: [
        'Up to 500 active leads',
        'Up to 10 team seats',
        'Executive revenue analytics',
        'Real-time WebSocket alerts',
        'Background job queues',
        'Stripe Checkout (Cards, Apple Pay, Google Pay)',
      ],
      limitLeads: 500,
      limitMembers: 10,
    },
    {
      id: 'BUSINESS' as SubscriptionPlan,
      name: 'Business Scale',
      price: '$79',
      period: 'per month',
      description: 'High volume capacity for expanding companies.',
      features: [
        'Unlimited active leads',
        'Up to 100 team seats',
        'Audit logs & compliance trail',
        'Priority API throughput',
        'Dedicated onboarding SLA',
      ],
      limitLeads: 10000,
      limitMembers: 100,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner if verifying session */}
      {verifySessionMutation.isPending && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span className="text-sm font-semibold">Verifying your Stripe payment session...</span>
        </div>
      )}

      {/* Header with Gateway status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subscription & Billing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage workspace plan tiers, monitor capacity usage, and process real credit card & Stripe payments.
          </p>
        </div>

        {/* Stripe Gateway Status Button */}
        <button
          type="button"
          onClick={() => setIsConfigModalOpen(true)}
          className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-300 transition-all group"
        >
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <span>Stripe Gateway</span>
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              stripeMode === 'live'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : stripeMode === 'test'
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {stripeMode === 'live' ? 'Live Mode' : stripeMode === 'test' ? 'Test Mode' : 'Setup Required'}
          </span>
          <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-45 transition-transform" />
        </button>
      </div>

      {/* Current Subscription Status & Usage */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-2xl font-black text-slate-900">{currentPlan}</h2>
            <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              {billingData?.status || 'ACTIVE'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {billingData?.currentPeriodEnd
              ? `Renews on ${new Date(billingData.currentPeriodEnd).toLocaleDateString()}`
              : 'Free tier — No renewal date'}
          </p>
          {currentPlan !== 'FREE' && (
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => portalMutation.mutate()}
              isLoading={portalMutation.isPending}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Stripe Customer Portal
            </Button>
          )}
        </div>

        {/* Usage bar 1: Leads */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Leads Capacity</span>
            <span className="text-slate-500">
              {usage.leads.used} / {usage.leads.limit}
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usage.leads.percentage > 85 ? 'bg-rose-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, usage.leads.percentage)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {usage.leads.limit - usage.leads.used > 0
              ? `${usage.leads.limit - usage.leads.used} leads remaining in tier`
              : 'Limit reached — Upgrade for more capacity'}
          </p>
        </div>

        {/* Usage bar 2: Members */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Team Seats</span>
            <span className="text-slate-500">
              {usage.members.used} / {usage.members.limit}
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all"
              style={{ width: `${Math.min(100, usage.members.percentage)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {usage.members.limit - usage.members.used} seat(s) available to invite
          </p>
        </div>
      </div>

      {/* Plan Tiers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Available Workspace Plans</h3>
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            256-bit encrypted checkout via Stripe
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentPlan === p.id;
            return (
              <div
                key={p.id}
                className={`p-6 rounded-2xl bg-white border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-2 border-indigo-600 shadow-md ring-4 ring-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black text-slate-900">{p.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-black text-slate-900">{p.price}</span>
                    <span className="text-xs text-slate-500 ml-1">/{p.period}</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Active Plan
                    </Button>
                  ) : p.id === 'FREE' ? (
                    <Button variant="outline" className="w-full" disabled>
                      Default Plan
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handleOpenPayment(p.id as any)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Upgrade to {p.id}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payment & Invoice History</h3>
            <p className="text-xs text-slate-500">Receipts and billing transactions processed via Stripe</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">Secured by Stripe</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {!billingData?.payments || billingData.payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No billing history on record
                  </td>
                </tr>
              ) : (
                billingData.payments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">{new Date(pmt.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">${pmt.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                        {pmt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {pmt.receiptUrl ? (
                        <a
                          href={pmt.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          Invoice <Download className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400">Receipt on file</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Payment Checkout Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Upgrade to ${selectedPlan === 'PRO' ? 'Pro Workspace' : 'Business Scale'}`}
        description="Select your preferred payment method to activate this plan"
        maxWidth="lg"
      >
        <div className="space-y-5">
          {/* Order Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 to-purple-50/60 border border-indigo-100 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
                Selected Plan
              </span>
              <h4 className="text-lg font-black text-slate-900">
                {selectedPlan === 'PRO' ? 'Pro Workspace Tier' : 'Business Scale Tier'}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {selectedPlan === 'PRO'
                  ? 'Up to 500 leads • 10 team seats • Advanced analytics'
                  : 'Unlimited leads • 100 team seats • Full audit logs'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">
                ${selectedPlan === 'PRO' ? '29.00' : '79.00'}
              </span>
              <p className="text-[11px] text-slate-500 font-medium">per month</p>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActivePaymentTab('card')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activePaymentTab === 'card'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Credit / Debit Card</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePaymentTab('stripe')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activePaymentTab === 'stripe'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ExternalLink className="w-4 h-4 text-indigo-600" />
              <span>Stripe Hosted Checkout</span>
            </button>
          </div>

          {/* Tab 1: Credit / Debit Card Form */}
          {activePaymentTab === 'card' && (
            <form onSubmit={handleCardSubmit} className="space-y-4">
              {/* Quick Auto Fill Button */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Enter your card details:</span>
                <button
                  type="button"
                  onClick={fillTestCard}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Auto-fill Test Card</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4242 4242 4242 4242"
                    className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors font-mono"
                    required
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cardholder Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Full Name as on card"
                    className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expiration
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={handleCardExpiryChange}
                      placeholder="MM/YY"
                      className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors font-mono text-center"
                      required
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CVC / CVV
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors font-mono text-center"
                      required
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={cardZip}
                    onChange={(e) => setCardZip(e.target.value)}
                    placeholder="94105"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors text-center"
                  />
                </div>
              </div>

              {/* Security info */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Encrypted with 256-bit SSL • PCI DSS Level 1 Certified</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cardPaymentMutation.isPending}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  {cardPaymentMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Pay ${selectedPlan === 'PRO' ? '29.00' : '79.00'} & Upgrade</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Stripe Hosted Checkout */}
          {activePaymentTab === 'stripe' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>Stripe Hosted Checkout</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Redirect to Stripe's hosted checkout page to complete your payment with:
                </p>
                <ul className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Credit & Debit Cards</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Apple Pay & Google Pay</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Stripe Link 1-Click Pay</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Automated Invoices</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={checkoutMutation.isPending}
                  onClick={() => checkoutMutation.mutate(selectedPlan)}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  {checkoutMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Continue to Stripe Checkout &rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Stripe Payment Gateway Setup Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Stripe Payment Gateway Configuration"
        description="Connect your Stripe account to process live and test credit card payments"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-indigo-950 flex items-start gap-3">
            <Lock className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">Zero-Config Product Setup</p>
              <p className="leading-relaxed">
                ClientFlow uses dynamic price calculation. You <strong>do not need to create products or prices</strong> in
                your Stripe dashboard — Stripe will automatically generate the $29/mo and $79/mo subscription line items on the fly!
              </p>
            </div>
          </div>

          {/* Test Card Quick Helper */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 text-[11px]">Official Stripe Test Card:</p>
              <p className="font-mono text-xs text-indigo-700 mt-0.5">4242 •••• •••• 4242</p>
              <p className="text-[10px] text-slate-500">Exp: Any future date | CVC: Any 3 digits</p>
            </div>
            <button
              type="button"
              onClick={copyTestCard}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
            >
              {copiedCard ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCard ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-slate-900">How to get your Stripe API Keys:</p>
            <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
              <li>
                Open the{' '}
                <a
                  href="https://dashboard.stripe.com/test/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                >
                  Stripe Developers &rarr; API Keys page
                  <ExternalLink className="w-3 h-3" />
                </a>
                .
              </li>
              <li>
                Copy your <strong className="text-slate-800">Secret key</strong> (starts with{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">sk_test_...</code> or{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">sk_live_...</code>).
              </li>
              <li>
                (Optional) Copy your <strong className="text-slate-800">Publishable key</strong> (starts with{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">pk_test_...</code>).
              </li>
            </ol>
          </div>

          <form onSubmit={handleSaveStripeKeys} className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stripe Secret Key <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
                placeholder="sk_test_..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stripe Publishable Key <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={stripePublishableKey}
                onChange={(e) => setStripePublishableKey(e.target.value)}
                placeholder="pk_test_..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveConfigMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                {saveConfigMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save & Activate Stripe</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
