import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "GlassBottle",
  description: "Delayed letters for honest family conversations"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              GlassBottle
            </Link>
            <nav className="nav">
              <Link href="/inbox">Inbox</Link>
              <Link href="/outbox">Outbox</Link>
              <Link href="/letters/new">Write</Link>
              <Link href="/settings">Settings</Link>
              <Link href="/auth">Sign in</Link>
            </nav>
          </div>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
