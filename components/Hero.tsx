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

  const activeSlides = slides.filter((s) => s.active);

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
    <section className="relative overflow-hidden bg-[#083028] h-[300px] sm:h-[380px] md:h-[460px] lg:h-[540px]">
      {activeSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Background Image: anchored to top so head/hair is never cut, and right-aligned so model is visible */}
          <div className="absolute inset-0">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover object-[85%_top] sm:object-[85%_top] md:object-[right_top]"
              priority={index === 0}
              sizes="100vw"
            />
            {/* Left-side subtle gradient only for text readability — leaves model bright & clear */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent w-[65%] sm:w-full" />
          </div>

          {/* Text Content */}
          <div className="relative h-full flex items-center">
            <div className="w-[54%] sm:w-[48%] md:w-[42%] lg:w-[38%] pl-4 sm:pl-8 md:pl-14 lg:pl-20 pr-2 pb-6 sm:pb-0">
              {/* Category / Collection Label */}
              <p className="text-[9px] sm:text-xs md:text-sm font-semibold text-white/90 uppercase tracking-widest mb-1 sm:mb-1.5">
                {slide.label || 'Timeless Ethnic Wear'}
              </p>

              {/* Main Title */}
              <h2 className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-1 sm:mb-2.5 drop-shadow-md">
                {slide.title}
              </h2>

              {/* Subtitle */}
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-200 mb-2.5 sm:mb-4 leading-snug sm:leading-relaxed line-clamp-2 max-w-sm">
                {slide.subtitle}
              </p>

              {/* CTA Button */}
              <div>
                <a
                  href={slide.buttonLink || '/category'}
                  className="inline-flex items-center gap-1.5 bg-[#083028] hover:bg-[#051e19] border border-white/40 text-white font-semibold rounded-lg px-3 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 shadow-md whitespace-nowrap"
                >
                  <span>{slide.buttonText || 'Shop Now'}</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Bottom controls: prev · dots · next */}
      <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-2 sm:gap-2.5">
        {/* Prev Arrow */}
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="w-6 h-6 sm:w-8 sm:h-8 bg-black/35 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow flex-shrink-0 cursor-pointer backdrop-blur-xs"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Dot Indicators */}
        <div className="flex items-center gap-1.5">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                index === currentSlide
                  ? 'bg-white w-5 sm:w-7 h-1.5 sm:h-2'
                  : 'bg-white/40 hover:bg-white/70 w-1.5 sm:w-2 h-1.5 sm:h-2'
              }`}
            />
          ))}
        </div>

        {/* Next Arrow */}
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="w-6 h-6 sm:w-8 sm:h-8 bg-black/35 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow flex-shrink-0 cursor-pointer backdrop-blur-xs"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </section>
  );
}
