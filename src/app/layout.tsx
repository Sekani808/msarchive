// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNavWrapper from "@/components/layout/BottomNavWrapper"; // Import the wrapper

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Msarchive | Premium Reading Archive",
  description: "Stories that stay with you long after the last page.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-navy-dark text-gray-light min-h-screen`}
      >
        <div className="pb-24">
          {children}
        </div>
        
        {/* Use the wrapper instead of the direct BottomNav */}
        <BottomNavWrapper />
      </body>
    </html>
  );
}