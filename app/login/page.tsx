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
  Shirt,
  Package,
  Headphones,
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
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && !success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-[#10141e]/90 p-8 rounded-3xl shadow-2xl border border-amber-400/30 text-center max-w-md w-full backdrop-blur-md">
          <div className="w-14 h-14 bg-amber-400/20 text-amber-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-400/30">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
          <p className="text-sm text-gray-300 mb-6">
            You are logged in as <span className="font-semibold text-amber-300">{user.email}</span>
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(redirectUrl)}
              className="w-full bg-gradient-to-r from-[#e5a93b] via-[#f5d061] to-[#d6982f] text-black py-2.5 rounded-xl font-bold text-sm shadow-lg transition-transform active:scale-95"
            >
              Continue to {redirectUrl === '/' ? 'Home' : redirectUrl} →
            </button>
            <button
              onClick={() => router.push('/cart')}
              className="w-full border border-amber-400/40 text-amber-300 hover:bg-white/5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
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
    <div className="w-full max-w-sm sm:max-w-md mx-auto py-1 sm:py-4 flex flex-col justify-between">
      {/* ── ARG Logo with Luxury Glow ── */}
      <div className="text-center mb-2 sm:mb-4">
        <Link href="/" className="inline-block">
          <div className="flex flex-col items-center">
            <div className="relative h-10 w-20 sm:h-14 sm:w-28 mx-auto filter drop-shadow-[0_2px_12px_rgba(245,208,97,0.4)]">
              <Image
                src="/home-images/logo.png"
                alt="AR Garment"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-[0.3em] text-[#f5d061] uppercase font-bold mt-0.5">
              A R GARMENT
            </span>
          </div>
        </Link>
        <h1 className="text-base sm:text-2xl font-bold text-white tracking-wide mt-1">
          Wholesale Portal <span className="text-[#f5d061]">Login</span>
        </h1>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          className={`mb-2 sm:mb-4 border px-3 py-2 rounded-xl text-xs sm:text-sm flex items-start gap-2 backdrop-blur-md ${
            errorCode === 'ACCOUNT_NOT_FOUND' || errorCode === 'ACCOUNT_PENDING_APPROVAL'
              ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
              : 'bg-red-950/70 border-red-500/50 text-red-200'
          }`}
        >
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-amber-400" />
          <div className="flex-1">
            <p>{error}</p>
            {errorCode === 'ACCOUNT_NOT_FOUND' && (
              <Link
                href={accountNotFoundRegisterHref}
                className="mt-1 inline-flex items-center gap-1 font-bold text-amber-400 hover:underline"
              >
                Register Now (नया रजिस्ट्रेशन करें) <ArrowRight size={13} />
              </Link>
            )}
            {errorCode === 'ACCOUNT_PENDING_APPROVAL' && (
              <div className="mt-0.5 text-[11px] text-amber-300 font-medium">
                ⏳ Verification usually takes 24-48 hours. Please check back later.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Success Banner ── */}
      {success && (
        <div className="mb-2 sm:mb-4 bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 px-3 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md">
          <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-400" />
          <span>Login successful! Redirecting to wholesale portal...</span>
        </div>
      )}

      {/* ── Method Selector (Password vs OTP) ── */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/5 border border-white/10 p-0.5 sm:p-1 mb-2 sm:mb-4 backdrop-blur-md">
        <button
          type="button"
          onClick={() => selectLoginMethod('password')}
          className={`rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all ${
            loginMethod === 'password'
              ? 'bg-gradient-to-r from-[#e5a93b] to-[#d6982f] text-black shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => selectLoginMethod('email-code')}
          className={`rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all ${
            loginMethod === 'email-code'
              ? 'bg-gradient-to-r from-[#e5a93b] to-[#d6982f] text-black shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Email OTP / Code
        </button>
      </div>

      {/* ── Form Card with Cyan/Gold Outer Glow Container (Exact Screenshot 1) ── */}
      <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-4">
        <div className="relative rounded-2xl p-3 sm:p-5 border border-cyan-500/30 bg-[#0d1624]/60 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.15)] space-y-2 sm:space-y-4">
          
          {/* Email Field */}
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-[#f5d061] mb-1 sm:mb-1.5">
              Registered Email ID
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/70" />
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
                placeholder="Enter your email address"
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-black/40 border border-cyan-500/40 rounded-xl text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]"
              />
            </div>
            <div className="flex justify-end mt-0.5">
              <Link href="/contact" className="text-[10px] sm:text-[11px] text-gray-400 hover:text-cyan-300">
                Forgot <span className="text-cyan-400">Email ID?</span>
              </Link>
            </div>
          </div>

          {/* Password Field */}
          {loginMethod === 'password' && (
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-[#f5d061] mb-1 sm:mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 sm:py-2.5 bg-black/40 border border-cyan-500/40 rounded-xl text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-300 p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="flex justify-end mt-0.5">
                <Link href="/contact" className="text-[10px] sm:text-[11px] text-[#f5d061] hover:underline">
                  Forgot Password
                </Link>
              </div>
            </div>
          )}

          {/* Email OTP Field */}
          {loginMethod === 'email-code' && emailCodeSent && (
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-[#f5d061] mb-1 sm:mb-1.5">
                Six-Digit Login Code / 6 अंकों का कोड
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/70" />
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
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-black/40 border border-cyan-500/40 rounded-xl text-xs sm:text-sm tracking-[0.3em] font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 transition-all text-center"
                />
              </div>
              <p className="mt-1 text-[10px] sm:text-[11px] text-gray-400">Code expires in 10 minutes.</p>
            </div>
          )}

          {loginMethod === 'email-code' && !emailCodeSent && (
            <p className="rounded-xl bg-cyan-950/40 border border-cyan-500/30 px-3 py-2 text-[10px] sm:text-[11px] leading-relaxed text-cyan-200">
              A 6-digit login code will be sent to your registered email ID. No password required.
            </p>
          )}
        </div>

        {/* ── Main Golden Pill Button ── */}
        <button
          type="submit"
          disabled={loading || success}
          className="w-full py-2.5 sm:py-3.5 rounded-full font-extrabold text-xs sm:text-base text-black bg-gradient-to-r from-[#e5a93b] via-[#f5d061] to-[#d6982f] hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_4px_20px_rgba(245,208,97,0.4)] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin text-black" />
              <span>
                {loginMethod === 'password'
                  ? 'Logging in...'
                  : emailCodeSent
                    ? 'Verifying Code...'
                    : 'Sending Code...'}
              </span>
            </>
          ) : (
            <span>
              {loginMethod === 'password'
                ? 'Login to Account'
                : emailCodeSent
                  ? 'Verify & Login'
                  : 'Send Login Code'}
            </span>
          )}
        </button>

        {loginMethod === 'email-code' && emailCodeSent && (
          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading || resendSeconds > 0}
            className="w-full text-[11px] sm:text-xs font-semibold text-amber-300 hover:underline disabled:text-gray-500 text-center"
          >
            {resendSeconds > 0
              ? `Resend code in ${resendSeconds}s`
              : 'Resend Code'}
          </button>
        )}
      </form>

      {/* ── Partner Section with Apparel Fold Image (Exact Screenshot 1) ── */}
      <div className="mt-2 sm:mt-6 text-center space-y-1 sm:space-y-3">
        <div>
          <h2 className="text-[10px] sm:text-sm font-semibold text-[#f5d061] uppercase tracking-wider">
            Your Trusted
          </h2>
          <p className="text-xs sm:text-base font-extrabold text-white tracking-wide">
            Wholesale Garment Partner
          </p>
        </div>

        {/* Product showcase image (login_shirt_img) */}
        <div className="relative py-0 sm:py-1">
          <div className="relative mx-auto w-full max-w-[210px] sm:max-w-none aspect-[16/9] filter drop-shadow-[0_8px_20px_rgba(245,208,97,0.3)]">
            <Image
              src="/home-images/login_shirt_img.png"
              alt="AR Garment Wholesale Collection"
              fill
              className="object-contain object-center rounded-xl"
              priority
            />
          </div>
        </div>

        {/* 3 Trust Pillars */}
        <div className="grid grid-cols-3 gap-1 pt-1.5 sm:pt-2 border-t border-white/10 text-center">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/5 border border-amber-400/30 flex items-center justify-center mb-0.5 sm:mb-1 text-[#f5d061]">
              <Shirt size={13} className="sm:w-4 sm:h-4" />
            </div>
            <span className="text-[9px] sm:text-[10px] text-gray-300 font-medium leading-tight">Quality Apparel</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/5 border border-amber-400/30 flex items-center justify-center mb-0.5 sm:mb-1 text-[#f5d061]">
              <Package size={13} className="sm:w-4 sm:h-4" />
            </div>
            <span className="text-[9px] sm:text-[10px] text-gray-300 font-medium leading-tight">Bulk Orders</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/5 border border-amber-400/30 flex items-center justify-center mb-0.5 sm:mb-1 text-[#f5d061]">
              <Headphones size={13} className="sm:w-4 sm:h-4" />
            </div>
            <span className="text-[9px] sm:text-[10px] text-gray-300 font-medium leading-tight">Customer Support</span>
          </div>
        </div>

        {/* Register Link */}
        <div className="pt-1 sm:pt-3 text-[11px] sm:text-xs text-gray-400">
          New to AR Garment?{' '}
          <Link href={registerHref} className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline">
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen sm:min-h-screen h-screen sm:h-auto overflow-hidden sm:overflow-auto bg-[#07090e] bg-[radial-gradient(ellipse_at_top_left,#182740_0%,transparent_50%),radial-gradient(ellipse_at_bottom_left,#182740_0%,transparent_50%),radial-gradient(ellipse_at_top_right,#635123_0%,transparent_55%),radial-gradient(ellipse_at_bottom_right,#635123_0%,transparent_55%)] relative flex items-center justify-center px-3 sm:px-4 py-2 sm:py-8 text-white">
      {/* ── Left Side Navy Blend (#182740) ── */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-[450px] h-[550px] rounded-full bg-[#182740]/85 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-[450px] h-[550px] rounded-full bg-[#182740]/85 blur-[100px]" />

      {/* ── Right Side Gold Blend (#635123) ── */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-[450px] h-[550px] rounded-full bg-[#635123]/80 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-[450px] h-[550px] rounded-full bg-[#635123]/70 blur-[100px]" />

      <div className="relative z-10 w-full max-w-sm sm:max-w-md h-full flex items-center justify-center">
        <Suspense fallback={<div className="py-24 text-center text-amber-300">Loading sign in...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
