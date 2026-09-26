'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { HeroSlide, defaultHeroSlides } from '@/lib/adminData';

export default function Hero() {
  const [slides, setSlides] = useState<HeroSlide[]>(defaultHeroSlides);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Fetch live slides from Supabase via API
    fetch('/api/hero-slides')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || data.length === 0) return;
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
        if (active.length > 0) setSlides(active);
      })
      .catch(() => {
        // silently fall back to defaults
      });
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
    <section className="relative overflow-hidden bg-[#083028]"
      style={{ height: 'clamp(420px, 80vw, 700px)' }}
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
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className="w-full px-5 sm:px-8 md:px-14 lg:px-20">
              <div className="max-w-xs sm:max-w-sm md:max-w-xl lg:max-w-2xl">

                {/* Label */}
                <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-white/70 uppercase tracking-[0.2em] mb-2 sm:mb-3">
                  {slide.label || 'Timeless Ethnic Wear'}
                </p>

                {/* Main Title */}
                <h2
                  className="font-bold text-white leading-tight mb-3 sm:mb-4 drop-shadow-lg whitespace-pre-line"
                  style={{ fontSize: 'clamp(1.75rem, 5vw, 3.75rem)' }}
                >
                  {slide.title}
                </h2>

                {/* Subtitle */}
                <p
                  className="text-gray-200 mb-5 sm:mb-8 leading-relaxed"
                  style={{ fontSize: 'clamp(0.75rem, 1.8vw, 1rem)' }}
                >
                  {slide.subtitle}
                </p>

                {/* CTA Button */}
                <button className="inline-flex items-center gap-2 bg-[#083028] hover:bg-[#051e19] border border-white/30 text-white font-semibold rounded-md transition-all duration-200 shadow-lg"
                  style={{ padding: 'clamp(8px, 1.5vw, 14px) clamp(20px, 3vw, 36px)', fontSize: 'clamp(0.75rem, 1.4vw, 0.9rem)' }}
                >
                  {slide.buttonText}
                  <span className="text-base">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Left Arrow */}
      <button
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20
          w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12
          bg-white/20 hover:bg-white/40 backdrop-blur-sm
          rounded-full flex items-center justify-center transition-all duration-200 shadow"
      >
        <ChevronLeft size={20} className="text-white sm:hidden" />
        <ChevronLeft size={24} className="text-white hidden sm:block md:hidden" />
        <ChevronLeft size={28} className="text-white hidden md:block" />
      </button>

      {/* Right Arrow */}
      <button
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20
          w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12
          bg-white/20 hover:bg-white/40 backdrop-blur-sm
          rounded-full flex items-center justify-center transition-all duration-200 shadow"
      >
        <ChevronRight size={20} className="text-white sm:hidden" />
        <ChevronRight size={24} className="text-white hidden sm:block md:hidden" />
        <ChevronRight size={28} className="text-white hidden md:block" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
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
    </section>
  );
}
