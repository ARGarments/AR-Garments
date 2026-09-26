import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#083028] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Logo & Tagline */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-[#083028] font-bold text-sm">AR</span>
              </div>
              <div>
                <h3 className="font-bold text-white leading-tight">AR Garment</h3>
                <p className="text-xs text-white/50 leading-tight">Ethnic Wear for Every You</p>
              </div>
            </Link>
            <p className="text-white/60 text-sm mb-4 max-w-sm">
              Tradition In Every Thread. Your trusted destination for handpicked, authentic Indian ethnic wear.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white uppercase tracking-wide">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors text-sm">Home</Link></li>
              <li><Link href="/category" className="text-white/60 hover:text-white transition-colors text-sm">All Collections</Link></li>
              <li><Link href="/about" className="text-white/60 hover:text-white transition-colors text-sm">About Us</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-white transition-colors text-sm">Contact Us</Link></li>
            </ul>
          </div>

          {/* Our Categories */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white uppercase tracking-wide">Our Categories</h4>
            <ul className="space-y-2">
              <li><Link href="/category?category=Sarees" className="text-white/60 hover:text-white transition-colors text-sm">Sarees</Link></li>
              <li><Link href="/category?category=Suits+%26+Dress+Material" className="text-white/60 hover:text-white transition-colors text-sm">Suits &amp; Dress Material</Link></li>
              <li><Link href="/category?category=Dupatta+Sets" className="text-white/60 hover:text-white transition-colors text-sm">Dupatta Sets</Link></li>
              <li><Link href="/category?category=Men+Fashion" className="text-white/60 hover:text-white transition-colors text-sm">Men Fashion</Link></li>
              <li><Link href="/category?category=Kids+Fashion" className="text-white/60 hover:text-white transition-colors text-sm">Kids Fashion</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white uppercase tracking-wide">Customer Support</h4>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-white/60 hover:text-white transition-colors text-sm">Help &amp; Support</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-white transition-colors text-sm">Shipping Policy</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-white transition-colors text-sm">Return &amp; Refund</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-white transition-colors text-sm">Track Order</Link></li>
            </ul>
          </div>

          {/* Follow Us & Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white uppercase tracking-wide">Follow Us</h4>
            <div className="flex gap-2 mb-6">
              <a href="#" className="w-8 h-8 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors text-xs font-bold">f</a>
              <a href="#" className="w-8 h-8 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors text-xs">in</a>
              <a href="#" className="w-8 h-8 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors text-xs">▶</a>
              <a href="#" className="w-8 h-8 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors text-xs font-bold">P</a>
            </div>

            <h4 className="text-sm font-semibold mb-3 text-white uppercase tracking-wide">Get In Touch</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <Phone size={13} className="text-white/80 flex-shrink-0" />
                +91 98765 43210
              </li>
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <Mail size={13} className="text-white/80 flex-shrink-0" />
                support@argarments.com
              </li>
              <li className="flex items-start gap-2 text-white/60 text-sm">
                <MapPin size={13} className="text-white/80 mt-0.5 flex-shrink-0" />
                <span>Textile Market, Surat, Gujarat India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-[#051e19] py-3">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/40">
            <p>© {new Date().getFullYear()} AR Garment. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link href="/category" className="hover:text-white transition-colors">Shop</Link>
            </div>
            <div className="flex gap-3 items-center">
              <span>We Accept:</span>
              <span>Visa</span>
              <span>UPI</span>
              <span>COD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
