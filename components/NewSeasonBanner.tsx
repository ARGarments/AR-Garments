import Image from 'next/image';

export default function NewSeasonBanner() {
  return (
    <section className="py-10 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="relative h-[380px] md:h-[440px] rounded-2xl overflow-hidden shadow-lg">
          {/* Background Image */}
          <Image
            src="/home-images/hero-image2.jpg"
            alt="New Season New Styles"
            fill
            className="object-cover object-top"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#083028]/70" />

          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className="container mx-auto px-8 md:px-16 flex justify-between items-center">
              {/* Left Text */}
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
                  New Season<br />New Styles
                </h2>
                <p className="text-gray-300 mb-8 text-sm md:text-base">
                  Discover elegant ethnic wear crafted for your special moments.
                </p>
                <button className="bg-[#083028] hover:bg-[#051e19] border border-white/30 text-white px-8 py-3 rounded-md font-semibold transition-colors text-sm shadow-lg">
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
