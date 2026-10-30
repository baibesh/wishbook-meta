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
  /** The pet's look, or null when the child has no pet. */
  pet_description: z.string().min(1).nullable().default(null),
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

// ---- Free limit and purchased books ------------------------------------------

/** Price of one more generated (digital) book once the free ones are used. */
export const BOOK_PRICE_KZT = 2900;

export const QuotaSchema = z.object({
  /** Books this visitor has generated (failed ones are not counted). */
  used: z.number().int(),
  /** Free books plus purchased ones. */
  limit: z.number().int(),
  remaining: z.number().int(),
  /** A demo code (for judges) lifts the per-visitor limit. */
  demo: z.boolean(),
});
export type Quota = z.infer<typeof QuotaSchema>;

/** Body of a 402 from POST /books. */
export const LIMIT_REACHED = "limit_reached";
/** Body of a 503 from POST /books when the service-wide daily cap is hit. */
export const DAILY_CAP_REACHED = "daily_cap_reached";

// ---- Printed book orders -------------------------------------------------------

export const COVERS = ["soft", "hard"] as const;
export const CoverSchema = z.enum(COVERS);
export type Cover = z.infer<typeof CoverSchema>;

export const COVER_PRICE_KZT: Record<Cover, number> = { soft: 9900, hard: 14900 };
/** Cities our print partners deliver to for free; elsewhere delivery is a flat fee. */
export const FREE_DELIVERY_CITIES = ["Алматы", "Астана"];
export const DELIVERY_FEE_KZT = 1500;

export const CreateOrderSchema = z.object({
  bookId: z.string().min(1),
  recipientName: z.string().trim().min(2).max(80),
  /** Kazakhstan mobile number: +7 and 10 digits. */
  phone: z
    .string()
    .transform((s) => s.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^\+7\d{10}$/, "Номер в формате +7 XXX XXX XX XX")),
  city: z.string().trim().min(2).max(60),
  address: z.string().trim().min(5).max(200),
  cover: CoverSchema,
  quantity: z.coerce.number().int().min(1).max(5),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export function orderPrice(cover: Cover, quantity: number, city: string) {
  const books = COVER_PRICE_KZT[cover] * quantity;
  const delivery = FREE_DELIVERY_CITIES.includes(city.trim()) ? 0 : DELIVERY_FEE_KZT;
  return { books, delivery, total: books + delivery };
}

/** Delivery stages, in order. The demo walks through them on a timer. */
export const ORDER_STATUSES = ["paid", "printing", "shipped", "delivered"] as const;
export const OrderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  bookTitle: z.string().nullable(),
  status: OrderStatusSchema,
  recipientName: z.string(),
  city: z.string(),
  address: z.string(),
  cover: CoverSchema,
  quantity: z.number().int(),
  booksKzt: z.number().int(),
  deliveryKzt: z.number().int(),
  totalKzt: z.number().int(),
  createdAt: z.string(),
});
export type Order = z.infer<typeof OrderSchema>;

/** Stage an order has reached `elapsedMs` after it was paid, given the time each stage takes. */
export function orderStatusAt(elapsedMs: number, stageMs: number): OrderStatus {
  const index = Math.min(Math.floor(elapsedMs / stageMs), ORDER_STATUSES.length - 1);
  return ORDER_STATUSES[Math.max(index, 0)];
}
