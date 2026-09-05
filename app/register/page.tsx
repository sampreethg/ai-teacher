'use client';

import React, { Suspense } from 'react';
import AuthCard from '@/components/AuthCard';

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-cyan-400 font-mono text-xs">
        Loading Registration...
      </div>
    }>
      <AuthCard initialMode="register" />
    </Suspense>
  );
}
