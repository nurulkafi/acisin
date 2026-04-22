import type { User, UserMetadata } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "customer";

export type AuthProfile = {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string;
  address: string;
  avatarUrl: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function isPlaceholder(value: string) {
  return value.includes("your-supabase");
}

function parseRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "customer";
}

function getUserMetadata(user: User): UserMetadata {
  return (user.user_metadata ?? {}) as UserMetadata;
}

export function isSupabaseConfigured() {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_KEY) &&
    !isPlaceholder(SUPABASE_URL) &&
    !isPlaceholder(SUPABASE_KEY)
  );
}

export function requireSupabaseConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local."
    );
  }
}

export async function getCurrentSessionUser() {
  requireSupabaseConfig();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

export function getUserRoleFromAuthUser(user: User): UserRole {
  const appRole = user.app_metadata?.role;
  const userRole = user.user_metadata?.role;
  return parseRole(appRole ?? userRole);
}

export function getAuthProfileFromUser(user: User): AuthProfile {
  const metadata = getUserMetadata(user);
  return {
    userId: user.id,
    email: user.email ?? "",
    role: getUserRoleFromAuthUser(user),
    fullName:
      (typeof metadata.full_name === "string" && metadata.full_name) ||
      (user.email ? user.email.split("@")[0] : "User"),
    phone: (typeof metadata.phone === "string" && metadata.phone) || "",
    address: (typeof metadata.address === "string" && metadata.address) || "",
    avatarUrl:
      (typeof metadata.avatar_url === "string" && metadata.avatar_url) || null,
  };
}

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function updateAuthProfileMetadata({
  fullName,
  phone,
  address,
  avatarUrl,
}: {
  fullName: string;
  phone: string;
  address: string;
  avatarUrl: string | null;
}) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    throw new Error("Sesi tidak ditemukan. Silakan login ulang.");
  }

  const existingMetadata = getUserMetadata(currentUser);
  const role = parseRole(currentUser.app_metadata?.role ?? existingMetadata.role);

  const { data, error } = await supabase.auth.updateUser({
    data: {
      ...existingMetadata,
      full_name: fullName,
      phone,
      address,
      avatar_url: avatarUrl,
      role,
    },
  });

  if (error) {
    throw error;
  }

  // Ensure client receives the latest metadata payload after update.
  await supabase.auth.refreshSession();
  const { data: latestUserData, error: latestUserError } =
    await supabase.auth.getUser();

  if (latestUserError) {
    throw latestUserError;
  }

  return latestUserData.user ?? data.user;
}
