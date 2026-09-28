import Image from 'next/image';
import Link from 'next/link';

export default function NewSeasonBanner() {
  return (
    <section className="py-6 sm:py-10 bg-secondary">
      <div className="container mx-auto px-4 sm:px-8 lg:px-12">
        <div className="relative h-[200px] sm:h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg">
          {/* Background Image — fully visible, minimal overlay */}
          <Image
            src="/home-images/hero-image2.jpg"
            alt="New Season New Styles"
            fill
            className="object-cover object-top"
          />
          {/* Very subtle left-side gradient only for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />

          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className="px-5 sm:px-10 md:px-16">
              {/* Left Text */}
              <div className="max-w-xs sm:max-w-sm md:max-w-xl">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2 sm:mb-3 drop-shadow-md">
                  New Season<br />New Styles
                </h2>
                <p className="text-gray-200 mb-3 sm:mb-5 hidden sm:block text-xs sm:text-sm md:text-base max-w-sm">
                  Discover elegant ethnic wear crafted for your special moments.
                </p>
                <Link
                  href="/category"
                  className="inline-flex items-center gap-1.5 bg-[#083028] hover:bg-[#051e19] border border-white/30 text-white rounded-lg font-semibold transition-colors shadow-lg px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm"
                >
                  Shop Collection →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
