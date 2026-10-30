import { z } from "zod";
import { MethodologySlugSchema, fitsAge, methodology } from "./methodologies";

export * from "./methodologies";

export const LANGUAGES = ["ru", "kk", "en"] as const;
export const LanguageSchema = z.enum(LANGUAGES);
export type Language = z.infer<typeof LanguageSchema>;

/** Fixed words of a book, by its language. Phrased so the name never has to be declined. */
export const BOOK_LABELS: Record<Language, { madeFor: (name: string) => string; end: string; talk: string }> = {
  ru: { madeFor: (name) => `Специально для тебя, ${name}!`, end: "Конец", talk: "Поговорим?" },
  kk: { madeFor: (name) => `Арнайы саған, ${name}!`, end: "Соңы", talk: "Әңгімелесейік" },
  en: { madeFor: (name) => `Made just for you, ${name}!`, end: "The End", talk: "Let's talk" },
};

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

// ---- Catalog books -------------------------------------------------------------

/** A question a catalog book asks the parent; the answer goes into the story. */
export const TemplateQuestionSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().min(1),
  kind: z.enum(["text", "choice"]),
  options: z.array(z.string().min(1)).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
});
export type TemplateQuestion = z.infer<typeof TemplateQuestionSchema>;

/** A catalog book's text in another interface language; questions by key. */
export const TemplateTranslationSchema = z.object({
  title: z.string(),
  summary: z.string(),
  questions: z.record(
    z.string(),
    z.object({ label: z.string(), placeholder: z.string().optional(), options: z.array(z.string()).optional() }),
  ),
});
export type TemplateTranslation = z.infer<typeof TemplateTranslationSchema>;

/** A catalog card. */
export const TemplateSummarySchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  ageMin: z.number().int(),
  ageMax: z.number().int(),
  methodology: MethodologySlugSchema,
  languages: z.array(LanguageSchema),
  coverUrl: z.string().nullable(),
});
export type TemplateSummary = z.infer<typeof TemplateSummarySchema>;

export const TemplateSchema = TemplateSummarySchema.extend({
  questions: z.array(TemplateQuestionSchema),
});
export type Template = z.infer<typeof TemplateSchema>;

/** Answers by question key. Kept short: they go into the prompt. */
export const AnswersSchema = z.record(z.string(), z.string().trim().max(200));
export type Answers = z.infer<typeof AnswersSchema>;

/** Why `answers` do not satisfy `questions`, or null when they do. */
export function answersProblem(questions: TemplateQuestion[], answers: Answers): string | null {
  for (const q of questions) {
    const answer = answers[q.key]?.trim() ?? "";
    if (q.required && !answer) return `Ответьте на вопрос «${q.label}»`;
    if (answer && q.kind === "choice" && q.options && !q.options.includes(answer)) {
      return `«${answer}» — нет такого варианта в вопросе «${q.label}»`;
    }
  }
  return null;
}

export const CreateBookSchema = z
  .object({
    child: ChildProfileSchema,
    /** Catalog book slug; the book then follows its plot, method and questions. */
    template: z.string().min(1).optional(),
    answers: AnswersSchema.optional(),
    /** Story method for a book of your own; left out, one is picked by age. */
    methodology: MethodologySlugSchema.optional(),
    /** What a book of your own is about, in the parent's words ("first day at kindergarten"). */
    theme: z.string().trim().min(3).max(200).optional(),
    /** The child's favourite toy, from a photo uploaded to POST /toys; it joins the story. */
    toy: z
      .object({
        upload: z.string().regex(/^[a-z0-9]{10,40}$/),
        name: z.string().trim().max(40).optional(),
      })
      .optional(),
  })
  .superRefine((b, ctx) => {
    if (!b.methodology || fitsAge(b.methodology, b.child.age)) return;
    const m = methodology(b.methodology);
    ctx.addIssue({
      code: "custom",
      path: ["methodology"],
      message: `«${m.name}» подходит для возраста ${m.ageMin}–${m.ageMax} лет`,
    });
  });
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
  /** Questions for the parent to ask while reading together, in the book's language. */
  talk_questions: z.array(z.string().min(1)).min(3).max(5),
});
export type Story = z.infer<typeof StorySchema>;

/** Generation stages, in order. "toy" runs only when the parent sent a photo of a toy. */
export const BOOK_STATUSES = ["queued", "toy", "story", "hero", "pages", "pdf", "done", "failed"] as const;
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
  language: LanguageSchema,
  /** The child's name, for the cover. */
  childName: z.string(),
  methodology: MethodologySlugSchema,
  /** Catalog book slug, or null for a book of your own. */
  template: z.string().nullable(),
  talkQuestions: z.array(z.string()),
  heroImageUrl: z.string().nullable(),
  /** The toy photo the parent sent, the toy SAM cut out of it, and its character sheet. */
  toy: z
    .object({
      name: z.string().nullable(),
      photoUrl: z.string(),
      cutoutUrl: z.string().nullable(),
      sheetUrl: z.string().nullable(),
    })
    .nullable(),
  pages: z.array(BookPageSchema),
  pdfUrl: z.string().nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
});
export type Book = z.infer<typeof BookSchema>;

/** A row of "My books": what this browser has made. */
export const MyBookSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  status: BookStatusSchema,
  childName: z.string(),
  language: LanguageSchema,
  heroImageUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type MyBook = z.infer<typeof MyBookSchema>;

/** Progress shown for each stage while the book is generating. */
export function progressFor(status: BookStatus, pagesDone = 0, pagesTotal = 0): number {
  switch (status) {
    case "queued":
      return 0;
    case "toy":
      return 5;
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

/** Body of POST /toys: a JPEG photo as a data URL, already scaled down in the browser. */
export const ToyUploadSchema = z.object({
  image: z
    .string()
    .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, "Нужна фотография в формате JPEG")
    .max(8_000_000, "Фотография слишком большая"),
});
export const ToyUploadResultSchema = z.object({ upload: z.string() });

// ---- Free limit and purchased books ------------------------------------------

/** Price of one more generated (digital) book once the free ones are used. */
export const BOOK_PRICE_KZT = 2900;
/** The same book outside Kazakhstan, where only the PDF is sold. */
export const BOOK_PRICE_USD = 5.9;

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
/** Body of a 451 from any route: the visitor is in a country where Meta's models may not be offered. */
export const REGION_UNAVAILABLE = "region_unavailable";

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

// ---- Admin ---------------------------------------------------------------------

/** Body of a 503 from POST /books while generation is paused in the admin. */
export const GENERATION_PAUSED = "generation_paused";

export const AdminLoginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});
export type AdminLogin = z.infer<typeof AdminLoginSchema>;

export const PauseSchema = z.object({ paused: z.boolean() });

export const AdminStatsSchema = z.object({
  paused: z.boolean(),
  books: z.object({
    total: z.number().int(),
    today: z.number().int(),
    byStatus: z.record(z.string(), z.number().int()),
    /** Done out of finished (done + failed), 0..1; null before any book finishes. */
    successRate: z.number().nullable(),
    /** Average seconds from order to finished PDF. */
    avgSeconds: z.number().nullable(),
  }),
  spend: z.object({ totalUsd: z.number(), todayUsd: z.number(), budgetUsd: z.number() }),
  caps: z.object({
    regular: z.object({ used: z.number().int(), limit: z.number().int() }),
    demo: z.object({ used: z.number().int(), limit: z.number().int() }),
  }),
  sales: z.object({
    orders: z.number().int(),
    ordersKzt: z.number().int(),
    purchases: z.number().int(),
    purchasesKzt: z.number().int(),
  }),
  countries: z.array(z.object({ country: z.string(), books: z.number().int() })),
  /** Requests for a printed book from countries without a print partner. */
  printInterest: z.array(z.object({ country: z.string().nullable(), requests: z.number().int() })),
  templates: z.array(z.object({ slug: z.string().nullable(), title: z.string(), books: z.number().int() })),
});
export type AdminStats = z.infer<typeof AdminStatsSchema>;

export const AdminBookRowSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  status: BookStatusSchema,
  childName: z.string(),
  language: LanguageSchema,
  methodology: MethodologySlugSchema,
  template: z.string().nullable(),
  country: z.string().nullable(),
  demo: z.boolean(),
  costUsd: z.number(),
  orders: z.number().int(),
  createdAt: z.string(),
});
export type AdminBookRow = z.infer<typeof AdminBookRowSchema>;

export const AdminBookSchema = BookSchema.extend({
  child: ChildProfileSchema,
  theme: z.string().nullable(),
  answers: AnswersSchema.nullable(),
  country: z.string().nullable(),
  demo: z.boolean(),
  costUsd: z.number(),
  clientKey: z.string(),
});
export type AdminBook = z.infer<typeof AdminBookSchema>;

export const AdminOrderSchema = OrderSchema.extend({
  phone: z.string(),
  /** True when the status was set by hand rather than by the demo timer. */
  manual: z.boolean(),
});
export type AdminOrder = z.infer<typeof AdminOrderSchema>;

export const UpdateOrderStatusSchema = z.object({ status: OrderStatusSchema });

export const AdminTemplateSchema = TemplateSchema.extend({
  published: z.boolean(),
  sortOrder: z.number().int(),
  theme: z.string(),
  plot: z.array(z.string()),
  stylePrompt: z.string().nullable(),
  books: z.number().int(),
});
export type AdminTemplate = z.infer<typeof AdminTemplateSchema>;

export const UpdateTemplateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    summary: z.string().trim().min(1).max(400),
    ageMin: z.number().int().min(2).max(10),
    ageMax: z.number().int().min(2).max(10),
    methodology: MethodologySlugSchema,
    theme: z.string().trim().min(3).max(300),
    plot: z.array(z.string().trim().min(3).max(300)).min(3).max(12),
    questions: z.array(TemplateQuestionSchema).max(8),
    stylePrompt: z.string().trim().max(400).nullable(),
    published: z.boolean(),
    sortOrder: z.number().int(),
  })
  .partial();
export type UpdateTemplate = z.infer<typeof UpdateTemplateSchema>;
