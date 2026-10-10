'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type RegistrationMethod = 'password' | 'email-code';

function buildLoginHref(
  email: string,
  redirectUrl: string,
  registrationMethod: RegistrationMethod
): string {
  const params = new URLSearchParams();
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail) params.set('email', normalizedEmail);
  if (redirectUrl !== '/') params.set('redirect', redirectUrl);
  if (registrationMethod === 'email-code') params.set('method', 'email-code');

  const query = params.toString();
  return query ? `/login?${query}` : '/login';
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const initialEmail = searchParams.get('email')?.trim().toLowerCase() || '';
  const registrationMethod: RegistrationMethod =
    searchParams.get('method') === 'email-code' ? 'email-code' : 'password';
  const isEmailCodeRegistration = registrationMethod === 'email-code';
  const accountNotFound = searchParams.get('reason') === 'account-not-found';

  const {
    register,
    requestRegistrationCode,
    registerWithEmailCode,
    user,
    loading: authLoading,
  } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [registrationCodeSent, setRegistrationCodeSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showAccountNotice, setShowAccountNotice] = useState(accountNotFound);
  const loginHref = buildLoginHref(email, redirectUrl, registrationMethod);

  useEffect(() => {
    if (!authLoading && user && !success) {
      router.replace(redirectUrl);
    }
  }, [user, authLoading, redirectUrl, success, router]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  function finishRegistration(): void {
    setSuccess(true);
    toast.success('Account created! Welcome to AR Garment.', {
      title: 'Registration Successful',
    });
    window.setTimeout(() => {
      router.push(redirectUrl);
    }, 800);
  }

  async function sendRegistrationCode(): Promise<void> {
    const result = await requestRegistrationCode(name, email, phone);
    if (result.success) {
      setRegistrationCodeSent(true);
      setRegistrationCode('');
      setError(null);
      setErrorCode(null);
      setShowAccountNotice(false);
      setResendSeconds(result.retryAfterSeconds || 60);
      toast.success('A registration code was sent to your email.', {
        title: 'Check Your Email',
      });
      return;
    }

    const message = result.error || 'Unable to send the registration code.';
    setError(message);
    setErrorCode(result.errorCode || null);
    if (result.errorCode === 'ACCOUNT_EXISTS') {
      toast.warning(message, { title: 'Account Already Exists' });
    } else {
      toast.error(message, { title: 'Registration Email Failed' });
    }
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setErrorCode(null);

    if (!isEmailCodeRegistration && password.length < 6) {
      const message = 'Password must be at least 6 characters long.';
      setError(message);
      toast.warning(message, { title: 'Weak Password' });
      return;
    }

    setLoading(true);
    try {
      if (isEmailCodeRegistration && !registrationCodeSent) {
        await sendRegistrationCode();
        return;
      }

      const result = isEmailCodeRegistration
        ? await registerWithEmailCode(name, email, registrationCode, phone)
        : await register(name, email, password, phone);

      if (result.success) {
        finishRegistration();
        return;
      }

      const message = result.error || 'Failed to create account.';
      setError(message);
      setErrorCode(result.errorCode || null);
      if (result.errorCode === 'ACCOUNT_EXISTS') {
        toast.warning(message, { title: 'Account Already Exists' });
      } else {
        toast.error(message, { title: 'Registration Failed' });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode(): Promise<void> {
    if (loading || resendSeconds > 0) return;
    setError(null);
    setErrorCode(null);
    setLoading(true);
    try {
      await sendRegistrationCode();
    } finally {
      setLoading(false);
    }
  }

  function resetRegistrationCode(): void {
    setRegistrationCodeSent(false);
    setRegistrationCode('');
    setResendSeconds(0);
    setError(null);
    setErrorCode(null);
  }

  if (authLoading) {
    return (
      <div className="w-full max-w-md flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#083028] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && !success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Active</h2>
          <p className="text-sm text-gray-600 mb-6">
            You are logged in as <span className="font-semibold text-[#083028]">{user.email}</span>
          </p>
          <button
            onClick={() => router.push(redirectUrl)}
            className="w-full bg-[#083028] hover:bg-[#051e19] text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10">
        <div className="text-center mb-7">
          <Link href="/" className="inline-block mb-3">
            <div className="relative h-12 w-24 mx-auto">
              <Image
                src="/home-images/logo.png"
                alt="AR Garment"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Account
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {isEmailCodeRegistration
              ? 'Register securely with a one-time email code'
              : 'Join AR Garment to enjoy exclusive offers & fast checkout'}
          </p>
        </div>

        {showAccountNotice && !error && !success && (
          <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              No account was found for this email. Complete the form below to register first.
            </span>
          </div>
        )}

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p>{error}</p>
              {errorCode === 'ACCOUNT_EXISTS' && (
                <Link
                  href={loginHref}
                  className="mt-2 inline-flex items-center gap-1 font-bold text-[#083028] hover:underline"
                >
                  Sign In <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2.5">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>Account created successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Pankaj Sharma"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Email Address
              </label>
              {isEmailCodeRegistration && registrationCodeSent && (
                <button
                  type="button"
                  onClick={resetRegistrationCode}
                  className="text-[11px] font-semibold text-[#083028] hover:underline"
                >
                  Change email
                </button>
              )}
            </div>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                disabled={isEmailCodeRegistration && registrationCodeSent}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setShowAccountNotice(false);
                  setError(null);
                  setErrorCode(null);
                }}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white transition-all disabled:cursor-not-allowed disabled:text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                maxLength={30}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white transition-all"
              />
            </div>
          </div>

          {!isEmailCodeRegistration && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {isEmailCodeRegistration && registrationCodeSent && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Six-Digit Registration Code
              </label>
              <div className="relative">
                <KeyRound
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={registrationCode}
                  onChange={(event) =>
                    setRegistrationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm tracking-[0.35em] font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white transition-all"
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                The code expires in 10 minutes and can only be used once.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-3 bg-[#083028] hover:bg-[#051e19] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>
                  {isEmailCodeRegistration
                    ? registrationCodeSent
                      ? 'Verifying Code...'
                      : 'Sending Register Code...'
                    : 'Creating Account...'}
                </span>
              </>
            ) : (
              <>
                <span>
                  {isEmailCodeRegistration
                    ? registrationCodeSent
                      ? 'Verify & Create Account'
                      : 'Send Register Code'
                    : 'Create Account'}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {isEmailCodeRegistration && registrationCodeSent && (
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading || resendSeconds > 0}
              className="w-full text-xs font-semibold text-[#083028] hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {resendSeconds > 0
                ? `Send a new code in ${resendSeconds}s`
                : 'Send a new registration code'}
            </button>
          )}
        </form>

        <div className="mt-6 text-center text-xs sm:text-sm text-gray-500">
          Already have an account?{' '}
          <Link href={loginHref} className="font-bold text-[#083028] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center px-4 py-10">
      <Suspense fallback={<div className="py-24 text-center text-gray-400">Loading sign up...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
