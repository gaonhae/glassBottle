"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { sendAnalyticsEvent } from "@/app/components/analytics-client";
import type { AnalyticsEventName } from "@/lib/analytics";

type AnalyticsLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    eventName: AnalyticsEventName;
    eventProperties?: Record<string, unknown>;
    children: ReactNode;
  };

export function AnalyticsLink({ eventName, eventProperties, onClick, children, ...props }: AnalyticsLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          sendAnalyticsEvent(eventName, eventProperties);
        }
      }}
    >
      {children}
    </Link>
  );
}
