"use client";

import type { AnalyticsEventName } from "@/lib/analytics";

export function sendAnalyticsEvent(eventName: AnalyticsEventName, properties?: Record<string, unknown>) {
  const body = JSON.stringify({
    eventName,
    properties
  });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const sent = navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));

    if (sent) {
      return;
    }
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body,
    keepalive: true,
    credentials: "same-origin"
  }).catch(() => {});
}
