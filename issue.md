# Rencana Pengembangan Fitur Aplikasi

Dokumen ini berisi spesifikasi fitur, skema database, dan alur aplikasi yang akan dikembangkan.

## 1. Daftar Fitur Utama

- **Autentikasi**: Login, Register, dan Logout.
- **Dashboard**: Halaman dashboard dinamis berdasarkan *role* pengguna (Admin vs Customer).
- **Profile**: Halaman untuk melihat dan mengelola profil pengguna.

## 2. Skema Database (Supabase)

### Tabel `users`
Tabel utama untuk menyimpan data autentikasi dan informasi dasar pengguna.
- `id` (uuid, primary key)
- `full_name` (varchar)
- `email` (varchar)
- `password` (varchar) - *Catatan: Jika menggunakan Supabase Auth, password akan di-handle oleh auth.users, namun field ini disiapkan jika menggunakan custom auth.*
- `role` (varchar) - Contoh: `admin`, `customer`. Default saat register: `customer`.
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `is_active` (boolean, default: `true`)

### Tabel `profiles`
Tabel relasi untuk menyimpan data detail pengguna.
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key ke `users.id`)
- `phone` (varchar)
- `address` (varchar)
- `avatar_url` (varchar) - Link ke file di Supabase Storage.
- `created_at` (timestamp)
- `updated_at` (timestamp)

## 3. Alur Aplikasi (Flow)

### Register (Pendaftaran)
Pendaftaran pengguna baru dengan ketentuan:
- *Role* default yang diberikan adalah **`customer`**.
- Form pendaftaran mencakup input berikut:
  1. Nama Lengkap (`full_name`)
  2. Email (`email`)
  3. Password (`password`)
  4. Konfirmasi Password
  5. Nomor Telepon (`phone`)
  6. Alamat (`address`)
  7. Upload Foto Profile (File akan diunggah ke Supabase Storage, dan URL-nya disimpan di `avatar_url`).

### Login & Redirect
- Setelah berhasil login, sistem akan mengecek `role` pengguna.
- **Admin**: Akan di-redirect ke halaman **Dashboard Admin** yang memiliki fitur dan akses data yang lebih lengkap.
- **Customer**: Akan di-redirect ke halaman **Dashboard Customer** dengan tampilan dan akses yang disesuaikan untuk pelanggan.

### Logout
- Fitur untuk mengakhiri sesi pengguna dan mengembalikan ke halaman login atau halaman utama.
