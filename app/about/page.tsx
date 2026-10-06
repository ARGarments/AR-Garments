'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Users2,
  Package,
  Layers,
  ArrowRight,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  Sparkles,
  TrendingUp,
  Store,
  Copy,
  Check,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { useToast } from '@/context/ToastContext';

export default function AboutPage() {
  const { toast } = useToast();
  const [copiedGst, setCopiedGst] = useState(false);

  const copyGstin = () => {
    navigator.clipboard.writeText('09IBIPK0663Q1ZV');
    setCopiedGst(true);
    toast.success('GSTIN copied to clipboard: 09IBIPK0663Q1ZV', { title: 'Copied' });
    setTimeout(() => setCopiedGst(false), 2500);
  };

  const offerings = [
    {
      title: 'Men’s Garments',
      badge: 'Wholesale Pricing',
      desc: 'High-demand men’s wear crafted for everyday comfort, festive wear, and modern retail stores.',
      icon: Users2,
    },
    {
      title: 'Women’s Garments',
      badge: 'Wholesale Pricing',
      desc: 'Vibrant ethnic, festive, and daily wear collections designed for fast turnaround and customer delight.',
      icon: Sparkles,
    },
    {
      title: 'Kids’ Garments',
      badge: 'Wholesale Pricing',
      desc: 'Comfortable, durable, and colorful children’s apparel at pocket-friendly wholesale rates.',
      icon: Package,
    },
    {
      title: 'Diverse Styles & Collections',
      badge: 'Curated Variety',
      desc: 'A continuously refreshed portfolio of garment styles, fabrics, cuts, and contemporary trends.',
      icon: Layers,
    },
    {
      title: 'Competitive Wholesale Rates',
      badge: 'Better Retail Margins',
      desc: 'Direct manufacturer & source pricing structured to give retail businesses strong profit margins.',
      icon: TrendingUp,
    },
    {
      title: 'Dedicated Bulk Support',
      badge: 'Priority Dispatch',
      desc: 'End-to-end bulk order handling, reliable parcel packing, and transparent business communication.',
      icon: Truck,
    },
  ];

  const clientTypes = [
    { name: 'Garment Retailers', desc: 'Brick-and-mortar clothing stores across city markets' },
    { name: 'Clothing Stores', desc: 'Multi-brand showrooms seeking fresh inventory' },
    { name: 'Resellers & Boutiques', desc: 'Online, home, and social media garment entrepreneurs' },
    { name: 'Local Businesses', desc: 'Regional stores looking for reliable local supply' },
    { name: 'Bulk Buyers', desc: 'Festive, corporate, and event garment requirements' },
    { name: 'Wholesale Sourcing Units', desc: 'Businesses demanding dependable repeat fulfillment' },
  ];

  const highlights = [
    {
      title: 'Wholesale Focus',
      description: 'We are 100% focused on serving commercial clients, resellers, and wholesale buyers with professional trade terms.',
    },
    {
      title: 'Men, Women & Kids',
      description: 'Complete family wardrobe sourcing under a single roof, reducing sourcing complexity and shipping costs.',
    },
    {
      title: 'Competitive Pricing',
      description: 'Carefully calculated wholesale pricing designed to help our client stores maximize their return on investment.',
    },
    {
      title: 'Reliable Service',
      description: 'We believe in honest dealing, clear commitments, accurate product representations, and long-term business partnerships.',
    },
    {
      title: 'Prayagraj Based',
      description: 'Strategically located in Prayagraj, Uttar Pradesh, with deep knowledge of North Indian fashion preferences and rapid dispatch logistics.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-gray-900 font-sans">
      <Header />

      {/* ─── HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#083028] text-white py-16 sm:py-24">
        {/* Decorative background grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10 max-w-4xl text-center">
          {/* Breadcrumbs */}
          <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-200/80 mb-6 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-xs">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={13} />
            <span className="text-white font-semibold">About AR Garment</span>
          </div>

          <span className="block text-xs sm:text-sm font-bold text-[#D4AF37] uppercase tracking-[0.25em] mb-3">
            Wholesale Garment Business • Prayagraj, Uttar Pradesh
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6 text-balance">
            Your Trusted Wholesale Garment Partner
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-emerald-100/90 leading-relaxed max-w-3xl mx-auto mb-8 text-balance">
            AR Garment is a Proprietorship wholesale garment enterprise based in Prayagraj, Uttar Pradesh. 
            We provide high-quality apparel for Men, Women, and Kids at competitive wholesale prices to 
            retailers, resellers, boutiques, and bulk buyers across India.
          </p>

          {/* Quick Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-semibold">
            <div className="bg-white/10 border border-white/20 px-3.5 py-2 rounded-xl flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#D4AF37]" />
              <span>GST Registered: 09IBIPK0663Q1ZV</span>
            </div>
            <div className="bg-white/10 border border-white/20 px-3.5 py-2 rounded-xl flex items-center gap-2">
              <Building2 size={16} className="text-[#D4AF37]" />
              <span>Proprietorship Business</span>
            </div>
            <div className="bg-white/10 border border-white/20 px-3.5 py-2 rounded-xl flex items-center gap-2">
              <Package size={16} className="text-[#D4AF37]" />
              <span>Bulk Order Specialists</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTRO & OVERVIEW STATS ────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAF8F3] border border-amber-900/10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#083028] block mb-1">Our Core Focus</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Wholesale Sourcing Made Simple</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                We make garment sourcing convenient, reliable, and cost-effective so you can focus on growing your retail sales.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF8F3] border border-amber-900/10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#083028] block mb-1">Family Wardrobe</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Men, Women &amp; Kids</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                One unified supplier for the complete family. Diverse garment styles, durable stitching, and fast-moving trends.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF8F3] border border-amber-900/10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#083028] block mb-1">Value &amp; Trust</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Long-Term Relationships</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Building lasting B2B partnerships founded on honest dealings, consistent quality, and transparent commercial terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHAT WE OFFER ─────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-[#083028] uppercase tracking-widest bg-[#083028]/10 px-3.5 py-1 rounded-full">
              Product Portfolio
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-3 tracking-tight">
              What We Offer
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Comprehensive garment collections engineered for retailers, wholesalers, and resellers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#083028]/5 text-[#083028] flex items-center justify-center group-hover:bg-[#083028] group-hover:text-white transition-colors duration-300">
                        <Icon size={24} />
                      </div>
                      <span className="text-[11px] font-bold text-[#083028] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#083028] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center text-xs font-bold text-[#083028]">
                    <span>Wholesale Supply Available</span>
                    <CheckCircle2 size={14} className="ml-1.5 text-emerald-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── OUR STORY, MISSION & VISION ────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Story */}
            <div className="p-8 rounded-3xl bg-[#FAF8F3] border border-gray-200/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#083028] text-white flex items-center justify-center mb-5 font-bold">
                  01
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3">Our Story</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                  AR Garment was established with the vision of serving businesses with dependable wholesale garment solutions.
                </p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Based in Prayagraj, we understand the day-to-day requirements of retailers and garment businesses. We work diligently to provide suitable products at competitive wholesale prices, believing that lasting success is built on fair pricing, honest dealing, and dependable service.
                </p>
              </div>
            </div>

            {/* Mission */}
            <div className="p-8 rounded-3xl bg-[#FAF8F3] border border-gray-200/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#083028] text-white flex items-center justify-center mb-5 font-bold">
                  02
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3">Our Mission</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                  Our mission is to provide businesses with quality garments at competitive wholesale prices, while delivering dependable service and creating long-term relationships with our customers.
                </p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  We bridge the gap between quality manufacturing and regional retailers, ensuring steady inventory flow and consistent customer satisfaction.
                </p>
              </div>
            </div>

            {/* Vision */}
            <div className="p-8 rounded-3xl bg-[#FAF8F3] border border-gray-200/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#083028] text-white flex items-center justify-center mb-5 font-bold">
                  03
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3">Our Vision</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                  Our vision is to establish AR Garment as a trusted name in wholesale garments, starting from Prayagraj and gradually expanding our business reach to more markets across India.
                </p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  We aspire to be the preferred wholesale garment destination recognized for reliability, fair trade, and customer-first support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHO WE SERVE ──────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#083028] uppercase tracking-widest bg-[#083028]/10 px-3.5 py-1 rounded-full">
              B2B Client Network
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-3 tracking-tight">
              Who We Serve
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Supplying garments to dynamic businesses and commercial buyers across diverse retail channels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {clientTypes.map((client, idx) => (
              <div
                key={idx}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs flex items-start gap-4 hover:border-[#083028]/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Store size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 mb-1">{client.name}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{client.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE AR GARMENT ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-[#083028] uppercase tracking-widest bg-[#083028]/10 px-3.5 py-1 rounded-full">
              The AR Garment Advantage
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-3 tracking-tight">
              Why Choose AR Garment?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Built on the pillars of wholesale focus, fair pricing, and long-term business integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="p-6 sm:p-7 rounded-2xl bg-[#FAF8F3] border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#083028]/10 text-[#083028] flex items-center justify-center mb-4 font-bold text-sm">
                    0{i + 1}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{h.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {h.description}
                  </p>
                </div>
              </div>
            ))}

            {/* 6th callout card */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[#083028] text-white flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block mb-2">
                  Direct Inquiries
                </span>
                <h3 className="text-lg font-bold text-white mb-2">Need a Custom Quote?</h3>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed mb-6">
                  Share your required product categories, order volume, and destination for prompt quotation.
                </p>
              </div>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c49f2b] text-[#083028] font-bold text-xs py-3 px-5 rounded-xl transition shadow-sm w-full"
              >
                <span>Request Wholesale Quotation</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── OFFICIAL COMPANY DETAILS / COMPLIANCE CARD ────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-[#083028] text-white px-6 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block mb-1">
                  Verified Legal Entity
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold">Company Details</h3>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <FileCheck2 size={16} className="text-[#D4AF37]" />
                <span>Govt. Tax Registered</span>
              </div>
            </div>

            {/* Details Content */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Business Name</p>
                  <p className="text-base font-extrabold text-gray-900">AR Garment</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Business Constitution</p>
                  <p className="text-base font-extrabold text-gray-900">Proprietorship</p>
                </div>

                {/* GSTIN Card */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-[#FAF8F3] border border-amber-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Goods and Services Tax (GSTIN)</p>
                    <p className="text-lg sm:text-xl font-mono font-extrabold text-[#083028] tracking-wider">
                      09IBIPK0663Q1ZV
                    </p>
                  </div>
                  <button
                    onClick={copyGstin}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition shadow-xs self-start sm:self-auto"
                  >
                    {copiedGst ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy GSTIN</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Place of business */}
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Principal Place of Business
                  </p>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-3">
                    <MapPin className="text-[#083028] mt-1 shrink-0" size={20} />
                    <div className="text-sm text-gray-700 leading-relaxed font-medium">
                      <p className="font-bold text-gray-900">Building No. / Flat No. 11A/14A</p>
                      <p>K.P. Kakkad Road, Eidgah</p>
                      <p>Prayagraj, Uttar Pradesh, India</p>
                      <p className="text-xs font-bold text-[#083028] mt-1">PIN Code – 211003</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION ────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-[#083028] text-white relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-[0.25em] block mb-3">
            Let&apos;s Do Business Together
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5">
            Looking for a Reliable Wholesale Garment Supplier?
          </h2>
          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto leading-relaxed mb-8">
            Whether you need garments for Men, Women, or Kids, AR Garment is here to support your retail business with steady bulk fulfillment, fair wholesale rates, and personalized support.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c49f2b] text-[#083028] font-bold text-sm px-8 py-4 rounded-xl transition shadow-lg"
            >
              <span>Contact For Wholesale Enquiries</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/category"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-8 py-4 rounded-xl border border-white/20 transition"
            >
              <span>Explore All Collections</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
