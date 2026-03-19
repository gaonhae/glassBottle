export type FamilyMemberRecord = {
  family_id: string;
  display_name: string;
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
