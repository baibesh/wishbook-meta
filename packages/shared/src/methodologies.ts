import { z } from "zod";

/**
 * Story methods a book can be written by. Names and summaries are Russian (shown to parents and in
 * the admin); structure and rules are English because they go straight into the Muse Spark prompt.
 */
export interface Methodology {
  slug: string;
  name: string;
  summary: string;
  /** Where the method comes from, so an author can read further. */
  source: string;
  ageMin: number;
  ageMax: number;
  /** Story beats in order; the pages are spread across them. */
  structure: string[];
  rules: string[];
  avoid: string[];
}

export const METHODOLOGIES = [
  {
    slug: "toddler-routine",
    name: "Повтор и ритм для малышей",
    summary: "Знакомый день малыша с повторяющейся фразой, звуками и маленьким добрым сюрпризом.",
    source: "Predictable and repetitive texts in early literacy; reality-based stories for toddlers",
    ageMin: 2,
    ageMax: 4,
    structure: [
      "A familiar everyday moment (morning, walk, bath, meal or bedtime) in a real place.",
      "A repeated pattern: on each page the hero meets or does something, and a short refrain line repeats with one small change.",
      "A small, gentle surprise that is never scary.",
      "A calm ending back in a cozy, safe place; the refrain closes the book.",
    ],
    rules: [
      "Keep the world real: no magic, no talking objects.",
      "Repeat the same refrain line on most pages so the child can say it along.",
      "Use sound words the child can imitate and name concrete things, colors and animals.",
      "One simple action per page.",
    ],
    avoid: ["villains or danger", "loss or sadness", "abstract words", "irony"],
  },
  {
    slug: "social-story",
    name: "Социальная история",
    summary: "Спокойно готовит к новому: детский сад, врач, перелёт, переезд, братик или сестрёнка.",
    source: "Social Stories by Carol Gray",
    ageMin: 2,
    ageMax: 8,
    structure: [
      "Where and when: the setting and who is there, described calmly and truthfully.",
      "What happens, step by step, in the order the child will live it.",
      "What other people do, think and feel, and why.",
      "What the hero can try: gentle options with \"can\" or \"may try\", never orders.",
      "A reassuring ending that notices what the hero did well.",
    ],
    rules: [
      "Most sentences describe; only a few suggest what the hero can do.",
      "Literal language: no idioms, irony or exaggeration.",
      "It is fine to feel a little worried; say so honestly and show that it passes.",
      "Keep the setting real so the child recognises it later.",
    ],
    avoid: ["\"must\" and \"never\"", "threats or punishment", "surprises", "magic that hides the real situation"],
  },
  {
    slug: "sel-emotions",
    name: "Эмоциональный интеллект",
    summary: "Герой учится замечать и называть чувства, успокаиваться и понимать других.",
    source: "CASEL social and emotional learning framework; emotion coaching by John Gottman",
    ageMin: 4,
    ageMax: 10,
    structure: [
      "An ordinary day; something happens that gives the hero a strong feeling (anger, fear, sadness, jealousy or disappointment).",
      "The hero names the feeling and notices it in the body.",
      "A grown-up or friend listens and accepts the feeling without shaming.",
      "The hero tries a way to calm down (slow breaths, counting, a hug, a quiet corner) and thinks about how others feel.",
      "The hero chooses what to do and solves the problem or makes up with someone.",
      "The hero knows what to try next time.",
    ],
    rules: [
      "Name emotions with plain words.",
      "Every feeling is allowed; what we do with it is a choice.",
      "Grown-ups stay calm and kind.",
      "Show the other character's feelings too.",
    ],
    avoid: ["\"big kids don't cry\"", "shaming", "punishment as the lesson", "a narrator who lectures"],
  },
  {
    slug: "growth-mindset",
    name: "Мышление роста",
    summary: "Не получилось — пока. Герой пробует, ошибается, ищет способ и добивается своего трудом.",
    source: "Growth mindset research by Carol Dweck",
    ageMin: 5,
    ageMax: 10,
    structure: [
      "The hero wants to do something hard that is linked to the child's interests.",
      "The first try fails; the hero is frustrated and says \"I can't\".",
      "Someone helps turn it into \"I can't do it yet\"; mistakes help us learn.",
      "The hero practises, tries new ways and asks for help.",
      "Step-by-step progress, then success that comes from effort and a good strategy.",
      "The hero shares what they learned or helps someone else.",
    ],
    rules: [
      "Praise effort, strategy and not giving up, never talent or being smart.",
      "Show mistakes as a normal part of learning.",
      "Use the word \"yet\" at the turning point.",
    ],
    avoid: ["instant magic success", "a born gift", "comparing the hero with other children"],
  },
  {
    slug: "mirrors-windows",
    name: "Зеркала и окна",
    summary: "Ребёнок узнаёт в книге свой город и культуру и открывает для себя мир других людей.",
    source: "\"Mirrors, windows and sliding glass doors\" by Rudine Sims Bishop",
    ageMin: 4,
    ageMax: 10,
    structure: [
      "Mirror: the hero's own world with real details of their city and Kazakh culture (places, food, traditions, words).",
      "The hero meets someone or something from another place, culture or way of life.",
      "Curiosity: questions and respectful noticing of what is different and what is the same.",
      "Something they do together where both bring something of their own.",
      "Both learn from each other; a warm ending that celebrates both worlds.",
    ],
    rules: [
      "Cultural details are accurate and respectful.",
      "Use real places in the hero's city.",
      "The other character has their own wishes and ideas, not just a role in the hero's story.",
    ],
    avoid: ["stereotypes", "one culture shown as better", "exotic clichés"],
  },
  {
    slug: "adventure-quest",
    name: "Приключение",
    summary: "Путешествие в волшебный мир по интересам ребёнка, где побеждают доброта и смекалка.",
    source: "The hero's journey (Campbell, Vogler), adapted for picture books",
    ageMin: 4,
    ageMax: 10,
    structure: [
      "The hero's ordinary world in their home city.",
      "A call to adventure linked to the child's interests.",
      "A friendly helper appears.",
      "The hero enters a magical or faraway place.",
      "Two small challenges the hero solves using their interests and skills.",
      "The biggest challenge, solved with kindness, cleverness or teamwork, never by fighting.",
      "The hero returns home a little braver, with a gift or a new friend.",
    ],
    rules: [
      "The hero makes the key decisions; grown-ups do not rescue them.",
      "Tension stays mild and is resolved within a page or two.",
    ],
    avoid: ["violence or weapons", "villains who are evil for no reason", "frightening images"],
  },
] as const satisfies readonly Methodology[];

export type MethodologySlug = (typeof METHODOLOGIES)[number]["slug"];
export const MethodologySlugSchema = z.enum(
  METHODOLOGIES.map((m) => m.slug) as [MethodologySlug, ...MethodologySlug[]],
);

export function methodology(slug: MethodologySlug): Methodology {
  return METHODOLOGIES.find((m) => m.slug === slug)!;
}

export function fitsAge(slug: MethodologySlug, age: number): boolean {
  const m = methodology(slug);
  return age >= m.ageMin && age <= m.ageMax;
}

/** Used when the parent does not pick a method. */
export function defaultMethodology(age: number): MethodologySlug {
  return age <= 3 ? "toddler-routine" : "adventure-quest";
}

/** Text norms per age, applied on top of any method. */
export interface AgeBand {
  ageMin: number;
  ageMax: number;
  sentencesPerPage: string;
  maxWordsPerPage: number;
  guidance: string[];
}

export const AGE_BANDS: readonly AgeBand[] = [
  {
    ageMin: 2,
    ageMax: 4,
    sentencesPerPage: "1 to 2 short sentences",
    maxWordsPerPage: 25,
    guidance: ["Words a toddler knows.", "Present tense, short sentences.", "No danger at all."],
  },
  {
    ageMin: 5,
    ageMax: 7,
    sentencesPerPage: "2 to 4 sentences",
    maxWordsPerPage: 60,
    guidance: ["One clear problem.", "Simple dialogue is welcome.", "Mild tension, resolved quickly."],
  },
  {
    ageMin: 8,
    ageMax: 10,
    sentencesPerPage: "3 to 6 sentences",
    maxWordsPerPage: 100,
    guidance: ["Richer vocabulary and dialogue.", "A small twist is welcome.", "Light suspense is fine."],
  },
];

export function ageBand(age: number): AgeBand {
  return AGE_BANDS.find((b) => age >= b.ageMin && age <= b.ageMax) ?? AGE_BANDS[AGE_BANDS.length - 1];
}

/**
 * Every book ends with questions for the parent to ask while reading together (dialogic reading,
 * Whitehurst: the CROWD prompts). Younger children get easier kinds.
 */
export function talkQuestionKinds(age: number): string[] {
  return age <= 4
    ? ["finish a sentence from the book", "recall what happened", "a what/where/who question about a picture"]
    : [
        "recall what happened",
        "an open question about a picture",
        "why a character felt or acted that way",
        "connect the story to the child's own life",
      ];
}
