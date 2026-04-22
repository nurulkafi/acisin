'use client';

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  requireSupabaseConfig,
  uploadAvatar,
  updateAuthProfileMetadata,
  getUserRoleFromAuthUser,
} from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "register";
type ThemeMode = "dark" | "light";

function fieldClassName() {
  return "h-11 w-full rounded-xl border border-zinc-300/70 bg-white/90 px-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-orange-300 dark:focus:ring-orange-300/20";
}

function tabClassName(isActive: boolean) {
  return `h-10 rounded-lg text-sm font-medium transition ${
    isActive
      ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
      : "text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
  }`;
}

export default function AuthPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<AuthMode>("login");
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const savedTheme = window.localStorage.getItem("theme-mode");
    return savedTheme === "light" ? "light" : "dark";
  });
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme-mode", theme);
  }, [theme]);

  async function onLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setErrorMessage("Email dan password wajib diisi.");
      return;
    }

    try {
      requireSupabaseConfig();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const user = data.user;
      if (!user) {
        throw new Error("User tidak ditemukan setelah login.");
      }

      const role = getUserRoleFromAuthUser(user);

      startTransition(() => {
        router.push(role === "admin" ? "/dashboard/admin" : "/dashboard/customer");
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal login. Coba lagi.";
      setErrorMessage(message);
    }
  }

  async function onRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("full_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const avatar = formData.get("avatar");
    const avatarFile = avatar instanceof File && avatar.size > 0 ? avatar : null;

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage("Nama, email, password, dan konfirmasi password wajib diisi.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi password tidak sama.");
      return;
    }

    try {
      requireSupabaseConfig();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            address,
            role: "customer",
            avatar_url: null,
          },
        },
      });

      if (error) {
        throw error;
      }

      const authUser = data.user;
      if (!authUser) {
        throw new Error("Registrasi gagal, data user tidak tersedia.");
      }

      let registerNote: string | null = null;
      let avatarUrl: string | null = null;
      if (avatarFile && data.session) {
        try {
          avatarUrl = await uploadAvatar(authUser.id, avatarFile);
        } catch (error) {
          const uploadError =
            error instanceof Error ? error.message : "Upload avatar gagal.";
          registerNote = `Akun dibuat, tetapi avatar belum terupload: ${uploadError}`;
        }
      }

      if (data.session) {
        await updateAuthProfileMetadata({
          fullName,
          phone,
          address,
          avatarUrl,
        });
      } else if (avatarFile) {
        registerNote =
          "Akun dibuat. Avatar akan diupload setelah email terverifikasi dan kamu login.";
      }

      setMessage(
        data.session
          ? `Registrasi berhasil. Kamu sudah login dan bisa langsung masuk dashboard.${
              registerNote ? ` ${registerNote}` : ""
            }`
          : `Registrasi berhasil. Cek email untuk verifikasi lalu login.${
              registerNote ? ` ${registerNote}` : ""
            }`
      );

      if (data.session) {
        const sessionRole = getUserRoleFromAuthUser(authUser);
        startTransition(() => {
          router.push(
            sessionRole === "admin" ? "/dashboard/admin" : "/dashboard/customer"
          );
        });
      } else {
        setMode("login");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal melakukan registrasi.";
      setErrorMessage(message);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.2),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(120,119,198,0.25),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#fff7ed_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.2),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.2),transparent_35%),linear-gradient(180deg,#09090b_0%,#111827_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-20" />

      <section className="relative mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <aside className="rounded-3xl border border-white/40 bg-white/55 p-7 shadow-xl backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-900/50">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500 dark:text-orange-300">
            Welcome
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Login dan register akun dalam tampilan baru yang lebih modern.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            Role default saat register tetap <strong>customer</strong>. Kamu bisa pindah
            antara mode login dan register tanpa reload halaman.
          </p>

          <div className="mt-7 grid gap-3 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200/70 bg-white/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/65">
              Validasi input tetap aktif
            </div>
            <div className="rounded-xl border border-zinc-200/70 bg-white/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/65">
              Upload avatar saat register
            </div>
            <div className="rounded-xl border border-zinc-200/70 bg-white/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/65 sm:col-span-2">
              Toggle tema tersedia dengan default dark mode
            </div>
          </div>
        </aside>

        <div className="rounded-3xl border border-zinc-200/70 bg-white/85 p-6 shadow-2xl backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/75 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {mode === "login" ? "Masuk ke akun" : "Buat akun baru"}
            </h2>
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-xl border border-zinc-200 bg-zinc-100/80 p-1 dark:border-zinc-700 dark:bg-zinc-900/80">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={tabClassName(mode === "login")}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={tabClassName(mode === "register")}
            >
              Register
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={onLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Email</label>
                <input name="email" type="email" className={fieldClassName()} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Password
                </label>
                <input name="password" type="password" className={fieldClassName()} />
              </div>
              <Button type="submit" disabled={isPending} className="h-11 w-full rounded-xl">
                {isPending ? "Memproses..." : "Login"}
              </Button>
            </form>
          ) : (
            <form onSubmit={onRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Nama Lengkap
                </label>
                <input name="full_name" type="text" className={fieldClassName()} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Email</label>
                <input name="email" type="email" className={fieldClassName()} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Password
                  </label>
                  <input name="password" type="password" className={fieldClassName()} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Konfirmasi Password
                  </label>
                  <input
                    name="confirm_password"
                    type="password"
                    className={fieldClassName()}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Nomor Telepon
                </label>
                <input name="phone" type="text" className={fieldClassName()} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Alamat</label>
                <textarea
                  name="address"
                  rows={3}
                  className={`${fieldClassName()} h-auto py-2.5`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Upload Foto Profile
                </label>
                <input
                  name="avatar"
                  type="file"
                  accept="image/*"
                  className="w-full rounded-xl border border-zinc-300/70 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200 dark:file:bg-zinc-200 dark:file:text-zinc-900"
                />
              </div>

              <Button type="submit" disabled={isPending} className="h-11 w-full rounded-xl">
                {isPending ? "Memproses..." : "Register"}
              </Button>
            </form>
          )}

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300">
              {errorMessage}
            </p>
          ) : null}
          {message ? (
            <p className="mt-4 rounded-xl border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
              {message}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
