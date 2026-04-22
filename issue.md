# Panduan Tugas: Revisi Frontend (Keuangan & Investasi)

Dokumen ini ditujukan kepada **Junior Programmer** dan **AI Agent** sebagai acuan utama dalam melakukan pengembangan dan revisi pada antarmuka pengguna (UI) aplikasi. 

Aplikasi ini bertemakan **Keuangan dan Investasi (Finance & Investment)**. Seluruh hasil desain dan implementasi harus mencerminkan kesan profesional, modern, elegan, dan premium.

---

## 1. Revisi Halaman Login dan Register

Silakan lakukan perombakan pada halaman Login dan Register dengan spesifikasi berikut:

*   **Desain Modern & Tematik**: Rancang antarmuka yang modern dan premium sesuai dengan tema keuangan/investasi. Gunakan prinsip desain terkini (seperti perpaduan warna yang solid, tipografi yang rapi, atau efek *glassmorphism* jika sesuai).
*   **Mode Tema (Dark/Light Mode)**: 
    *   Tambahkan tombol *toggle* untuk beralih antara tema gelap dan terang.
    *   **Penting**: Atur agar **Tema Gelap (Dark Mode) aktif secara default** saat pengguna pertama kali membuka halaman.
*   **Lokalisasi Bahasa (ID/EN)**:
    *   Tambahkan *toggle* pilihan bahasa (Bahasa Indonesia dan Bahasa Inggris).
    *   **Penting**: Gunakan **Bahasa Indonesia sebagai bahasa default**.
*   **Validasi Form**: 
    *   Implementasikan validasi *client-side* yang kuat dan ramah pengguna pada form login maupun register.
    *   Berikan pesan *error* yang jelas jika input tidak sesuai (misal: format email salah, password kurang kuat) untuk mempermudah proses masuk dan pendaftaran user.

---

## 2. Revisi Halaman Dashboard (Admin dan Customer)

Silakan lakukan persiapan dan perombakan struktur dasar untuk halaman Dashboard, baik untuk *role* Admin maupun Customer:

*   **Pengosongan Konten Utama**: 
    *   Kosongkan isi/konten utama dari halaman dashboard admin dan customer yang ada saat ini. Halaman akan dirancang bangun ulang dari awal.
*   **Desain Layout Modern**: 
    *   Buat kerangka (*layout*) dashboard yang modern, rapi, dan sesuai dengan estetika aplikasi keuangan.
*   **Mode Tema (Dark/Light Mode)**:
    *   Pastikan *toggle* tema gelap/terang juga tersedia dan berfungsi di halaman dashboard.
    *   **Penting**: Sama seperti halaman autentikasi, gunakan **Tema Gelap (Dark Mode) secara default**.
*   **Lokalisasi Bahasa (ID/EN)**:
    *   Pastikan *toggle* bahasa tersedia di header/navigasi dashboard.
    *   **Penting**: Gunakan **Bahasa Indonesia sebagai bahasa default**.
*   **Navigasi Sidebar**:
    *   Bangun komponen navigasi *sidebar* untuk Admin dan Customer.
    *   Untuk tahap awal ini, cukup tambahkan satu menu navigasi saja, yaitu: **"Dashboard"**.
