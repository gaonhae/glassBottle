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
        <div className="relative flex min-h-[100dvh] justify-center sm:px-6 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),transparent_52%)]" />
          <div className="relative flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-white/72 backdrop-blur-xl sm:min-h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-[32px] sm:border sm:border-white/70 sm:shadow-shell">
            <header className="sticky top-0 z-20 border-b border-white/80 bg-white/82 backdrop-blur-xl">
              <div className="flex items-start gap-4 px-5 pb-4 pt-5">
                <Link href="/" className="min-w-0 text-slate-950 no-underline">
                  <span className="block truncate font-serif text-[1.6rem] leading-none">{`${BRAND_NAME.slice(0, 1).toUpperCase()}${BRAND_NAME.slice(1)}`}</span>
                </Link>
                <p className="hidden max-w-[11rem] pt-1 text-right text-xs leading-5 text-slate-500 sm:block">
                  조금 늦게 도착하는 말이 더 오래 남을 때가 있습니다.
                </p>
              </div>
            </header>
            <main className="flex-1 px-4 pb-[calc(7.25rem+env(safe-area-inset-bottom))] pt-6 sm:px-5 sm:pb-[7.25rem]">{children}</main>
            <MobileNav />
          </div>
        </div>
      </body>
    </html>
  );
}
