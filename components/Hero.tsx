'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { HeroSlide } from '@/lib/adminData';

export default function Hero() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetch('/api/hero-slides')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!Array.isArray(data)) return;
        const mapped: HeroSlide[] = data.map((d: Record<string, unknown>) => ({
          id: d.id as string,
          title: d.title as string,
          subtitle: d.subtitle as string,
          buttonText: d.button_text as string,
          buttonLink: d.button_link as string,
          image: d.image as string,
          label: d.label as string,
          active: d.active as boolean,
          order: d.sort_order as number,
        }));
        const active = mapped.filter((s) => s.active).sort((a, b) => a.order - b.order);
        setSlides(active);
      })
      .catch(() => setSlides([]));
  }, []);

  const activeSlides = slides.filter(s => s.active);

  useEffect(() => {
    if (activeSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

  if (activeSlides.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-[#083028]"
      style={{ height: 'clamp(240px, 52vw, 660px)' }}
    >
      {activeSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover object-top"
              priority={index === 0}
              sizes="100vw"
            />
            {/* Very subtle left gradient — image visible on right side */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
          </div>

          {/* Text Content — left side, never overflows into image area */}
          <div className="relative h-full flex items-center">
            <div className="w-1/2 sm:w-[45%] md:w-2/5 lg:w-1/3 pl-4 sm:pl-8 md:pl-14 lg:pl-20 pr-2">
              {/* Label */}
              <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-white/80 uppercase tracking-widest mb-1.5 sm:mb-2">
                {slide.label || 'Timeless Ethnic Wear'}
              </p>

              {/* Main Title */}
              <h2
                className="font-bold text-white leading-tight mb-2 sm:mb-3 drop-shadow-lg"
                style={{ fontSize: 'clamp(1.4rem, 4.5vw, 3.5rem)' }}
              >
                {slide.title}
              </h2>

              {/* Subtitle */}
              <p
                className="text-gray-200 mb-3 sm:mb-6 leading-relaxed"
                style={{ fontSize: 'clamp(0.78rem, 1.5vw, 1rem)' }}
              >
                {slide.subtitle}
              </p>

              {/* CTA Button */}
              <button
                className="inline-flex items-center gap-1.5 bg-[#083028] hover:bg-[#051e19] border border-white/30 text-white font-semibold rounded-md transition-all duration-200 shadow-lg"
                style={{
                  padding: 'clamp(5px, 1vw, 12px) clamp(10px, 2vw, 28px)',
                  fontSize: 'clamp(0.6rem, 1.2vw, 0.875rem)',
                }}
              >
                {slide.buttonText}
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Bottom controls row: prev · dots · next */}
      <div className="absolute bottom-3 sm:bottom-5 left-0 right-0 z-20 flex items-center justify-center gap-3 px-4">
        {/* Prev Arrow */}
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="w-7 h-7 sm:w-9 sm:h-9 bg-white/25 hover:bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 shadow flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-white sm:hidden" />
          <ChevronLeft size={20} className="text-white hidden sm:block" />
        </button>

        {/* Dot Indicators */}
        <div className="flex items-center gap-1.5">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white w-5 sm:w-7 h-2'
                  : 'bg-white/40 hover:bg-white/70 w-2 h-2'
              }`}
            />
          ))}
        </div>

        {/* Next Arrow */}
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="w-7 h-7 sm:w-9 sm:h-9 bg-white/25 hover:bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 shadow flex-shrink-0"
        >
          <ChevronRight size={16} className="text-white sm:hidden" />
          <ChevronRight size={20} className="text-white hidden sm:block" />
        </button>
      </div>
    </section>
  );
}
