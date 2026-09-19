import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Eye, EyeOff, Lock, Mail, Building2, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine((val) => val === true, 'You must agree to the Terms of Service'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchedPassword = watch('password', '');

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (watchedPassword.length >= 8) score++;
    if (/[A-Z]/.test(watchedPassword)) score++;
    if (/[0-9]/.test(watchedPassword)) score++;
    if (/[^A-Za-z0-9]/.test(watchedPassword)) score++;
    return score;
  }, [watchedPassword]);

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-emerald-500'];

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      await registerAuth(data);
      success('Account Created!', 'Welcome to ClientFlow. Your CRM workspace is ready.');
      navigate('/dashboard');
    } catch (err: any) {
      toastError('Registration Failed', err.response?.data?.message || 'Could not complete registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient background blur */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-300/30 to-purple-300/20 blur-3xl -z-10 rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 group-hover:rotate-2 transition-transform duration-200">
            <Layers className="w-6 h-6" />
          </div>
          <span className="font-black text-2xl text-slate-900 tracking-tight">
            Client<span className="text-indigo-600">Flow</span>
          </span>
        </Link>
        <h2 className="mt-6 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Create your CRM Workspace
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-200/90">
          <GoogleLoginButton mode="signup" className="mb-5" />

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-2.5 text-slate-400 font-bold tracking-wider">
                Or sign up with email
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="Sarah"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last Name"
                placeholder="Jenkins"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label="Organization Name"
              placeholder="Acme Growth Corp"
              leftIcon={<Building2 className="w-4 h-4" />}
              helperText="This creates your isolated CRM workspace."
              error={errors.organizationName?.message}
              {...register('organizationName')}
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="sarah@acmegrowth.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />

              {/* Password Strength Meter */}
              {watchedPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 transition-all ${
                          i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-right font-bold text-slate-500">
                    Strength: {strengthLabels[passwordStrength - 1] || 'Too short'}
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5"
                  {...register('agreeTerms')}
                />
                <span className="text-slate-600 leading-normal">
                  I agree to the{' '}
                  <a href="#" className="font-semibold text-indigo-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="font-semibold text-indigo-600 hover:underline">
                    Privacy Policy
                  </a>.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="mt-1 text-xs text-rose-600">{errors.agreeTerms.message}</p>
              )}
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full mt-4">
              Create Account & Workspace
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
