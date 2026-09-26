'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAuth } from '@/lib/adminData';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!adminAuth.isLoggedIn()) {
      router.replace('/admin/login');
    }
  }, [router]);

  if (typeof window !== 'undefined' && !adminAuth.isLoggedIn()) {
    return null;
  }

  return <>{children}</>;
}
