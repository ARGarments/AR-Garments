'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Subscribed:', email);
    setEmail('');
  };

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        {/* Compact banner card */}
        <div className="relative overflow-hidden rounded-2xl">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/home-images/newsletterbg.jpg"
              alt="Newsletter Background"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#083028]/85" />
          </div>

          {/* Content */}
          <div className="relative z-10 px-6 sm:px-10 py-7 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

              {/* Left — Text */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight mb-1">
                  Join Our Fashion Family
                </h2>
                <p className="text-white/70 text-xs sm:text-sm">
                  Get updates on new arrivals, exclusive offers &amp; festive collections.
                </p>
              </div>

              {/* Right — Form */}
              <form
                onSubmit={handleSubmit}
                className="flex items-center w-full sm:w-auto flex-shrink-0"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="flex-1 sm:w-60 md:w-72 px-4 py-0 text-sm text-gray-700 bg-white rounded-l-md focus:outline-none h-11"
                />
                <button
                  type="submit"
                  className="h-11 px-5 bg-[#B8860B] hover:bg-[#9a7009] text-white font-semibold text-sm rounded-r-md transition-colors duration-200 whitespace-nowrap"
                >
                  Subscribe →
                </button>
              </form>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
