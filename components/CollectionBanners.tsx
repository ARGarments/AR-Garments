import Image from 'next/image';

export default function CollectionBanners() {
  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sarees Collection */}
          <div className="relative h-[200px] sm:h-[240px] md:h-[300px] rounded-2xl overflow-hidden group cursor-pointer shadow-md">
            <Image
              src="/home-images/hero-image6.jpg"
              alt="Sarees Collection"
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            {/* Minimal left gradient only for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
            <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 drop-shadow">
                  Sarees Collection
                </h3>
                <p className="text-gray-200 text-xs sm:text-sm drop-shadow">Grace in Every Drape</p>
              </div>
              <div className="flex gap-3">
                <button className="bg-[#083028] hover:bg-[#051e19] border border-white/30 text-white px-4 sm:px-5 py-2 rounded-md font-semibold transition-colors text-xs sm:text-sm">
                  Shop Sarees →
                </button>
              </div>
            </div>
          </div>

          {/* Suite Collection */}
          <div className="relative h-[200px] sm:h-[240px] md:h-[300px] rounded-2xl overflow-hidden group cursor-pointer shadow-md">
            <Image
              src="/home-images/hero-image7.jpg"
              alt="Suite Collection"
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            {/* Minimal left gradient only for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
            <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 drop-shadow">
                  Suite Collection
                </h3>
                <p className="text-gray-200 text-xs sm:text-sm drop-shadow">Unstitched Elegance, Endless Possibilities</p>
              </div>
              <div className="flex gap-3">
                <button className="bg-[#083028] hover:bg-[#051e19] border border-white/30 text-white px-4 sm:px-5 py-2 rounded-md font-semibold transition-colors text-xs sm:text-sm">
                  Shop Suits →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
