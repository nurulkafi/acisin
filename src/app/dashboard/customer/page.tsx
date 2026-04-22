'use client';

import { useLanguage } from '@/providers/language-provider';

export default function CustomerDashboardPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-full flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/3 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
        <span className="text-3xl">📊</span>
      </div>
      <h2 className="text-xl font-semibold text-white">{t('dashboard')}</h2>
      <p className="mt-2 text-sm text-zinc-500">Konten sedang dalam pengembangan.</p>
    </div>
  );
}
