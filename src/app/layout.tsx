import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "CimoFood – Renyah, Pedas, Asli Sejak 2017 | Etalase Resmi & Mitra UMKM Cimoring",
  description:
    "Platform belanja resmi UMKM Cimoring sejak 2017. Berizin PIRT & Bersertifikat Halal, harga lebih hemat dari marketplace, garansi kemasan aman SOP 4 Lapis, dan peluang Reseller tanpa minimal order.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col theme-storefront">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
