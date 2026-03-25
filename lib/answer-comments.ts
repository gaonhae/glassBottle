import type { AnswerCommentRecord } from "@/lib/types";

export type AnswerCommentThread = AnswerCommentRecord & {
  replies: AnswerCommentRecord[];
};

export function buildAnswerCommentThreads(comments: AnswerCommentRecord[]): AnswerCommentThread[] {
  const threads: AnswerCommentThread[] = [];
  const repliesByParentId = new Map<string, AnswerCommentRecord[]>();

  for (const comment of comments) {
    if (comment.parent_comment_id) {
      const replies = repliesByParentId.get(comment.parent_comment_id) ?? [];
      replies.push(comment);
      repliesByParentId.set(comment.parent_comment_id, replies);
      continue;
    }

    threads.push({
      ...comment,
      replies: []
    });
  }

  for (const thread of threads) {
    thread.replies = repliesByParentId.get(thread.id) ?? [];
  }

  return threads;
}
