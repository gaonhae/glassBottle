import { describe, expect, it } from "vitest";

import { buildAnswerCommentThreads, countAnswerCommentsByAnswerId } from "@/lib/answer-comments";
import type { AnswerCommentRecord } from "@/lib/types";

function createCommentRecord(overrides: Partial<AnswerCommentRecord>): AnswerCommentRecord {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    answer_id: overrides.answer_id ?? "answer-1",
    family_id: overrides.family_id ?? "family-1",
    author_user_id: overrides.author_user_id ?? "user-1",
    parent_comment_id: overrides.parent_comment_id ?? null,
    body_text: overrides.body_text ?? "comment body",
    created_at: overrides.created_at ?? "2026-03-25T00:00:00.000Z"
  };
}

describe("buildAnswerCommentThreads", () => {
  it("groups direct replies beneath their top-level comment", () => {
    const firstComment = createCommentRecord({ id: "comment-1", body_text: "first comment" });
    const firstReply = createCommentRecord({
      id: "reply-1",
      parent_comment_id: "comment-1",
      body_text: "first reply"
    });
    const secondComment = createCommentRecord({ id: "comment-2", body_text: "second comment" });

    const threads = buildAnswerCommentThreads([firstComment, firstReply, secondComment]);

    expect(threads).toHaveLength(2);
    expect(threads[0].id).toBe("comment-1");
    expect(threads[0].replies.map((reply) => reply.id)).toEqual(["reply-1"]);
    expect(threads[1].id).toBe("comment-2");
    expect(threads[1].replies).toEqual([]);
  });

  it("preserves reply order even when replies appear before the parent in the array", () => {
    const firstReply = createCommentRecord({
      id: "reply-1",
      parent_comment_id: "comment-1",
      created_at: "2026-03-25T00:01:00.000Z"
    });
    const secondReply = createCommentRecord({
      id: "reply-2",
      parent_comment_id: "comment-1",
      created_at: "2026-03-25T00:02:00.000Z"
    });
    const parentComment = createCommentRecord({
      id: "comment-1",
      created_at: "2026-03-25T00:00:00.000Z"
    });

    const threads = buildAnswerCommentThreads([firstReply, secondReply, parentComment]);

    expect(threads).toHaveLength(1);
    expect(threads[0].replies.map((reply) => reply.id)).toEqual(["reply-1", "reply-2"]);
  });
});

describe("countAnswerCommentsByAnswerId", () => {
  it("counts all comments for each answer, including replies", () => {
    const comments = [
      createCommentRecord({ id: "comment-1", answer_id: "answer-1" }),
      createCommentRecord({ id: "reply-1", answer_id: "answer-1", parent_comment_id: "comment-1" }),
      createCommentRecord({ id: "comment-2", answer_id: "answer-2" })
    ];

    const counts = countAnswerCommentsByAnswerId(comments);

    expect(counts.get("answer-1")).toBe(2);
    expect(counts.get("answer-2")).toBe(1);
  });

  it("returns an empty map when there are no comments", () => {
    const counts = countAnswerCommentsByAnswerId([]);

    expect(counts.size).toBe(0);
  });
});
