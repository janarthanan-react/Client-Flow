import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Kanban,
  Users,
  LineChart,
  ShieldCheck,
  BellRing,
  Bot,
  CheckCircle2,
  Star,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 bg-gradient-to-b from-indigo-50/60 via-white to-white">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-tr from-indigo-300/30 via-purple-300/20 to-pink-200/20 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200 text-indigo-700 text-xs font-bold mb-8 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all duration-200 cursor-default">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>Next-Generation SaaS CRM & Pipeline Automation</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Turn Every Lead Into a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600">
              Customer.
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            ClientFlow equips sales teams, fast-growing startups, and agencies with an intuitive visual pipeline, automated lead routing, real-time activity tracking, and enterprise revenue analytics.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-base shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-200 group"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 text-slate-800 font-bold text-base hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 border border-slate-200/70"
            >
              View Live Demo
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 14-day Pro trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 2-minute setup
            </span>
          </div>

          {/* Interactive Mockup Container */}
          <div className="mt-16 relative mx-auto max-w-5xl rounded-3xl p-2 sm:p-4 bg-slate-900/5 ring-1 ring-slate-900/10 shadow-2xl hover:shadow-indigo-500/10 transition-shadow duration-300">
            <div className="rounded-2xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-800 text-left">
              {/* Mockup browser chrome */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:opacity-100 transition-opacity" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:opacity-100 transition-opacity" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-900 px-4 py-1 rounded-md border border-slate-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  app.clientflow.io/dashboard
                </div>
                <div className="w-12" />
              </div>

              {/* Mockup CRM Dashboard Content */}
              <div className="p-6 bg-slate-950/90 text-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Metric 1 */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200">
                  <span className="text-xs text-slate-400 font-medium">Total Pipeline</span>
                  <p className="text-2xl font-black text-white mt-1">$485,000</p>
                  <span className="text-[11px] text-emerald-400 font-semibold mt-2 inline-block">
                    ↑ 24% vs last month
                  </span>
                </div>
                {/* Metric 2 */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200">
                  <span className="text-xs text-slate-400 font-medium">Closed Won</span>
                  <p className="text-2xl font-black text-indigo-400 mt-1">$226,000</p>
                  <span className="text-[11px] text-emerald-400 font-semibold mt-2 inline-block">
                    ↑ 18 deals completed
                  </span>
                </div>
                {/* Metric 3 */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200">
                  <span className="text-xs text-slate-400 font-medium">Active Leads</span>
                  <p className="text-2xl font-black text-white mt-1">32 Leads</p>
                  <span className="text-[11px] text-indigo-400 font-semibold mt-2 inline-block">
                    68% Qualified
                  </span>
                </div>
                {/* Metric 4 */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200">
                  <span className="text-xs text-slate-400 font-medium">Win Rate</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">74.2%</p>
                  <span className="text-[11px] text-slate-400 font-semibold mt-2 inline-block">
                    Top tier performance
                  </span>
                </div>

                {/* Pipeline visual row */}
                <div className="col-span-1 md:col-span-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800 mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Live Kanban Stages
                    </span>
                    <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      Real-time Sync Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-slate-800/80 border-t-2 border-indigo-500 hover:bg-slate-800 transition-colors">
                      <p className="text-[11px] text-slate-400">Prospecting (4)</p>
                      <p className="text-sm font-bold text-white mt-1">$194,000</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/80 border-t-2 border-purple-500 hover:bg-slate-800 transition-colors">
                      <p className="text-[11px] text-slate-400">Proposal (5)</p>
                      <p className="text-sm font-bold text-white mt-1">$174,000</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/80 border-t-2 border-amber-500 hover:bg-slate-800 transition-colors">
                      <p className="text-[11px] text-slate-400">Negotiation (3)</p>
                      <p className="text-sm font-bold text-white mt-1">$127,000</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/80 border-t-2 border-emerald-500 hover:bg-slate-800 transition-colors">
                      <p className="text-[11px] text-slate-400">Closed Won (6)</p>
                      <p className="text-sm font-bold text-emerald-400 mt-1">$226,000</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              Engineered for Results
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Everything your team needs to close more deals
            </h3>
            <p className="mt-4 text-slate-600 text-base">
              Say goodbye to fragmented spreadsheets and bloated legacy CRMs. ClientFlow provides the exact tools required to scale sales operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Users className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-200" />,
                title: 'Lead Management',
                desc: 'Capture, enrich, sort, filter, and assign incoming leads automatically with zero manual data entry errors.',
              },
              {
                icon: <Kanban className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-200" />,
                title: 'Visual Sales Pipeline',
                desc: 'Interactive 6-stage Kanban board with instant drag-and-drop, stage probabilities, and deal forecasting.',
              },
              {
                icon: <Zap className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-200" />,
                title: 'Customer Directory',
                desc: 'Complete 360-degree timeline of customer contracts, communication history, linked tasks, and notes.',
              },
              {
                icon: <LineChart className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-200" />,
                title: 'Revenue Analytics',
                desc: 'Cohort analysis, monthly growth curves, lead source breakdowns, and sales rep leaderboard metrics.',
              },
              {
                icon: <Bot className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-200" />,
                title: 'Task & Activity Tracking',
                desc: 'Schedule calls, log discovery notes, assign tasks, and set due dates with automated notifications.',
              },
              {
                icon: <BellRing className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-200" />,
                title: 'Real-Time WebSockets',
                desc: 'Instant push updates across your team when deals close, leads get assigned, or proposals are signed.',
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-200" />,
                title: 'Multi-Tenant Isolation',
                desc: 'Guaranteed cryptographic organization isolation, role-based access control, and complete audit logging.',
              },
              {
                icon: <Sparkles className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-200" />,
                title: 'Stripe Billing & Portal',
                desc: 'Seamless self-serve subscription billing, plan upgrades, automated invoicing, and seat management.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-indigo-200 transition-all duration-300 group cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 shadow-xs">
                  {f.icon}
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
                  {f.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              Simple 4-Step Process
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How ClientFlow Accelerates Revenue
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Capture Leads',
                desc: 'Ingest leads via website forms, referrals, and outreach campaigns into unified inbox.',
              },
              {
                step: '02',
                title: 'Manage Relationships',
                desc: 'Track meetings, phone calls, and notes with automated activity timelines.',
              },
              {
                step: '03',
                title: 'Close Deals',
                desc: 'Move prospects across your customized visual pipeline stages to contract signing.',
              },
              {
                step: '04',
                title: 'Grow Revenue',
                desc: 'Analyze win rates, identify bottlenecks, and scale your sales velocity.',
              },
            ].map((s, i) => (
              <div
                key={i}
                className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:-translate-y-1.5 hover:shadow-lg hover:bg-white hover:border-indigo-200 transition-all duration-300 group cursor-default"
              >
                <span className="text-3xl font-black text-indigo-600/30 group-hover:text-indigo-600/60 mb-2 transition-colors duration-200">
                  {s.step}
                </span>
                <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
                  {s.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Transparent Pricing
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Choose the plan that fits your growth
            </h3>
            <p className="mt-3 text-slate-400 text-sm">
              Scale effortlessly from freelance solo operations to full sales departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="p-8 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter</span>
                <h4 className="text-2xl font-bold text-white mt-1">FREE</h4>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-xs text-slate-400 ml-1">/ month</span>
                </div>
                <p className="mt-3 text-xs text-slate-400">Great for solo freelancers and early exploration.</p>
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 50 active leads
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 3 team members
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Visual Kanban pipeline
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Basic activity timeline
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="mt-8 block w-full py-3 text-center text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro - Featured */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-indigo-950/90 to-slate-800 border-2 border-indigo-500 shadow-2xl hover:shadow-indigo-500/25 hover:-translate-y-2 transition-all duration-300 relative flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-md">
                Most Popular
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Professional</span>
                <h4 className="text-2xl font-bold text-white mt-1">PRO</h4>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-black text-white">$29</span>
                  <span className="text-xs text-slate-400 ml-1">/ month</span>
                </div>
                <p className="mt-3 text-xs text-indigo-200">Ideal for growing teams and boutique agencies.</p>
                <ul className="mt-6 space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Up to 500 active leads
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Up to 10 team seats
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Advanced revenue analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Real-time WebSocket sync
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Email & notification queues
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="mt-8 block w-full py-3 text-center text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Start 14-Day Pro Trial
              </Link>
            </div>

            {/* Business */}
            <div className="p-8 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Scale</span>
                <h4 className="text-2xl font-bold text-white mt-1">BUSINESS</h4>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-black text-white">$79</span>
                  <span className="text-xs text-slate-400 ml-1">/ month</span>
                </div>
                <p className="mt-3 text-xs text-slate-400">Built for high-volume sales organizations.</p>
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited active leads
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 100 team seats
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full audit logs & compliance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Priority API rate limits
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dedicated account manager
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="mt-8 block w-full py-3 text-center text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Realistic Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              Verified Testimonials
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Loved by revenue leaders worldwide
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  'ClientFlow cut our average deal cycle from 45 days down to 21. The Kanban pipeline and live WebSocket updates keep our entire 8-person sales team completely in sync.',
                author: 'Danielle Wright',
                role: 'VP of Sales, CloudScale Solutions',
                rating: 5,
              },
              {
                quote:
                  'Unlike bulky legacy CRMs that take months to set up, we had our entire team onboarded on ClientFlow in under 10 minutes. The lead conversion rate jumped 32% in month one.',
                author: 'Marcus Thorne',
                role: 'Founder & CEO, Vanguard Tech',
                rating: 5,
              },
              {
                quote:
                  'The multi-tenant isolation and audit logging gave our enterprise clients immediate peace of mind. Truly a production-grade CRM platform.',
                author: 'Amara Okafor',
                role: 'COO, FinFlow Global',
                rating: 5,
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:-translate-y-1.5 hover:shadow-xl hover:bg-white hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between cursor-default"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 italic leading-relaxed">"{t.quote}"</p>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-900">{t.author}</p>
                  <p className="text-[11px] text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Build a better sales process with ClientFlow.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-indigo-100 max-w-xl mx-auto">
            Join hundreds of forward-thinking teams using ClientFlow to systematically convert leads into lifetime customers.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-200 group"
            >
              Get Started Free Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
