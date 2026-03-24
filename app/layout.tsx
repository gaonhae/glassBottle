import type { Metadata } from "next";
import Link from "next/link";

import { BRAND_NAME } from "@/lib/ui-text";

import "./globals.css";

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: "가족과 솔직한 마음을 나중에 전하는 지연 편지 서비스"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              {BRAND_NAME}
            </Link>
            <nav className="nav">
              <Link href="/inbox">받은 편지함</Link>
              <Link href="/outbox">보낸 편지함</Link>
              <Link href="/letters/new">편지 쓰기</Link>
              <Link href="/settings">설정</Link>
              <Link href="/auth">로그인</Link>
            </nav>
          </div>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
