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
        <div className="relative overflow-hidden rounded-2xl bg-[#083028] shadow-md">
          {/* Vector SVG Botanical Background — zero raster artifacts or dark overlay layers */}
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
              </div>

              {/* Form — full width on mobile, auto on sm+ */}
              <form
                onSubmit={handleSubmit}
                className="flex items-stretch w-full sm:w-auto overflow-hidden rounded-lg shadow-sm"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 min-w-0 sm:w-60 md:w-72 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none rounded-l-lg"
                />
                <button
                  type="submit"
                  className="flex-shrink-0 px-3.5 sm:px-5 py-2.5 sm:py-3 bg-[#B8860B] hover:bg-[#9a7009] text-white font-semibold text-xs sm:text-sm rounded-r-lg transition-colors duration-200 whitespace-nowrap"
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
