'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { getCurrentSessionUser, getUserRoleFromAuthUser } from '@/lib/auth-client';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/providers/language-provider';
import { ThemeToggle, LangToggle } from '@/components/ui/toggles';

// ─── Nav item definition ─────────────────────────────────────────────────────

interface NavItem {
  icon: string;
  labelKey: 'dashboard';
  href: string;
}

const adminNav: NavItem[] = [
  { icon: '📊', labelKey: 'dashboard', href: '/dashboard/admin' },
];

const customerNav: NavItem[] = [
  { icon: '📊', labelKey: 'dashboard', href: '/dashboard/customer' },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({
  role,
  name,
}: {
  role: 'admin' | 'customer';
  name: string;
}) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const nav = role === 'admin' ? adminNav : customerNav;

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-white/8 bg-zinc-950/90 backdrop-blur-md dark:bg-zinc-950/90">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-white/8 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
          <span className="text-base">💹</span>
        </div>
        <span className="text-sm font-bold tracking-tight text-white">ACIS Finance</span>
      </div>

      {/* User badge */}
      <div className="mx-3 mt-4 flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/5 px-3 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-400">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">{name}</p>
          <p className="text-[10px] text-zinc-500">
            {role === 'admin' ? t('adminRole') : t('customerRole')}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-5 flex-1 px-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          {t('mainMenu')}
        </p>
        <ul className="space-y-1">
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'text-zinc-400 hover:bg-white/6 hover:text-zinc-100'
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{t(item.labelKey)}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({
  role,
  onLogout,
  isPending,
}: {
  role: 'admin' | 'customer';
  onLogout: () => void;
  isPending: boolean;
}) {
  const { t } = useLanguage();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/8 bg-zinc-950/80 px-5 backdrop-blur-md dark:bg-zinc-950/80">
      <div className="text-sm text-zinc-400">
        {t('welcomeBack')},{' '}
        <span className="font-medium text-white">
          {role === 'admin' ? t('adminRole') : t('customerRole')}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <LangToggle />
        <ThemeToggle />
        <button
          type="button"
          onClick={onLogout}
          disabled={isPending}
          className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
        >
          {isPending ? '...' : t('logout')}
        </button>
      </div>
    </header>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'customer'>('customer');
  const [isPending, startTransition] = useTransition();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const user = await getCurrentSessionUser();
        if (!user) { router.replace('/auth'); return; }
        if (!isMounted) return;
        const r = getUserRoleFromAuthUser(user) as 'admin' | 'customer';
        setRole(r);
        setName(user.user_metadata?.full_name ?? user.email ?? r);
        setReady(true);
      } catch {
        router.replace('/auth');
      }
    }
    void load();
    return () => { isMounted = false; };
  }, [router]);

  async function onLogout() {
    await supabase.auth.signOut();
    startTransition(() => { router.push('/auth'); });
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
      <Sidebar role={role} name={name} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header role={role} onLogout={onLogout} isPending={isPending} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
