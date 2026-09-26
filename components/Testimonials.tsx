'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { adminData, Testimonial, defaultTestimonials } from '@/lib/adminData';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(defaultTestimonials);

  useEffect(() => {
    const data = adminData.getTestimonials().filter(t => t.active);
    if (data.length > 0) setTestimonials(data);
  }, []);

  const activeTestimonials = testimonials.filter(t => t.active);

  if (activeTestimonials.length === 0) return null;

  return (
    <section className="py-12 bg-secondary">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">What Our Customers Say</h2>
          <button className="text-sm font-semibold text-white bg-[#083028] hover:bg-[#051e19] px-4 py-2 rounded-md transition-colors">
            View All →
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              {/* Large quote mark */}
              <div className="text-5xl text-[#083028]/15 font-serif leading-none mb-3 select-none">&ldquo;</div>

              {/* Review text */}
              <p className="text-gray-600 mb-5 text-sm leading-relaxed">{testimonial.text}</p>

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-5">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={15} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#083028] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{testimonial.name[0]}</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{testimonial.name}</h4>
                  <p className="text-xs text-gray-400">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
