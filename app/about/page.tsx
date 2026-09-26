'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles, Award, Heart, Users, Truck, ShieldCheck,
  ChevronRight, ArrowRight, CheckCircle2
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const stats = [
    { number: '10,000+', label: 'Delighted Customers', sub: 'Across India & Abroad' },
    { number: '500+', label: 'Handpicked Designs', sub: 'Updated every festive season' },
    { number: '25+', label: 'Artisan Clusters', sub: 'Weavers & traditional craftspeople' },
    { number: '100%', label: 'Authentic Quality', sub: 'Strict 3-step quality checks' },
  ];

  const values = [
    {
      icon: <Sparkles className="text-[#083028]" size={28} />,
      title: 'Timeless Craftsmanship',
      desc: 'Every saree, suit set, and dupatta in our collection reflects centuries-old Indian weaving traditions, delicate zari work, and artisanal heritage.'
    },
    {
      icon: <Award className="text-[#083028]" size={28} />,
      title: 'Affordable Luxury',
      desc: 'We cut out middlemen to bring you pure silk blends, chanderi, fine cotton, and bridal collections at transparent, honest prices.'
    },
    {
      icon: <Heart className="text-[#083028]" size={28} />,
      title: 'Made with Passion',
      desc: 'From design selection to hand-packaging, each order is handled with utmost warmth and dedication to celebrate every special occasion.'
    },
    {
      icon: <Users className="text-[#083028]" size={28} />,
      title: 'Empowering Weavers',
      desc: 'We directly support rural weavers and textile artisans, ensuring fair wages and preserving invaluable Indian textile legacy.'
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Header />

      {/* HERO BANNER */}
      <section className="relative overflow-hidden bg-[#083028] py-16 sm:py-24 text-white">
        <div className="absolute inset-0">
          <Image
            src="/home-images/hero-image1.jpg"
            alt="About AR Garments"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#083028] via-[#083028]/95 to-[#083028]/80" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center max-w-3xl">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-300 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-white font-semibold">About Us</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#E5D7B7] uppercase tracking-[0.25em] mb-3">
            Our Heritage &amp; Journey
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Weaving Tradition In Every Thread
          </h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl mx-auto">
            AR Garments is dedicated to celebrating the timeless beauty of Indian ethnic wear.
            From royal Banarasi weaves to breathable daily cottons, we bring you elegance tailored for life’s grandest moments.
          </p>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#FAF8F3] border border-gray-100">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#083028] mb-1">{s.number}</p>
                <p className="text-sm font-bold text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Story Text */}
            <div className="space-y-6">
              <span className="text-xs font-bold text-[#083028] uppercase tracking-widest bg-[#083028]/10 px-3 py-1 rounded-full">
                The AR Garments Story
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Born From A Love For India&apos;s Rich Textile Traditions
              </h2>
              <div className="text-sm sm:text-base text-gray-600 space-y-4 leading-relaxed">
                <p>
                  Founded with a vision to make authentic, premium Indian ethnic wear accessible to all,
                  AR Garments began its journey in the heart of India&apos;s textile capital. What started
                  as a passion for handpicked sarees has blossomed into a curated boutique offering Sarees,
                  Suit sets, Dupatta collections, and celebratory festive wear.
                </p>
                <p>
                  We believe that ethnic attire is not just clothing; it is a canvas of cultural memory,
                  family celebrations, festive memories, and timeless elegance passed down through generations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Handpicked pure & blend fabrics',
                  'Intricate zari and embroidery work',
                  'Rigorous 3-step quality testing',
                  'PAN-India rapid doorstep delivery',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-800">
                    <CheckCircle2 size={16} className="text-[#083028] flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  href="/category"
                  className="inline-flex items-center gap-2 bg-[#083028] hover:bg-[#051e19] text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all"
                >
                  Explore Collections <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Story Visual Grid */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-4/5 border border-gray-200">
                <Image
                  src="/home-images/hero-image2.jpg"
                  alt="Traditional Saree Craftsmanship"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl border border-gray-100 hidden sm:flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#083028] text-white flex items-center justify-center font-bold text-xl">
                  AR
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Authentic Guarantee</p>
                  <p className="text-xs text-gray-500">100% Genuine Handcrafted Pieces</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="py-16 sm:py-20 bg-[#F5F1E8]">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-[#083028] uppercase tracking-widest">
              What Guides Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-3">
              Our Core Values
            </h2>
            <p className="text-sm text-gray-600">
              We stand by uncompromising quality, honest ethics, and heartfelt customer care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-[#F5F1E8] flex items-center justify-center mb-5">
                    {v.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-2">{v.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMISE BANNER */}
      <section className="py-14 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="bg-[#083028] rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-2">
                Experience Handcrafted Elegance Today
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Discover our newest bridal, festive, and everyday collections designed to make every occasion memorable.
              </p>
            </div>
            <Link
              href="/category"
              className="bg-white text-[#083028] hover:bg-gray-100 font-bold px-8 py-3.5 rounded-xl text-sm transition-colors flex-shrink-0 shadow-md"
            >
              Shop All Products →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
