import Image from 'next/image';
import Link from 'next/link';

const banners = [
  {
    title: 'Festive Collection',
    subtitle: 'Celebrate in Every Thread',
    buttonText: 'Shop Now',
    image: '/home-images/hero-image3.jpg',
    href: '/category?category=Sarees',
  },
  {
    title: 'Wedding Special',
    subtitle: 'Drape Your Dreams',
    buttonText: 'Shop Now',
    image: '/home-images/hero-image4.jpg',
    href: '/category?category=Suits+%26+Dress+Material',
  },
  {
    title: 'Everyday Elegance',
    subtitle: 'Comfort Meets Style',
    buttonText: 'Shop Now',
    image: '/home-images/hero-image5.jpg',
    href: '/category?category=Dupatta+Sets',
  },
];

export default function PromotionalBanners() {
  return (
    <section className="py-8 sm:py-10 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {banners.map((banner, index) => (
            <Link
              key={index}
              href={banner.href}
              className="relative h-[160px] sm:h-[190px] md:h-[230px] rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer shadow-md block"
            >
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              {/* Minimal left gradient only for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
              <div className="absolute inset-0 p-3.5 sm:p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-0.5 drop-shadow">
                    {banner.title}
                  </h3>
                  <p className="text-gray-200 text-xs drop-shadow">{banner.subtitle}</p>
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 bg-[#083028] hover:bg-[#051e19] border border-white/30 text-white px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition-colors text-xs shadow-md">
                    {banner.buttonText} →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
