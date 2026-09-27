import Image from 'next/image';

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
            <div className="px-6 sm:px-10 md:px-16">
              {/* Left Text */}
              <div className="max-w-xs sm:max-w-sm md:max-w-xl">
                <h2 className="font-bold text-white leading-tight mb-2 sm:mb-3"
                  style={{ fontSize: 'clamp(1.2rem, 4vw, 3rem)' }}>
                  New Season<br />New Styles
                </h2>
                <p className="text-gray-200 mb-4 sm:mb-7 hidden sm:block text-sm md:text-base">
                  Discover elegant ethnic wear crafted for your special moments.
                </p>
                <button className="bg-[#083028] hover:bg-[#051e19] border border-white/30 text-white rounded-md font-semibold transition-colors shadow-lg"
                  style={{ padding: 'clamp(6px, 1.2vw, 12px) clamp(14px, 2.5vw, 28px)', fontSize: 'clamp(0.7rem, 1.3vw, 0.875rem)' }}>
                  Shop Collection →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
