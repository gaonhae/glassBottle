"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { getMutationRefreshMarker } from "@/lib/mutation-refresh";

type PageRefreshOnSuccessProps = {
  watchedParams: readonly string[];
};

export function PageRefreshOnSuccess({ watchedParams }: PageRefreshOnSuccessProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const marker = getMutationRefreshMarker(pathname, searchParams, watchedParams);

  useEffect(() => {
    if (!marker) {
      return;
    }

    const storageKey = `page-refresh:${marker}`;
    const alreadyRefreshed = window.sessionStorage.getItem(storageKey);
    const navigationEntry = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const isReloadNavigation = navigationEntry?.type === "reload";

    if (alreadyRefreshed === "1") {
      if (isReloadNavigation) {
        window.sessionStorage.removeItem(storageKey);
      }

      return;
    }

    window.sessionStorage.setItem(storageKey, "1");
    window.location.reload();
  }, [marker]);

  return null;
}
