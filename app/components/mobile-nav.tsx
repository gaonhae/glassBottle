"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Inbox, Send, Settings2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/prompts", label: "질문", icon: Sparkles },
  { href: "/inbox", label: "받은 편지", icon: Inbox },
  { href: "/outbox", label: "보낸 편지", icon: Send },
  { href: "/settings", label: "설정", icon: Settings2 }
];

function shouldHideNavigation(pathname: string) {
  return pathname === "/" || pathname === "/auth" || pathname === "/onboarding" || pathname === "/unsupported-device";
}

function isActivePath(pathname: string, href: string) {
  if (href === "/prompts") {
    return pathname.startsWith("/prompts") || pathname.startsWith("/answers");
  }

  if (href === "/outbox" && pathname === "/letters/new") {
    return true;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();

  if (shouldHideNavigation(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label="모바일 내비게이션"
      className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-4 gap-2 border-t border-white/85 bg-white/88 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_44px_-34px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:bottom-6 sm:rounded-b-[32px] sm:border-x sm:border-b"
    >
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-[20px] px-2 text-[0.72rem] font-semibold text-slate-400 no-underline transition-all duration-200",
              active ? "bg-accent-soft text-accent shadow-[inset_0_0_0_1px_rgba(53,86,247,0.08)]" : "hover:bg-slate-100/80 hover:text-slate-700"
            )}
          >
            <Icon className="h-[1.1rem] w-[1.1rem]" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
