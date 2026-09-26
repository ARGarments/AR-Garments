'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Phone, Mail, MapPin, Clock, MessageSquare,
  Send, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: '',
      });
    }, 800);
  };

  const contactCards = [
    {
      icon: <Phone className="text-[#083028]" size={22} />,
      title: 'Phone & WhatsApp',
      detail: '+91 98765 43210',
      sub: 'Mon - Sat: 10:00 AM - 8:00 PM IST',
      action: 'tel:+919876543210',
      actionLabel: 'Call Us Now',
    },
    {
      icon: <Mail className="text-[#083028]" size={22} />,
      title: 'Email Support',
      detail: 'support@argarments.com',
      sub: 'Response within 24 business hours',
      action: 'mailto:support@argarments.com',
      actionLabel: 'Send an Email',
    },
    {
      icon: <MapPin className="text-[#083028]" size={22} />,
      title: 'Store & Head Office',
      detail: 'AR Garments, Ring Road Textile Market',
      sub: 'Surat, Gujarat - 395002, India',
      action: '#map',
      actionLabel: 'View on Map',
    },
    {
      icon: <Clock className="text-[#083028]" size={22} />,
      title: 'Working Hours',
      detail: 'Monday - Saturday',
      sub: '10:00 AM – 8:00 PM (Closed on Sundays)',
      actionLabel: 'Open for Visits',
    },
  ];

  const faqs = [
    {
      q: 'How long does shipping take?',
      a: 'We dispatch all orders within 24 to 48 hours. Express PAN-India delivery takes 3 to 5 business days.'
    },
    {
      q: 'What is your return & exchange policy?',
      a: 'We offer an easy 7-day hassle-free return and exchange policy from the date of delivery. Reverse pickup is arranged from your doorstep.'
    },
    {
      q: 'Is Cash on Delivery (COD) available?',
      a: 'Yes, Cash on Delivery is available across most serviceable pincodes in India with no extra hidden charges.'
    },
    {
      q: 'Do you accept bulk, wholesale, or bridal orders?',
      a: 'Yes! We cater to customized bridal trousseau and wholesale requirements. Mention "Wholesale" in your subject for priority assistance.'
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Header />

      {/* HERO BANNER */}
      <section className="bg-[#083028] py-14 sm:py-20 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 text-center max-w-2xl relative z-10">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-300 mb-3">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-white font-semibold">Contact Us</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#E5D7B7] uppercase tracking-[0.2em] mb-2">
            We Are Here To Assist You
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Get in Touch
          </h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            Have questions about saree fabrics, your recent order, or bridal custom inquiries?
            Our friendly customer support team is always delighted to assist.
          </p>
        </div>
      </section>

      {/* CONTACT INFO CARDS */}
      <section className="py-12 -mt-8 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {contactCards.map((c, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#F5F1E8] flex items-center justify-center mb-4">
                    {c.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{c.title}</h3>
                  <p className="font-semibold text-gray-800 text-sm leading-snug">{c.detail}</p>
                  <p className="text-xs text-gray-500 mt-1">{c.sub}</p>
                </div>
                {c.action && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <a
                      href={c.action}
                      className="text-xs font-bold text-[#083028] hover:underline inline-flex items-center gap-1"
                    >
                      {c.actionLabel} →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM & FAQ GRID */}
      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* CONTACT FORM */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-gray-200/80 shadow-sm">
              <div className="mb-6">
                <span className="text-xs font-bold text-[#083028] uppercase tracking-wider bg-[#083028]/10 px-3 py-1 rounded-full">
                  Direct Message
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  Send Us A Message
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Fill in your details and we will get back to you shortly.
                </p>
              </div>

              {submitted && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Thank you! Your message has been sent.</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Our customer care representative will contact you via email or phone within 24 hours.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                      Your Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="e.g. priya@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 00000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#083028]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                      Inquiry Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#083028]"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Order Tracking">Order Tracking &amp; Status</option>
                      <option value="Returns / Exchange">Returns &amp; Exchange</option>
                      <option value="Bridal / Custom Order">Bridal / Custom Order</option>
                      <option value="Wholesale Inquiry">Wholesale / Bulk Order</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us what you are looking for or describe your order issue..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#083028] leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#083028] hover:bg-[#051e19] text-white py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Send size={16} />
                  {loading ? 'Sending Message...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="text-[#083028]" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">Quick Assistance FAQs</h3>
                </div>

                <div className="space-y-4">
                  {faqs.map((faq, i) => (
                    <div key={i} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <p className="font-bold text-gray-900 text-xs sm:text-sm mb-1">{faq.q}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Showroom location card */}
              <div id="map" className="bg-[#083028] text-white p-6 sm:p-8 rounded-3xl shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <MapPin className="text-[#E5D7B7]" size={20} />
                  <h4 className="font-bold text-base">Visit Our Flagship Store</h4>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  Experience the drape, texture, and brilliance of our pure handlooms in person at our flagship Surat boutique.
                </p>
                <div className="bg-white/10 rounded-2xl p-4 text-xs space-y-1 text-gray-200">
                  <p className="font-bold text-white">AR Garments Surat Hub</p>
                  <p>Shop #42-45, Ring Road Textile Market</p>
                  <p>Surat, Gujarat - 395002</p>
                  <p className="pt-2 text-[#E5D7B7] font-semibold">📞 WhatsApp: +91 98765 43210</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
