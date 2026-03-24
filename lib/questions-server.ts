import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getQuestionPublishDate, getQuestionTemplateIndex } from "@/lib/questions";

type ExistingQuestion = {
  id: string;
  publish_date: string;
};

type QuestionTemplate = {
  id: string;
  body_text: string;
  sort_order: number;
};

type CreatedQuestion = {
  id: string;
  publish_date: string;
};

type InsertQuestionInput = {
  publishDate: string;
  promptText: string;
  templateId: string;
};

export type QuestionStore = {
  getQuestionByPublishDate(publishDate: string): Promise<ExistingQuestion | null>;
  listTemplates(): Promise<QuestionTemplate[]>;
  insertQuestion(input: InsertQuestionInput): Promise<CreatedQuestion>;
};

function isDuplicateQuestionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === "23505" ||
    maybeError.message?.includes('duplicate key value violates unique constraint "questions_publish_date_key"') === true
  );
}

export async function ensureQuestionForDate(store: QuestionStore, publishDate: string): Promise<CreatedQuestion> {
  const existingQuestion = await store.getQuestionByPublishDate(publishDate);

  if (existingQuestion) {
    return existingQuestion;
  }

  const templates = await store.listTemplates();

  if (templates.length === 0) {
    throw new Error("No question templates available.");
  }

  const templateIndex = getQuestionTemplateIndex(publishDate, templates.length);
  const template = templates[templateIndex];

  try {
    return await store.insertQuestion({
      publishDate,
      promptText: template.body_text,
      templateId: template.id
    });
  } catch (error) {
    if (!isDuplicateQuestionError(error)) {
      throw error;
    }

    const createdByRace = await store.getQuestionByPublishDate(publishDate);

    if (!createdByRace) {
      throw error;
    }

    return createdByRace;
  }
}

export function createSupabaseQuestionStore(): QuestionStore {
  const admin = createSupabaseAdminClient();

  return {
    async getQuestionByPublishDate(publishDate) {
      const { data, error } = await admin
        .from("questions")
        .select("id, publish_date")
        .eq("publish_date", publishDate)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    async listTemplates() {
      const { data, error } = await admin
        .from("question_templates")
        .select("id, body_text, sort_order")
        .order("sort_order", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data ?? [];
    },
    async insertQuestion({ publishDate, promptText, templateId }) {
      const { data, error } = await admin
        .from("questions")
        .insert({
          template_id: templateId,
          prompt_text: promptText,
          publish_date: publishDate
        })
        .select("id, publish_date")
        .single();

      if (error) {
        throw error;
      }

      return data;
    }
  };
}

export async function ensureTodayQuestion(now = new Date()) {
  const publishDate = getQuestionPublishDate(now);
  return ensureQuestionForDate(createSupabaseQuestionStore(), publishDate);
}
