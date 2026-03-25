export type FamilyMemberRecord = {
  family_id: string;
  display_name: string;
};

export type QuestionRecord = {
  id: string;
  prompt_text: string;
  publish_date: string;
  created_at: string;
};

export type AnswerRecord = {
  id: string;
  question_id: string;
  family_id: string;
  author_user_id: string;
  body_text: string;
  created_at: string;
};

export type AnswerCommentRecord = {
  id: string;
  answer_id: string;
  family_id: string;
  author_user_id: string;
  parent_comment_id: string | null;
  body_text: string;
  created_at: string;
};

export type LetterRecord = {
  id: string;
  recipient_user_id: string;
  sender_user_id: string;
  body_text: string;
  status: "scheduled" | "delivered" | "read" | "canceled";
  scheduled_at: string;
  delivered_at: string | null;
  read_at: string | null;
  editable_until: string;
  created_at: string;
};
