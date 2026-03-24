import type { Metadata, Viewport } from "next";
import Link from "next/link";

import { MobileNav } from "@/app/components/mobile-nav";
import { BRAND_NAME } from "@/lib/ui-text";

import "./globals.css";

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: "시간차를 두고 도착하는 가족 편지와 질문을 위한 private conversation space"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="relative flex min-h-screen justify-center px-3 py-3 sm:px-6 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),transparent_52%)]" />
          <div className="relative flex min-h-[calc(100vh-1.5rem)] w-full max-w-[430px] flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/72 shadow-shell backdrop-blur-xl sm:min-h-[calc(100vh-3rem)]">
            <header className="sticky top-0 z-20 border-b border-white/80 bg-white/82 backdrop-blur-xl">
              <div className="flex items-start gap-4 px-5 pb-4 pt-5">
                <Link href="/" className="flex min-w-0 items-center gap-3 text-slate-950 no-underline">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-slate-950 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_18px_35px_-22px_rgba(15,23,42,0.9)]">
                    gb
                  </span>
                  <span className="min-w-0 space-y-1">
                    <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-slate-400">slow family notes</span>
                    <span className="block truncate font-serif text-[1.6rem] leading-none">{BRAND_NAME}</span>
                  </span>
                </Link>
                <p className="hidden max-w-[11rem] pt-1 text-right text-xs leading-5 text-slate-500 sm:block">
                  조금 늦게 도착하는 말이 더 오래 남을 때가 있습니다.
                </p>
              </div>
            </header>
            <main className="flex-1 px-4 pb-[7.25rem] pt-6 sm:px-5">{children}</main>
            <MobileNav />
          </div>
        </div>
      </body>
    </html>
  );
}
