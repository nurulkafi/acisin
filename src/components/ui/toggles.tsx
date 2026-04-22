'use client';

import { useTheme } from 'next-themes';
import { useLanguage } from '@/providers/language-provider';

// ─── Theme Toggle ────────────────────────────────────────────────────────────

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 backdrop-blur-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 ${className}`}
      aria-label="Toggle theme"
    >
      <span>{resolvedTheme === 'dark' ? '☀️' : '🌙'}</span>
      <span>{resolvedTheme === 'dark' ? t('lightMode') : t('darkMode')}</span>
    </button>
  );
}

// ─── Language Toggle ─────────────────────────────────────────────────────────

interface LangToggleProps {
  className?: string;
}

export function LangToggle({ className = '' }: LangToggleProps) {
  const { lang, setLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
      className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 backdrop-blur-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 ${className}`}
      aria-label="Toggle language"
    >
      <span>{lang === 'id' ? '🇮🇩' : '🇺🇸'}</span>
      <span>{lang === 'id' ? 'ID' : 'EN'}</span>
    </button>
  );
}
