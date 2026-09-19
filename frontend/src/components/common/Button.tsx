import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97] hover:-translate-y-0.5 active:translate-y-0';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-sm hover:shadow-indigo-500/25 hover:shadow-md focus:ring-indigo-500',
    secondary:
      'bg-slate-100 hover:bg-slate-200/90 text-slate-800 hover:shadow-sm focus:ring-slate-400',
    outline:
      'border border-slate-200/90 bg-white hover:bg-slate-50/90 text-slate-700 hover:border-slate-300 hover:shadow-sm focus:ring-indigo-500',
    danger:
      'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-sm hover:shadow-rose-500/25 hover:shadow-md focus:ring-rose-500',
    ghost:
      'hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-400 hover:translate-y-0',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {!isLoading && leftIcon && <span className="shrink-0 transition-transform duration-200">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0 transition-transform duration-200">{rightIcon}</span>}
    </button>
  );
};
