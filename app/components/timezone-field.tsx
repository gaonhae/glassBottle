"use client";

import { useEffect, useState } from "react";

export function TimezoneField() {
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    } catch {
      setTimezone("UTC");
    }
  }, []);

  return <input type="hidden" name="timezone" value={timezone} readOnly />;
}
