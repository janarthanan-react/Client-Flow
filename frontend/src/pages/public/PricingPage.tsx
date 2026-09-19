import React, { useState } from 'react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PricingPage: React.FC = () => {
  const [annual, setAnnual] = useState(false);

  const tiers = [
    {
      name: 'FREE',
      subtitle: 'For solo freelancers & startups',
      price: 0,
      period: 'forever',
      features: [
        'Up to 50 active leads',
        'Up to 3 team members',
        'Visual Kanban sales pipeline',
        'Lead to customer conversion',
        'Basic activity timeline',
        'Community support',
      ],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'PRO',
      subtitle: 'For scaling sales teams & agencies',
      price: annual ? 24 : 29,
      period: 'per month',
      features: [
        'Up to 500 active leads',
        'Up to 10 team seats',
        'Advanced revenue analytics & charts',
        'Real-time Socket.IO WebSocket sync',
        'Email & notification background queues',
        'Role-based permissions (Admin, Sales, Member)',
        'Stripe self-service billing portal',
        'Priority email support',
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true,
    },
    {
      name: 'BUSINESS',
      subtitle: 'For enterprise sales departments',
      price: annual ? 65 : 79,
      period: 'per month',
      features: [
        'Unlimited active leads',
        'Up to 100 team seats',
        'Full administrative audit logs',
        'Custom REST API rate limits',
        'Bulk operations & data exports',
        'SOC2 & GDPR compliance reports',
        'Dedicated account manager',
        '99.9% uptime SLA',
      ],
      cta: 'Contact Enterprise Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      <section className="py-20 bg-gradient-to-b from-indigo-50/40 via-white to-white border-b border-slate-200 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Pricing & Plans</span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mt-2">Predictable Pricing for Growing Businesses</h1>
          <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto">
            Choose the perfect plan for your team. Upgrade, downgrade, or cancel at any time with zero lock-in.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-full bg-slate-100 border border-slate-200">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                !annual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                annual ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Billing
              <span className="bg-emerald-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((t, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-8 flex flex-col justify-between transition-all ${
                t.popular
                  ? 'border-2 border-indigo-600 bg-gradient-to-b from-indigo-50/40 to-white shadow-xl relative -translate-y-2'
                  : 'border border-slate-200 bg-white shadow-sm hover:shadow-md'
              }`}
            >
              {t.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                  Most Popular Choice
                </div>
              )}
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.subtitle}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">${t.price}</span>
                  <span className="text-xs text-slate-500 font-medium">/{t.period}</span>
                </div>

                <div className="mt-8 space-y-3">
                  <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Features Included:</p>
                  {t.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${t.popular ? 'text-indigo-600' : 'text-emerald-500'}`} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <Link
                  to="/register"
                  className={`block w-full py-3 rounded-xl text-xs font-bold text-center transition-all ${
                    t.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {t.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h3 className="text-2xl font-black text-slate-900 text-center mb-8">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              { q: 'Can I change my plan later?', a: 'Yes! You can upgrade or downgrade between Free, Pro, and Business at any time directly through the Billing settings. Prorated adjustments are handled automatically via Stripe.' },
              { q: 'How does multi-tenant isolation work?', a: 'Every CRM record (lead, customer, deal, task, audit log) belongs strictly to your unique organization ID. Organization members only ever receive notifications, data, and real-time updates for their authenticated tenant.' },
              { q: 'Is there a free trial for the Pro plan?', a: 'Yes, every new workspace comes with an instant 14-day Pro trial with all features enabled. No credit card is needed to get started.' },
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900">{faq.q}</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
