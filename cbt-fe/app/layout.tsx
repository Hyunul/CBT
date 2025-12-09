import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "CBT Platform",
  description: "A modern Computer-Based Testing Platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={inter.className}>
      <body className="antialiased">
        <div className="relative flex min-h-screen flex-col bg-background">
          <Navbar />
          <main className="flex-1">{children}</main>
        </div>
        <ToastProvider />
      </body>
    </html>
  );
}