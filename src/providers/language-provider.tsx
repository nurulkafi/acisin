'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// ─── Translation Dictionaries ───────────────────────────────────────────────

type Lang = 'id' | 'en';

const dict = {
  id: {
    // Auth
    welcome: 'Selamat Datang',
    loginTitle: 'Masuk ke Akun',
    registerTitle: 'Buat Akun Baru',
    login: 'Masuk',
    register: 'Daftar',
    loginSubtitle: 'Kelola portofolio investasi Anda dengan mudah dan aman.',
    registerSubtitle: 'Mulai perjalanan investasi Anda hari ini. Gratis selamanya.',
    email: 'Alamat Email',
    password: 'Kata Sandi',
    confirmPassword: 'Konfirmasi Kata Sandi',
    fullName: 'Nama Lengkap',
    phone: 'Nomor Telepon',
    address: 'Alamat',
    uploadAvatar: 'Foto Profil',
    processing: 'Memproses...',
    darkMode: 'Mode Gelap',
    lightMode: 'Mode Terang',
    // Validation
    emailRequired: 'Email wajib diisi.',
    emailInvalid: 'Format email tidak valid.',
    passwordRequired: 'Kata sandi wajib diisi.',
    passwordMin: 'Kata sandi minimal 8 karakter.',
    confirmPasswordRequired: 'Konfirmasi kata sandi wajib diisi.',
    passwordMismatch: 'Konfirmasi kata sandi tidak sesuai.',
    fullNameRequired: 'Nama lengkap wajib diisi.',
    // Dashboard
    dashboard: 'Dashboard',
    logout: 'Keluar',
    adminRole: 'Administrator',
    customerRole: 'Nasabah',
    welcomeBack: 'Selamat datang kembali',
    mainMenu: 'Menu Utama',
    // Feature bullets
    feature1: 'Analitik portofolio real-time',
    feature2: 'Keamanan data berlapis enkripsi',
    feature3: 'Laporan keuangan otomatis',
  },
  en: {
    // Auth
    welcome: 'Welcome',
    loginTitle: 'Sign In to Your Account',
    registerTitle: 'Create a New Account',
    login: 'Sign In',
    register: 'Register',
    loginSubtitle: 'Manage your investment portfolio easily and securely.',
    registerSubtitle: 'Start your investment journey today. Free forever.',
    email: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    phone: 'Phone Number',
    address: 'Address',
    uploadAvatar: 'Profile Photo',
    processing: 'Processing...',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    // Validation
    emailRequired: 'Email is required.',
    emailInvalid: 'Invalid email format.',
    passwordRequired: 'Password is required.',
    passwordMin: 'Password must be at least 8 characters.',
    confirmPasswordRequired: 'Please confirm your password.',
    passwordMismatch: 'Passwords do not match.',
    fullNameRequired: 'Full name is required.',
    // Dashboard
    dashboard: 'Dashboard',
    logout: 'Sign Out',
    adminRole: 'Administrator',
    customerRole: 'Customer',
    welcomeBack: 'Welcome back',
    mainMenu: 'Main Menu',
    // Feature bullets
    feature1: 'Real-time portfolio analytics',
    feature2: 'Multi-layer encrypted security',
    feature3: 'Automated financial reports',
  },
} satisfies Record<Lang, Record<string, string>>;

export type TranslationKey = keyof typeof dict.id;

// ─── Context ────────────────────────────────────────────────────────────────

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('id');

  useEffect(() => {
    const saved = window.localStorage.getItem('app-lang') as Lang | null;
    if (saved === 'en' || saved === 'id') setLangState(saved);
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    window.localStorage.setItem('app-lang', next);
  }

  function t(key: TranslationKey): string {
    return dict[lang][key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
