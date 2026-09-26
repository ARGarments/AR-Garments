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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {banners.map((banner, index) => (
            <div
              key={index}
              className="relative h-[200px] md:h-[220px] rounded-2xl overflow-hidden group cursor-pointer shadow-md"
            >
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-[#083028]/65" />
              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {banner.title}
                  </h3>
                  <p className="text-gray-300 text-xs">{banner.subtitle}</p>
                </div>
                <button className="self-start bg-[#083028] hover:bg-[#051e19] border border-white/30 text-white px-5 py-2 rounded-md font-semibold transition-colors text-xs">
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
