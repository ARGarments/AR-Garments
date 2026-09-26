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
    <section className="py-14 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Why Choose AR Garment
          </h2>
          <p className="text-sm text-gray-400">
            You&apos;re trusted destination for ethnic fashion
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center group"
            >
              {/* Icon circle */}
              <div className="w-20 h-20 mx-auto mb-5 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-[#083028] transition-colors duration-300">
                <feature.icon
                  size={34}
                  className="text-[#083028] group-hover:text-white transition-colors duration-300"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
