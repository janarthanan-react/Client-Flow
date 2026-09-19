import React from 'react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { ShieldCheck, Target, Heart, Sparkles } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      <section className="py-20 bg-gradient-to-b from-indigo-50/40 via-white to-white border-b border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Our Mission</span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mt-2">Empowering Modern Revenue Teams</h1>
          <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ClientFlow was founded on a simple principle: CRM software should accelerate deals, not burden sales teams with clunky admin work.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Clarity First</h3>
            <p className="text-xs text-slate-600 mt-2">Clean, visual dashboards where you always know where every deal stands in your pipeline.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Enterprise Security</h3>
            <p className="text-xs text-slate-600 mt-2">PostgreSQL ACID reliability, strict multi-tenant isolation, and complete audit logging.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Real-Time Speed</h3>
            <p className="text-xs text-slate-600 mt-2">Sub-second response times, WebSocket notifications, and background queues for blazing performance.</p>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
};
