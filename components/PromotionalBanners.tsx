import Image from 'next/image';

const banners = [
  {
    title: 'Festive Collection',
    subtitle: 'Celebrate in Every Thread',
    buttonText: 'Shop Now',
    image: '/home-images/hero-image3.jpg',
  },
  {
    title: 'Wedding Special',
    subtitle: 'Drape Your Dreams',
    buttonText: 'Shop Now',
    image: '/home-images/hero-image4.jpg',
  },
  {
    title: 'Everyday Elegance',
    subtitle: 'Comfort Meets Style',
    buttonText: 'Shop Now',
    image: '/home-images/hero-image5.jpg',
  },
];

export default function PromotionalBanners() {
  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {banners.map((banner, index) => (
            <div
              key={index}
              className="relative h-[180px] sm:h-[200px] md:h-[240px] rounded-2xl overflow-hidden group cursor-pointer shadow-md"
            >
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              {/* Minimal left gradient only for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
              <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-0.5 drop-shadow">
                    {banner.title}
                  </h3>
                  <p className="text-gray-200 text-xs drop-shadow">{banner.subtitle}</p>
                </div>
                <button className="self-start bg-[#083028] hover:bg-[#051e19] border border-white/30 text-white px-4 py-1.5 rounded-md font-semibold transition-colors text-xs">
                  {banner.buttonText} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
