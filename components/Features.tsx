import { Truck, RotateCcw, DollarSign, Shield } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On All Orders',
  },
  {
    icon: RotateCcw,
    title: '7 Days Return',
    description: 'Easy & Hassle Free',
  },
  {
    icon: DollarSign,
    title: 'Cash on Delivery',
    description: 'Pay at Your Doorstep',
  },
  {
    icon: Shield,
    title: 'Premium Quality',
    description: '100% Original',
  },
];

export default function Features() {
  return (
    <section className="py-5 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        {/* Compact, well-balanced container to prevent excessive spacing */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 justify-center items-center">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 justify-center sm:justify-start"
            >
              <div className="flex-shrink-0 w-11 h-11 border border-gray-300 rounded-full flex items-center justify-center bg-gray-50/50">
                <feature.icon size={20} className="text-gray-700" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-800 text-sm leading-tight truncate">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
