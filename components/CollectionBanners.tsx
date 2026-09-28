import Image from 'next/image';
import Link from 'next/link';

export default function CollectionBanners() {
  return (
    <section className="py-8 sm:py-10 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Sarees Collection */}
          <Link
            href="/category?category=Sarees"
            className="relative h-[180px] sm:h-[240px] md:h-[300px] rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer shadow-md block"
          >
            <Image
              src="/home-images/hero-image6.jpg"
              alt="Sarees Collection"
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            {/* Minimal left gradient only for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
            <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1 drop-shadow">
                  Sarees Collection
                </h3>
                <p className="text-gray-200 text-xs sm:text-sm drop-shadow">Grace in Every Drape</p>
              </div>
              <div>
                <span className="inline-flex items-center gap-1 bg-[#083028] hover:bg-[#051e19] border border-white/30 text-white px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm shadow-md">
                  Shop Sarees →
                </span>
              </div>
            </div>
          </Link>

          {/* Suite Collection */}
          <Link
            href="/category?category=Suits+%26+Dress+Material"
            className="relative h-[180px] sm:h-[240px] md:h-[300px] rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer shadow-md block"
          >
            <Image
              src="/home-images/hero-image7.jpg"
              alt="Suite Collection"
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            {/* Minimal left gradient only for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
            <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1 drop-shadow">
                  Suite Collection
                </h3>
                <p className="text-gray-200 text-xs sm:text-sm drop-shadow">Unstitched Elegance, Endless Possibilities</p>
              </div>
              <div>
                <span className="inline-flex items-center gap-1 bg-[#083028] hover:bg-[#051e19] border border-white/30 text-white px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm shadow-md">
                  Shop Suits →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
