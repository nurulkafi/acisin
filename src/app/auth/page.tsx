'use client';

import { FormEvent, useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  requireSupabaseConfig,
  uploadAvatar,
  updateAuthProfileMetadata,
  getUserRoleFromAuthUser,
} from '@/lib/auth-client';
import { supabase } from '@/lib/supabase';
import { useLanguage, type TranslationKey } from '@/providers/language-provider';
import { ThemeToggle, LangToggle } from '@/components/ui/toggles';

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthMode = 'login' | 'register';

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

function buildLoginSchema(t: (k: TranslationKey) => string) {
  return z.object({
    email: z
      .string()
      .min(1, t('emailRequired'))
      .email(t('emailInvalid')),
    password: z
      .string()
      .min(1, t('passwordRequired'))
      .min(8, t('passwordMin')),
  });
}

function buildRegisterSchema(t: (k: TranslationKey) => string) {
  return z
    .object({
      full_name: z.string().min(1, t('fullNameRequired')),
      email: z.string().min(1, t('emailRequired')).email(t('emailInvalid')),
      password: z.string().min(1, t('passwordRequired')).min(8, t('passwordMin')),
      confirm_password: z.string().min(1, t('confirmPasswordRequired')),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .refine((d) => d.password === d.confirm_password, {
      message: t('passwordMismatch'),
      path: ['confirm_password'],
    });
}

type LoginInput = z.infer<ReturnType<typeof buildLoginSchema>>;
type RegisterInput = z.infer<ReturnType<typeof buildRegisterSchema>>;

// ─── Field Error ─────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-400 dark:text-red-400">{message}</p>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `h-11 w-full rounded-xl border ${
    hasError
      ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20'
      : 'border-white/10 focus:border-amber-400 focus:ring-amber-400/20 dark:border-zinc-700/70 dark:focus:border-amber-400'
  } bg-white/5 px-3 text-sm text-white placeholder:text-zinc-500 shadow-sm outline-none transition focus:ring-4 dark:bg-zinc-900/60`;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<AuthMode>('login');
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Login form ──────────────────────────────────────────────────────────
  const loginSchema = buildLoginSchema(t);
  const {
    register: loginReg,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLogin,
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  // ── Register form ───────────────────────────────────────────────────────
  const registerSchema = buildRegisterSchema(t);
  const {
    register: regReg,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: regErrors },
    reset: resetRegister,
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  function switchMode(next: AuthMode) {
    setMode(next);
    setServerError(null);
    setSuccessMsg(null);
    resetLogin();
    resetRegister();
  }

  // ── Login submit ────────────────────────────────────────────────────────
  async function onLoginSubmit(data: LoginInput) {
    setServerError(null);
    try {
      requireSupabaseConfig();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      const user = authData.user;
      if (!user) throw new Error('User tidak ditemukan setelah login.');
      const role = getUserRoleFromAuthUser(user);
      startTransition(() => {
        router.push(role === 'admin' ? '/dashboard/admin' : '/dashboard/customer');
      });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal login. Coba lagi.');
    }
  }

  // ── Register submit ─────────────────────────────────────────────────────
  async function onRegisterSubmit(
    data: RegisterInput,
    event?: React.BaseSyntheticEvent
  ) {
    setServerError(null);
    const avatarFile =
      event?.target instanceof HTMLFormElement
        ? (() => {
            const f = new FormData(event.target as HTMLFormElement).get('avatar');
            return f instanceof File && f.size > 0 ? f : null;
          })()
        : null;

    try {
      requireSupabaseConfig();
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone ?? '',
            address: data.address ?? '',
            role: 'customer',
            avatar_url: null,
          },
        },
      });
      if (error) throw error;
      const authUser = authData.user;
      if (!authUser) throw new Error('Registrasi gagal, data user tidak tersedia.');

      let registerNote: string | null = null;
      let avatarUrl: string | null = null;

      if (avatarFile && authData.session) {
        try {
          avatarUrl = await uploadAvatar(authUser.id, avatarFile);
        } catch (err) {
          const uploadError = err instanceof Error ? err.message : 'Upload avatar gagal.';
          registerNote = `Akun dibuat, tetapi avatar belum terupload: ${uploadError}`;
        }
      }

      if (authData.session) {
        await updateAuthProfileMetadata({
          fullName: data.full_name,
          phone: data.phone ?? '',
          address: data.address ?? '',
          avatarUrl,
        });
      }

      setSuccessMsg(
        authData.session
          ? `Registrasi berhasil. Masuk ke dashboard...${registerNote ? ` ${registerNote}` : ''}`
          : `Registrasi berhasil. Cek email untuk verifikasi.${registerNote ? ` ${registerNote}` : ''}`
      );

      if (authData.session) {
        const role = getUserRoleFromAuthUser(authUser);
        startTransition(() => {
          router.push(role === 'admin' ? '/dashboard/admin' : '/dashboard/customer');
        });
      } else {
        switchMode('login');
      }
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Gagal melakukan registrasi.'
      );
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -right-32 top-1/4 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-500/8 blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Top-right toggles */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <LangToggle />
        <ThemeToggle />
      </div>

      {/* Center card */}
      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl">
          {/* Hero text */}
          <div className="mb-8 text-center">
            <span className="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
              ACIS Platform
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {mode === 'login' ? t('loginTitle') : t('registerTitle')}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {mode === 'login' ? t('loginSubtitle') : t('registerSubtitle')}
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            {/* Left panel — features */}
            <aside className="hidden rounded-2xl border border-white/8 bg-white/5 p-6 backdrop-blur-sm lg:block">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                  <span className="text-base">💹</span>
                </div>
                <span className="font-semibold text-white">ACIS Finance</span>
              </div>

              <ul className="space-y-4">
                {(
                  [
                    { icon: '📊', key: 'feature1' as const },
                    { icon: '🔐', key: 'feature2' as const },
                    { icon: '📑', key: 'feature3' as const },
                  ] as const
                ).map(({ icon, key }) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-sm">
                      {icon}
                    </span>
                    <span className="text-sm leading-snug text-zinc-300">
                      {t(key)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                {[
                  { val: '98%', label: 'Uptime' },
                  { val: '256-bit', label: 'Enkripsi' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/8 bg-zinc-900/60 p-3 text-center"
                  >
                    <p className="text-lg font-bold text-amber-400">{s.val}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </aside>

            {/* Right panel — form */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-sm sm:p-7">
              {/* Mode tabs */}
              <div className="mb-6 grid grid-cols-2 rounded-xl border border-zinc-700/60 bg-zinc-800/60 p-1">
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={`h-9 rounded-lg text-sm font-medium transition ${
                      mode === m
                        ? 'bg-amber-500 text-zinc-900 shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {m === 'login' ? t('login') : t('register')}
                  </button>
                ))}
              </div>

              {/* LOGIN FORM */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4" noValidate>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      {t('email')}
                    </label>
                    <input
                      {...loginReg('email')}
                      type="email"
                      placeholder="nama@email.com"
                      className={inputCls(!!loginErrors.email)}
                    />
                    <FieldError message={loginErrors.email?.message} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      {t('password')}
                    </label>
                    <input
                      {...loginReg('password')}
                      type="password"
                      placeholder="••••••••"
                      className={inputCls(!!loginErrors.password)}
                    />
                    <FieldError message={loginErrors.password?.message} />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="mt-2 h-11 w-full rounded-xl bg-amber-500 font-semibold text-zinc-900 transition hover:bg-amber-400 disabled:opacity-60"
                  >
                    {isPending ? t('processing') : t('login')}
                  </button>
                </form>
              )}

              {/* REGISTER FORM */}
              {mode === 'register' && (
                <form
                  onSubmit={handleRegisterSubmit((data, event) =>
                    onRegisterSubmit(data, event as React.BaseSyntheticEvent)
                  )}
                  className="space-y-3"
                  noValidate
                >
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      {t('fullName')}
                    </label>
                    <input
                      {...regReg('full_name')}
                      type="text"
                      placeholder="Nama Lengkap"
                      className={inputCls(!!regErrors.full_name)}
                    />
                    <FieldError message={regErrors.full_name?.message} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      {t('email')}
                    </label>
                    <input
                      {...regReg('email')}
                      type="email"
                      placeholder="nama@email.com"
                      className={inputCls(!!regErrors.email)}
                    />
                    <FieldError message={regErrors.email?.message} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                        {t('password')}
                      </label>
                      <input
                        {...regReg('password')}
                        type="password"
                        placeholder="••••••••"
                        className={inputCls(!!regErrors.password)}
                      />
                      <FieldError message={regErrors.password?.message} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                        {t('confirmPassword')}
                      </label>
                      <input
                        {...regReg('confirm_password')}
                        type="password"
                        placeholder="••••••••"
                        className={inputCls(!!regErrors.confirm_password)}
                      />
                      <FieldError message={regErrors.confirm_password?.message} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      {t('phone')}
                    </label>
                    <input
                      {...regReg('phone')}
                      type="text"
                      placeholder="08xx-xxxx-xxxx"
                      className={inputCls(false)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      {t('address')}
                    </label>
                    <textarea
                      {...regReg('address')}
                      rows={2}
                      placeholder="Jl. ..."
                      className={`${inputCls(false)} h-auto py-2.5`}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      {t('uploadAvatar')}
                    </label>
                    <input
                      name="avatar"
                      type="file"
                      accept="image/*"
                      className="w-full rounded-xl border border-zinc-700/70 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-amber-500 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-zinc-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="mt-1 h-11 w-full rounded-xl bg-amber-500 font-semibold text-zinc-900 transition hover:bg-amber-400 disabled:opacity-60"
                  >
                    {isPending ? t('processing') : t('register')}
                  </button>
                </form>
              )}

              {/* Feedback messages */}
              {serverError && (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                  {serverError}
                </p>
              )}
              {successMsg && (
                <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400">
                  {successMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
