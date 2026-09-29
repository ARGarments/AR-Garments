'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      if (data.alreadySubscribed) {
        setFeedback({
          type: 'info',
          message: data.message || 'You are already subscribed to our newsletter!',
        });
      } else {
        setFeedback({
          type: 'success',
          message: data.message || 'Thank you for joining our fashion family!',
        });
        setEmail('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Subscription error. Please try again.';
      setFeedback({
        type: 'error',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        {/* Compact banner card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#083028] shadow-md">
          {/* Vector SVG Botanical Background */}
          <div className="absolute inset-0">
            <Image
              src="/home-images/newsletter-pattern.svg"
              alt="Botanical Background"
              fill
              className="object-cover object-center"
              priority
            />
          </div>

          {/* Content */}
          <div className="relative z-10 px-5 sm:px-10 py-7 sm:py-9">
            {/* Stack vertically on mobile, row on sm+ */}
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">

              {/* Text */}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight mb-1">
                  Join Our Fashion Family
                </h2>
                <p className="text-white/80 text-xs sm:text-sm">
                  Get updates on new arrivals, exclusive offers &amp; festive collections.
                </p>

                {/* Inline Feedback message */}
                {feedback && (
                  <div
                    className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                      feedback.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                        : feedback.type === 'info'
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                        : 'bg-red-500/20 text-red-200 border border-red-400/30'
                    }`}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle size={13} className="text-amber-400 shrink-0" />
                    )}
                    <span>{feedback.message}</span>
                  </div>
                )}
              </div>

              {/* Form — full width on mobile, auto on sm+ */}
              <form
                onSubmit={handleSubmit}
                className="flex items-stretch w-full sm:w-auto overflow-hidden rounded-lg shadow-sm"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (feedback) setFeedback(null);
                  }}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  className="flex-1 min-w-0 sm:w-60 md:w-72 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none rounded-l-lg disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-shrink-0 px-3.5 sm:px-5 py-2.5 sm:py-3 bg-[#B8860B] hover:bg-[#9a7009] text-white font-semibold text-xs sm:text-sm rounded-r-lg transition-colors duration-200 whitespace-nowrap flex items-center gap-1.5 disabled:opacity-80"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <span>Subscribe →</span>
                  )}
                </button>
              </form>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
