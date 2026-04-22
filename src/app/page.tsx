import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffe9d6_0%,_#fff4ea_40%,_#ffffff_100%)] px-4 py-16">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-3xl border border-orange-100 bg-white/90 p-8 shadow-sm backdrop-blur">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-orange-500">
            ACIS
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Sistem autentikasi, profile, dan dashboard berbasis role
          </h1>
          <p className="text-zinc-600">
            Mulai dari register/login, cek role user, lalu redirect ke dashboard
            admin atau customer.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/auth" className={cn(buttonVariants(), "px-4")}>
            Login / Register
          </Link>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }), "px-4")}
          >
            Dashboard
          </Link>
          <Link
            href="/profile"
            className={cn(buttonVariants({ variant: "outline" }), "px-4")}
          >
            Profile
          </Link>
        </div>
      </section>
    </main>
  );
}
