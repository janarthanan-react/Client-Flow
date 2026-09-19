import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'slate'
    | 'indigo'
    | 'emerald'
    | 'rose'
    | 'amber'
    | 'sky'
    | 'purple'
    | 'status'
    | 'priority';
  statusValue?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  statusValue,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold tracking-wide',
    md: 'text-xs px-2.5 py-0.5 font-medium',
  };

  const getVariantStyles = () => {
    if (statusValue) {
      const val = statusValue.toUpperCase();
      switch (val) {
        // Lead Statuses
        case 'NEW':
          return 'bg-blue-50 text-blue-700 border-blue-200/80';
        case 'CONTACTED':
          return 'bg-amber-50 text-amber-700 border-amber-200/80';
        case 'QUALIFIED':
          return 'bg-purple-50 text-purple-700 border-purple-200/80';
        case 'PROPOSAL':
          return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
        case 'UNQUALIFIED':
          return 'bg-slate-100 text-slate-600 border-slate-200/80';

        // Deal Stages
        case 'PROSPECTING':
          return 'bg-slate-100 text-slate-700 border-slate-300/80';
        case 'NEGOTIATION':
          return 'bg-amber-50 text-amber-800 border-amber-300/80';
        case 'CLOSED_WON':
          return 'bg-emerald-50 text-emerald-700 border-emerald-300/80 font-semibold';
        case 'CLOSED_LOST':
          return 'bg-rose-50 text-rose-700 border-rose-300/80';

        // Task Priorities
        case 'URGENT':
          return 'bg-rose-50 text-rose-700 border-rose-300/80 font-bold';
        case 'HIGH':
          return 'bg-orange-50 text-orange-700 border-orange-200/80 font-semibold';
        case 'MEDIUM':
          return 'bg-blue-50 text-blue-700 border-blue-200/80';
        case 'LOW':
          return 'bg-slate-100 text-slate-600 border-slate-200/80';

        // Task Statuses
        case 'TODO':
          return 'bg-slate-100 text-slate-700 border-slate-200/80';
        case 'IN_PROGRESS':
          return 'bg-sky-50 text-sky-700 border-sky-200/80';
        case 'COMPLETED':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium';
        case 'CANCELLED':
          return 'bg-rose-50 text-rose-600 border-rose-200/80';

        // Roles
        case 'OWNER':
          return 'bg-indigo-100 text-indigo-800 border-indigo-200 font-semibold';
        case 'ADMIN':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'SALES':
          return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'MEMBER':
          return 'bg-slate-100 text-slate-700 border-slate-200';

        default:
          return 'bg-slate-100 text-slate-700 border-slate-200';
      }
    }

    const map = {
      slate: 'bg-slate-100 text-slate-700 border-slate-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rose: 'bg-rose-50 text-rose-700 border-rose-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      sky: 'bg-sky-50 text-sky-700 border-sky-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      status: 'bg-slate-100 text-slate-700 border-slate-200',
      priority: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    return map[variant];
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all duration-150 ${sizeStyles[size]} ${getVariantStyles()} ${className}`}
    >
      {children}
    </span>
  );
};
