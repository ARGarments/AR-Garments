'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
      <div className="w-8 h-8 border-4 border-[#083028] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
