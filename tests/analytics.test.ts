import { describe, expect, it, vi } from "vitest";

import {
  analyticsEventNames,
  trackAnalyticsEvent,
  type AnalyticsEventRecord,
  type AnalyticsStore
} from "@/lib/analytics";

describe("trackAnalyticsEvent", () => {
  it("writes normalized analytics rows", async () => {
    const records: AnalyticsEventRecord[] = [];
    const store: AnalyticsStore = {
      insert: vi.fn(async (record) => {
        records.push(record);
      })
    };

    await trackAnalyticsEvent(store, {
      eventName: "answerCreated",
      userId: "user-1",
      familyId: "family-1",
      properties: { questionId: "question-1" }
    });

    expect(records).toEqual([
      {
        event_name: "answerCreated",
        user_id: "user-1",
        family_id: "family-1",
        properties: { questionId: "question-1" }
      }
    ]);
  });

  it("defaults nullable fields and properties", async () => {
    const store: AnalyticsStore = {
      insert: vi.fn(async () => {})
    };

    await trackAnalyticsEvent(store, {
      eventName: "homeViewed"
    });

    expect(store.insert).toHaveBeenCalledWith({
      event_name: "homeViewed",
      user_id: null,
      family_id: null,
      properties: {}
    });
  });

  it("exposes the exact PRD analytics event names", () => {
    expect(analyticsEventNames).toContain("answerCardClicked");
    expect(analyticsEventNames).toContain("unsupportedDeviceViewed");
    expect(analyticsEventNames).toContain("bottleLetterDelivered");
  });
});
