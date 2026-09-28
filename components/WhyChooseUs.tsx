import { Gem, TrendingUp, Lock, Smile } from 'lucide-react';

const features = [
  {
    icon: Gem,
    title: 'Premium Fabric',
    description: 'Handpicked quality materials for comfort and durability',
  },
  {
    icon: TrendingUp,
    title: 'Trendy Designs',
    description: 'Latest fashion trends curated by expert designers',
  },
  {
    icon: Lock,
    title: 'Secure Shopping',
    description: '100% secure payment and data protection',
  },
  {
    icon: Smile,
    title: 'Happy Customers',
    description: 'Thousands of satisfied customers across India',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-8 sm:py-14 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Why Choose AR Garment
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Your trusted destination for ethnic fashion
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center group p-2"
            >
              {/* Icon circle */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2.5 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-[#083028] transition-colors duration-300">
                <feature.icon
                  size={20}
                  className="text-[#083028] group-hover:text-white transition-colors duration-300 sm:hidden"
                  strokeWidth={1.5}
                />
                <feature.icon
                  size={28}
                  className="text-[#083028] group-hover:text-white transition-colors duration-300 hidden sm:block"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-1 sm:mb-1.5">
                {feature.title}
              </h3>
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 leading-normal sm:leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
