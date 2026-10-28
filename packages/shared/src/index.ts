import { z } from "zod";

export const LANGUAGES = ["ru", "kk"] as const;
export const LanguageSchema = z.enum(LANGUAGES);
export type Language = z.infer<typeof LanguageSchema>;

/** What the parent tells us about the child. */
export const ChildProfileSchema = z.object({
  name: z.string().trim().min(1).max(40),
  age: z.coerce.number().int().min(2).max(10),
  gender: z.enum(["boy", "girl"]),
  interests: z.array(z.string().trim().min(1).max(40)).min(1).max(5),
  pet: z.string().trim().max(60).optional(),
  city: z.string().trim().min(1).max(60),
  language: LanguageSchema.default("ru"),
});
export type ChildProfile = z.infer<typeof ChildProfileSchema>;

export const CreateBookSchema = z.object({ child: ChildProfileSchema });
export type CreateBookInput = z.infer<typeof CreateBookSchema>;

/** One page of the story as Muse Spark returns it. */
export const StoryPageSchema = z.object({
  page: z.number().int().min(1),
  text: z.string().min(1),
  scene_prompt: z.string().min(1),
});
export type StoryPage = z.infer<typeof StoryPageSchema>;

export const StorySchema = z.object({
  title: z.string().min(1),
  hero_description: z.string().min(1),
  pages: z.array(StoryPageSchema).min(1),
});
export type Story = z.infer<typeof StorySchema>;

/** Generation stages, in order. */
export const BOOK_STATUSES = ["queued", "story", "hero", "pages", "pdf", "done", "failed"] as const;
export const BookStatusSchema = z.enum(BOOK_STATUSES);
export type BookStatus = z.infer<typeof BookStatusSchema>;

export const BookPageSchema = z.object({
  page: z.number().int(),
  text: z.string(),
  imageUrl: z.string().nullable(),
});
export type BookPage = z.infer<typeof BookPageSchema>;

/** What the API returns for a book. */
export const BookSchema = z.object({
  id: z.string(),
  status: BookStatusSchema,
  progress: z.number().min(0).max(100),
  title: z.string().nullable(),
  heroImageUrl: z.string().nullable(),
  pages: z.array(BookPageSchema),
  pdfUrl: z.string().nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
});
export type Book = z.infer<typeof BookSchema>;

/** Progress shown for each stage while the book is generating. */
export function progressFor(status: BookStatus, pagesDone = 0, pagesTotal = 0): number {
  switch (status) {
    case "queued":
      return 0;
    case "story":
      return 10;
    case "hero":
      return 25;
    case "pages":
      return pagesTotal ? 30 + Math.round((60 * pagesDone) / pagesTotal) : 30;
    case "pdf":
      return 95;
    case "done":
      return 100;
    case "failed":
      return 0;
  }
}
