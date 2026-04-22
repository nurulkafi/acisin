'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getCurrentSessionUser, getUserRoleFromAuthUser } from "@/lib/auth-client";

export default function DashboardResolverPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function resolveDashboard() {
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

        router.replace(role === "admin" ? "/dashboard/admin" : "/dashboard/customer");
      } catch {
        router.replace("/auth");
      }
    }

    void resolveDashboard();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center">
      <p className="text-sm text-zinc-500">Menentukan dashboard berdasarkan role...</p>
    </main>
  );
}
