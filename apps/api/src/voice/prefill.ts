import {
  VoicePrefillSchema,
  type Answers,
  type TemplateQuestion,
} from '@fabulka/shared';
import type { ZodType } from 'zod';
import type { PrefillFields } from '../meta/model-gateway';

const child = VoicePrefillSchema.shape.child.shape;
const fields = VoicePrefillSchema.shape;

/**
 * Keeps only the fields of a model's answer that are valid for the form, one by one: a bad age
 * does not cost the name. Answers are kept for known questions only, and a choice answer only
 * when it is one of the options (matched without regard to case, returned exactly as written).
 */
export function sanitizePrefill(
  raw: unknown,
  questions: TemplateQuestion[] = [],
  theme = false,
): PrefillFields {
  const input = record(raw);
  const given = record(input.child);
  const out: PrefillFields = { child: {} };

  const name = valid(child.name, given.name);
  if (name) out.child.name = name;
  const age = valid(child.age, given.age);
  if (age) out.child.age = age;
  const gender = valid(child.gender, given.gender);
  if (gender) out.child.gender = gender;
  const interests = (Array.isArray(given.interests) ? given.interests : [])
    .map((item) => valid(child.interests.unwrap().element, item))
    .filter((item) => item !== undefined)
    .slice(0, 5);
  if (interests.length) out.child.interests = interests;
  const pet = valid(child.pet, given.pet);
  if (pet) out.child.pet = pet;
  const city = valid(child.city, given.city);
  if (city) out.child.city = city;

  const toyName = valid(fields.toyName, input.toyName);
  if (toyName) out.toyName = toyName;
  const about = theme ? valid(fields.theme, input.theme) : undefined;
  if (about) out.theme = about;

  const answers = sanitizeAnswers(record(input.answers), questions);
  if (Object.keys(answers).length) out.answers = answers;
  return out;
}

function sanitizeAnswers(
  given: Record<string, unknown>,
  questions: TemplateQuestion[],
): Answers {
  const answers: Answers = {};
  for (const q of questions) {
    const value = given[q.key];
    if (typeof value !== 'string' || !value.trim()) continue;
    const answer = value.trim();
    if (q.kind === 'choice' && q.options) {
      const option = q.options.find(
        (o) => o.trim().toLowerCase() === answer.toLowerCase(),
      );
      if (option) answers[q.key] = option;
    } else if (answer.length <= 200) {
      answers[q.key] = answer;
    }
  }
  return answers;
}

/** The parsed value, or undefined when it is missing, empty or invalid. */
function valid<T>(schema: ZodType<T>, value: unknown): T | undefined {
  const parsed = schema.safeParse(value);
  return parsed.success && parsed.data !== '' ? parsed.data : undefined;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
