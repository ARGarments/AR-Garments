'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MotionEnhancer() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach((section) => section.setAttribute('data-reveal', 'visible'));
      return;
    }

    sections.forEach((section) => section.setAttribute('data-reveal', 'pending'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.setAttribute('data-reveal', 'visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
