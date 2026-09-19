import React, { useState } from 'react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { Mail, MessageSquare, MapPin, Send } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useToast } from '../../contexts/ToastContext';

export const ContactPage: React.FC = () => {
  const { success } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      success('Message Sent!', 'Our team will respond within 2 business hours.');
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      <section className="py-20 bg-gradient-to-b from-indigo-50/40 via-white to-white border-b border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Get in Touch</span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mt-2">We'd Love to Hear From You</h1>
          <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto">
            Have questions about custom integrations, high-volume tier plans, or enterprise SLA? Our team is standing by.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Direct Support Channels</h3>
              <p className="text-xs text-slate-600 mt-1">Reach out via any channel and we will get back to you promptly.</p>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Email Support</p>
                  <p className="text-slate-500">support@clientflow.io</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Enterprise Sales Inquiry</p>
                  <p className="text-slate-500">sales@clientflow.io</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Headquarters</p>
                  <p className="text-slate-500">100 Montgomery St, Suite 1400, San Francisco, CA</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Send className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Thank you!</h4>
                <p className="text-xs text-slate-500 mt-1">We received your message and will be in touch shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Your Name" required placeholder="Jane Doe" />
                <Input label="Work Email" type="email" required placeholder="jane@company.com" />
                <Input label="Subject" required placeholder="Question about Pro Tier" />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us about your team and requirements..."
                    className="w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <Button type="submit" isLoading={loading} className="w-full">
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
};
