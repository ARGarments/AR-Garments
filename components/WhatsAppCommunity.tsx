'use client';

import Image from 'next/image';

interface WhatsAppCommunityProps {
  channelUrl?: string;
}

export default function WhatsAppCommunity({ channelUrl }: WhatsAppCommunityProps) {
  const whatsappUrl =
    channelUrl ||
    process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ||
    process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL ||
    'https://wa.me/919876543210?text=Hello%20AR%20Garments,%20I%20would%20like%20to%20join%20your%20WhatsApp%20Channel%20and%20Community.';

  return (
    <section data-reveal className="content-auto-section py-6 bg-white">
      <div className="container mx-auto px-4">
        {/* Compact banner card matching homepage theme */}
        <div className="premium-card relative overflow-hidden rounded-2xl bg-[#083028] shadow-md">
          {/* Vector SVG Botanical Background */}
          <div className="absolute inset-0 pointer-events-none">
            <Image
              src="/home-images/newsletter-pattern.svg"
              alt="Botanical Background"
              fill
              className="object-cover object-center opacity-90"
              priority
            />
          </div>

          {/* Content */}
          <div className="relative z-10 px-5 sm:px-10 py-7 sm:py-9">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
              {/* Text Area */}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Official WhatsApp Community
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight mb-1">
                  Join Our WhatsApp Channel or Community
                </h2>
                <p className="text-white/80 text-xs sm:text-sm">
                  Get instant daily wholesale stock alerts, new arrivals &amp; exclusive factory lot deals directly on WhatsApp.
                </p>
              </div>

              {/* Action Button */}
              <div className="w-full sm:w-auto flex justify-center sm:justify-end flex-shrink-0">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg
                    className="w-5 h-5 fill-current flex-shrink-0"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>Join Our WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
