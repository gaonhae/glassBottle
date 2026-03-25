"use client";

import { useEffect } from "react";

import { sendAnalyticsEvent } from "@/app/components/analytics-client";
import type { AnalyticsEventName } from "@/lib/analytics";

type AnalyticsPageViewProps = {
  eventName: AnalyticsEventName;
  eventProperties?: Record<string, unknown>;
};

export function AnalyticsPageView({ eventName, eventProperties }: AnalyticsPageViewProps) {
  const serializedProperties = JSON.stringify(eventProperties ?? {});

  useEffect(() => {
    sendAnalyticsEvent(eventName, eventProperties);
  }, [eventName, serializedProperties]);

  return null;
}
