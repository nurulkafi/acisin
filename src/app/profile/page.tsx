'use client';

import Link from "next/link";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  getAuthProfileFromUser,
  getCurrentSessionUser,
  updateAuthProfileMetadata,
  uploadAvatar,
} from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";

type ProfileFormState = {
  fullName: string;
  phone: string;
  address: string;
  avatarUrl: string | null;
  role: string;
  email: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<ProfileFormState>({
    fullName: "",
    phone: "",
    address: "",
    avatarUrl: null,
    role: "customer",
    email: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const user = await getCurrentSessionUser();
        if (!user) {
          router.replace("/auth");
          return;
        }

        const data = getAuthProfileFromUser(user);
        if (!isMounted) {
          return;
        }

        setUserId(user.id);
        setFormState({
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          avatarUrl: data.avatarUrl,
          role: data.role,
          email: data.email,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Gagal memuat profile. Cek konfigurasi Supabase dan RLS.";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setError(null);

    if (!userId) {
      setError("User belum tersedia.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("full_name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const avatar = formData.get("avatar");
    const avatarFile = avatar instanceof File && avatar.size > 0 ? avatar : null;

    try {
      let avatarUrl = formState.avatarUrl;

      if (avatarFile) {
        avatarUrl = await uploadAvatar(userId, avatarFile);
      }

      const updatedUser = await updateAuthProfileMetadata({
        fullName,
        phone,
        address,
        avatarUrl,
      });

      const latestProfile = updatedUser
        ? getAuthProfileFromUser(updatedUser)
        : {
            ...formState,
            fullName,
            phone,
            address,
            avatarUrl,
          };

      setFormState((prev) => ({
        ...prev,
        fullName: latestProfile.fullName,
        phone: latestProfile.phone,
        address: latestProfile.address,
        avatarUrl: latestProfile.avatarUrl,
        role: latestProfile.role,
        email: latestProfile.email,
      }));
      setStatus("Profile berhasil diperbarui.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memperbarui profile.";
      setError(message);
    }
  }

  async function onLogout() {
    await supabase.auth.signOut();
    startTransition(() => {
      router.push("/auth");
    });
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-sm text-zinc-500">Memuat profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10">
      <section className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Profile
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
              Kelola profile user
            </h1>
            <p className="mt-1 text-sm text-zinc-600">{formState.email}</p>
            <p className="text-sm text-zinc-600">
              Role: <span className="font-medium uppercase">{formState.role}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Button onClick={onLogout} disabled={isPending}>
              {isPending ? "Memproses..." : "Logout"}
            </Button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="flex items-center gap-4">
            {formState.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formState.avatarUrl}
                alt="Avatar user"
                className="size-[72px] rounded-full border object-cover"
              />
            ) : (
              <div className="grid size-[72px] place-items-center rounded-full border border-dashed text-xs text-zinc-500">
                No avatar
              </div>
            )}
            <input
              name="avatar"
              type="file"
              accept="image/*"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-800">
                Nama Lengkap
              </label>
              <input
                name="full_name"
                defaultValue={formState.fullName}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-3 focus:ring-orange-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-800">
                Nomor Telepon
              </label>
              <input
                name="phone"
                defaultValue={formState.phone}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-3 focus:ring-orange-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-800">Alamat</label>
            <textarea
              name="address"
              rows={3}
              defaultValue={formState.address}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-3 focus:ring-orange-100"
            />
          </div>

          <Button type="submit">Simpan Perubahan</Button>
        </form>

        {status ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {status}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
