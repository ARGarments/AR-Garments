'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type LoginMethod = 'password' | 'email-code';
type RegistrationReason = 'account-not-found' | null;

function buildRegisterHref(
  email: string,
  redirectUrl: string,
  loginMethod: LoginMethod,
  reason: RegistrationReason
): string {
  const params = new URLSearchParams();
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail) params.set('email', normalizedEmail);
  if (redirectUrl !== '/') params.set('redirect', redirectUrl);
  if (loginMethod === 'email-code') params.set('method', 'email-code');
  if (reason) params.set('reason', reason);

  const query = params.toString();
  return query ? `/register?${query}` : '/register';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const initialEmail = searchParams.get('email')?.trim().toLowerCase() || '';
  const initialLoginMethod: LoginMethod =
    searchParams.get('method') === 'email-code' ? 'email-code' : 'password';

  const {
    login,
    requestEmailCode,
    loginWithEmailCode,
    user,
    loading: authLoading,
  } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(initialLoginMethod);
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const registerHref = buildRegisterHref(email, redirectUrl, loginMethod, null);
  const accountNotFoundRegisterHref = buildRegisterHref(
    email,
    redirectUrl,
    loginMethod,
    'account-not-found'
  );

  // Auto redirect if already logged in
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

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-8 h-8 border-4 border-[#083028] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If already logged in, show redirecting state
  if (user && !success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full">
          <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
          <p className="text-sm text-gray-600 mb-6">
            You are logged in as <span className="font-semibold text-[#083028]">{user.email}</span>
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(redirectUrl)}
              className="w-full bg-[#083028] hover:bg-[#051e19] text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              Continue to {redirectUrl === '/' ? 'Home' : redirectUrl} →
            </button>
            <button
              onClick={() => router.push('/cart')}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              View Shopping Bag
            </button>
          </div>
        </div>
      </div>
    );
  }

  function finishLogin(): void {
    setSuccess(true);
    toast.success('Welcome back! Signed in successfully.', { title: 'Login Successful' });
    window.setTimeout(() => {
      router.push(redirectUrl);
    }, 800);
  }

  async function sendEmailCode(): Promise<void> {
    const result = await requestEmailCode(email);
    if (result.success) {
      setEmailCodeSent(true);
      setEmailCode('');
      setError(null);
      setErrorCode(null);
      setResendSeconds(result.retryAfterSeconds || 60);
      toast.success('A login code was sent to your email.', {
        title: 'Check Your Email',
      });
      return;
    }

    const message = result.error || 'Unable to send the login code.';
    setError(message);
    setErrorCode(result.errorCode || null);
    setEmailCodeSent(false);
    setEmailCode('');
    setResendSeconds(0);
    if (result.errorCode === 'ACCOUNT_NOT_FOUND') {
      toast.warning(message, { title: 'Account Not Found' });
    } else {
      toast.error(message, { title: 'Email Login Failed' });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setLoading(true);

    try {
      if (loginMethod === 'email-code' && !emailCodeSent) {
        await sendEmailCode();
        return;
      }

      const result =
        loginMethod === 'password'
          ? await login(email, password)
          : await loginWithEmailCode(email, emailCode);

      if (result.success) {
        finishLogin();
      } else {
        const message = result.error || 'Invalid login details.';
        setError(message);
        setErrorCode(result.errorCode || null);
        if (result.errorCode === 'ACCOUNT_NOT_FOUND') {
          toast.warning(message, { title: 'Account Not Found' });
        } else {
          toast.error(message, { title: 'Login Failed' });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleResendCode(): Promise<void> {
    if (resendSeconds > 0 || loading) return;
    setError(null);
    setErrorCode(null);
    setLoading(true);
    try {
      await sendEmailCode();
    } finally {
      setLoading(false);
    }
  }

  function selectLoginMethod(method: LoginMethod): void {
    setLoginMethod(method);
    setError(null);
    setErrorCode(null);
    setEmailCode('');
    setEmailCodeSent(false);
    setResendSeconds(0);
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10">
          {/* Header */}
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
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Sign in to your AR Garment account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className={`mb-5 border px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 animate-shake ${
                errorCode === 'ACCOUNT_NOT_FOUND'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p>{error}</p>
                {errorCode === 'ACCOUNT_NOT_FOUND' && (
                  <Link
                    href={accountNotFoundRegisterHref}
                    className="mt-2 inline-flex items-center gap-1 font-bold text-[#083028] hover:underline"
                  >
                    Register Now <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2.5">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>Login successful! Redirecting...</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 mb-5">
            <button
              type="button"
              onClick={() => selectLoginMethod('password')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                loginMethod === 'password'
                  ? 'bg-white text-[#083028] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => selectLoginMethod('email-code')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                loginMethod === 'email-code'
                  ? 'bg-white text-[#083028] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Email Code
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                    setErrorCode(null);
                    if (emailCodeSent) {
                      setEmailCodeSent(false);
                      setEmailCode('');
                      setResendSeconds(0);
                    }
                  }}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            {loginMethod === 'password' && <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => selectLoginMethod('email-code')}
                  className="text-[11px] text-[#083028] font-semibold hover:underline"
                >
                  Use email code
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
            </div>}

            {loginMethod === 'email-code' && emailCodeSent && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Six-Digit Login Code
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
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm tracking-[0.35em] font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white transition-all"
                  />
                </div>
                <p className="mt-2 text-[11px] text-gray-500">
                  The code expires in 10 minutes and can only be used once.
                </p>
              </div>
            )}

            {loginMethod === 'email-code' && !emailCodeSent && (
              <p className="rounded-xl bg-[#083028]/5 px-4 py-3 text-xs leading-relaxed text-[#083028]/70">
                We&apos;ll email a one-time login code to your registered address. No password is required.
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-2 bg-[#083028] hover:bg-[#051e19] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>
                    {loginMethod === 'password'
                      ? 'Signing In...'
                      : emailCodeSent
                        ? 'Verifying Code...'
                        : 'Sending Code...'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {loginMethod === 'password'
                      ? 'Sign In'
                      : emailCodeSent
                        ? 'Verify & Sign In'
                        : 'Send Login Code'}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {loginMethod === 'email-code' && emailCodeSent && (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading || resendSeconds > 0}
                className="w-full text-xs font-semibold text-[#083028] hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {resendSeconds > 0
                  ? `Send a new code in ${resendSeconds}s`
                  : 'Send a new code'}
              </button>
            )}
          </form>


          {/* Switch to Register */}
          <div className="mt-6 text-center text-xs sm:text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              href={registerHref}
              className="font-bold text-[#083028] hover:underline"
            >
              Sign Up Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center px-4">
      <Suspense fallback={<div className="py-24 text-center text-gray-400">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
