'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { login, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && !success) {
      router.replace(redirectUrl);
    }
  }, [user, authLoading, redirectUrl, success, router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      toast.success('Welcome back! Signed in successfully.', { title: 'Login Successful' });
      setTimeout(() => {
        router.push(redirectUrl);
      }, 800);
    } else {
      const errMsg = res.error || 'Invalid credentials';
      setError(errMsg);
      toast.error(errMsg, { title: 'Login Failed' });
    }
  };

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
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2.5">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>Login successful! Redirecting...</span>
            </div>
          )}

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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083028] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <a href="#" className="text-[11px] text-[#083028] font-semibold hover:underline">
                  Forgot?
                </a>
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-2 bg-[#083028] hover:bg-[#051e19] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>


          {/* Switch to Register */}
          <div className="mt-6 text-center text-xs sm:text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              href={`/register${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
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
