'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthCard from '@/components/AuthCard';

function LoginContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const initialMode = modeParam === 'register' ? 'register' : 'login';

  return <AuthCard initialMode={initialMode} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-cyan-400 font-mono text-xs">
        Loading Authentication...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
