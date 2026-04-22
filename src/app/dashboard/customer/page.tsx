'use client';

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentSessionUser, getUserRoleFromAuthUser } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [name, setName] = useState<string>("Customer");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const user = await getCurrentSessionUser();
        if (!user) {
          router.replace("/auth");
          return;
        }

        const role = getUserRoleFromAuthUser(user);
        if (!isMounted) {
          return;
        }

        if (role === "admin") {
          router.replace("/dashboard/admin");
          return;
        }

        setName(user.user_metadata.full_name ?? user.email ?? "Customer");
      } catch {
        router.replace("/auth");
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function onLogout() {
    await supabase.auth.signOut();
    startTransition(() => {
      router.push("/auth");
    });
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10">
      <section className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Customer
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
          Dashboard Customer
        </h1>
        <p className="mt-2 text-zinc-600">
          Halo <span className="font-medium">{name}</span>, ini area dashboard untuk
          pelanggan.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/profile">
            <Button variant="outline">Kelola Profile</Button>
          </Link>
          <Button onClick={onLogout} disabled={isPending}>
            {isPending ? "Memproses..." : "Logout"}
          </Button>
        </div>
      </section>
    </main>
  );
}
