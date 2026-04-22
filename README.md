# ACIS - Auth, Profile, Dashboard Role-Based

Implementasi fitur dari issue `#4`:
- Login, Register, Logout
- Dashboard berdasarkan role (`admin` dan `customer`)
- Halaman profile untuk lihat/update data user

## Stack

- Next.js `16.2.4` (App Router)
- Supabase Auth (`auth.users` metadata) + Storage
- React `19`
- Tailwind CSS + shadcn UI

## Setup Environment

Isi file `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Setup Supabase

1. Aktifkan Supabase Auth (Email/Password).
2. Buat bucket storage bernama `avatars` (public bucket).
3. Data profil disimpan di `auth.users.user_metadata` (`full_name`, `phone`, `address`, `avatar_url`, `role`).

Contoh policy storage minimal untuk avatar:
- `SELECT`: public
- `INSERT` dan `UPDATE`: authenticated user untuk folder sendiri (`auth.uid()::text = (storage.foldername(name))[1]`)

## Menjalankan Project

```bash
npm install
npm run dev
```

## Route Utama

- `/` landing page
- `/auth` login + register
- `/dashboard` resolver role
- `/dashboard/admin` dashboard admin
- `/dashboard/customer` dashboard customer
- `/profile` kelola profile
