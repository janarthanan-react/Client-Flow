import React from 'react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { Users, Kanban, LineChart, ShieldCheck, Zap, Bot, BellRing, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FeaturesPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      <section className="py-20 bg-gradient-to-b from-indigo-50/40 via-white to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Product Capabilities</span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mt-2">Powerful Features to Supercharge Sales</h1>
          <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto">
            Explore how ClientFlow streamlines lead qualification, relationship tracking, deal closing, and team collaboration.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* Feature 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Intelligent Lead Capture & Qualification</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Never let an inquiry slip through the cracks. Ingest leads with automatic attribution by source, calculate estimated deal values, and assign them to the right sales reps instantly. Convert qualified leads into full customer accounts with a single click.
            </p>
            <ul className="mt-6 space-y-2 text-xs font-medium text-slate-700">
              <li className="flex items-center gap-2">✓ Advanced multi-attribute search and filtering</li>
              <li className="flex items-center gap-2">✓ Bulk status updates and one-click customer conversion</li>
              <li className="flex items-center gap-2">✓ Automated notification triggers on lead assignment</li>
            </ul>
          </div>
          <div className="p-6 bg-slate-900 rounded-2xl shadow-xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">Lead Directory</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Real-time DB</span>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="p-3 bg-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-bold">Marcus Sterling</p>
                  <p className="text-[10px] text-slate-400">Vanguard Technologies</p>
                </div>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-semibold">$12,000</span>
              </div>
              <div className="p-3 bg-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-bold">Jessica Alvarez</p>
                  <p className="text-[10px] text-slate-400">CloudScale Solutions</p>
                </div>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-semibold">$24,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 p-6 bg-slate-900 rounded-2xl shadow-xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">Kanban Board</span>
              <span className="text-[10px] text-emerald-400">WebSocket Connected</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-800 rounded-lg border-t-2 border-indigo-400">
                <p className="text-[10px] text-slate-400">Proposal (5)</p>
                <p className="font-bold mt-1">$174,000</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-lg border-t-2 border-emerald-400">
                <p className="text-[10px] text-slate-400">Closed Won (6)</p>
                <p className="font-bold text-emerald-400 mt-1">$226,000</p>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Kanban className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Interactive Visual Sales Pipeline</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Track deal velocity across six configurable stages: Prospecting, Qualification, Proposal, Negotiation, Closed Won, and Closed Lost. Dynamic stage probabilities give leadership an accurate revenue forecast in real-time.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-indigo-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h3 className="text-3xl font-black">Experience the full power of ClientFlow</h3>
          <p className="text-sm text-indigo-100 mt-2">Start your free trial today. No setup fees, no contracts.</p>
          <Link
            to="/register"
            className="inline-block mt-6 px-6 py-3 rounded-xl bg-white text-indigo-600 font-bold text-sm shadow hover:bg-indigo-50 transition-all"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
