'use client';

import Image from 'next/image';
import Link from 'next/link';

const categories = [
  {
    name: 'Sarees',
    subtitle: 'Elegant Drapes',
    image: '/home-images/Sarees.jpg',
    href: '/category?category=Sarees',
  },
  {
    name: 'Suits & Dress Material',
    subtitle: 'Unstitched & Ready',
    image: '/home-images/Suits & Dress Materia.jpg',
    href: '/category?category=Suits+%26+Dress+Material',
  },
  {
    name: 'Dupatta Sets',
    subtitle: 'Complete Elegance',
    image: '/home-images/Dupatta Sets.jpg',
    href: '/category?category=Dupatta+Sets',
  },
  {
    name: 'Men Fashion',
    subtitle: 'Traditional & Trendy',
    image: '/home-images/Men Fashion.jpg',
    href: '/category?category=Men+Fashion',
  },
  {
    name: 'Kids Fashion',
    subtitle: 'Little Trends',
    image: '/home-images/Kids Fashion.jpg',
    href: '/category?category=Kids+Fashion',
  },
];

export default function ShopByCategory() {
  return (
    <section className="py-10 bg-[#F5F1E8]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
            <p className="text-base text-gray-400 hidden md:block">Explore our exclusive ethnic collections</p>
          </div>
          <Link
            href="/category"
            className="text-sm font-semibold text-white bg-[#083028] hover:bg-[#051e19] px-4 py-2 rounded-md transition-colors flex-shrink-0"
          >
            View All →
          </Link>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.href}
              className="group cursor-pointer block"
            >
              {/* Card Image */}
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-[#EDE8DF] shadow-sm group-hover:shadow-md transition-shadow"
                style={{ height: '280px' }}
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Card Text */}
              <div className="mt-3 px-1">
                <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#083028] transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{category.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
