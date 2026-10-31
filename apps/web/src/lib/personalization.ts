/** Something the parent gave (a name, a city, an answer) and what to say where it shows up in a book. */
export interface Highlight {
  value: string;
  hint: string;
}

/** A run of book text: plain, or a word (or words) that came from a highlight. */
export type Piece = string | { text: string; hint: string };

const MIN_STEM = 3;
/** How many letters an inflected word may add to its stem: Алия → Алией, Барсик → Барсиками. */
const MAX_SUFFIX = 3;
/** Russian adjective and soft-noun endings, dropped before a single final vowel is tried. */
const ENDINGS = ["ый", "ий", "ой", "ая", "яя", "ое", "ее", "ые", "ие", "ья", "ье", "ьи"];
const FINAL_VOWEL = /[аеиоуыэюяйь]$/;
/** Words too common to point at in an answer like «когда брат берёт игрушки». */
const STOP_WORDS = new Set(["когда", "если", "чтобы", "потом", "очень", "тоже", "только", "вместе", "with", "when", "that", "then"]);
const WORD = /[\p{L}\p{M}]+/gu;

const normalize = (word: string) => word.toLocaleLowerCase("ru").replaceAll("ё", "е");

/** The part of a word that stays when Russian inflects it: Бусинка → бусинк, зелёный → зелен. */
export function stem(word: string): string {
  const w = normalize(word);
  for (const ending of ENDINGS) {
    if (w.endsWith(ending) && w.length - ending.length >= MIN_STEM) return w.slice(0, -ending.length);
  }
  if (FINAL_VOWEL.test(w) && w.length - 1 >= MIN_STEM) return w.slice(0, -1);
  return w;
}

/**
 * The words of a value worth finding in the text: a name inside a phrase when there is one
 * («рыжий кот Барсик» → Барсик), otherwise its longer words («глубоко подышать» → both).
 */
export function keyWords(value: string): string[] {
  const words = value.match(WORD) ?? [];
  const names = words.filter((word, i) => i > 0 && /^\p{Lu}/u.test(word));
  if (names.length) return names;
  const long = words.filter((word) => word.length >= 4 && !STOP_WORDS.has(normalize(word)));
  return long.length ? long : words.filter((word) => word.length >= MIN_STEM);
}

/**
 * Splits text into plain runs and the words that came from the highlights, matching inflected
 * forms by stem (Алия finds Алии and Алию). Earlier highlights win; neighbouring words from the
 * same highlight («Гульнара апай») join into one piece.
 */
export function markPersonal(text: string, highlights: Highlight[]): Piece[] {
  const stems = highlights.map((h) => ({ hint: h.hint, stems: [...new Set(keyWords(h.value).map(stem))] }));
  const hintFor = (word: string) => {
    const w = normalize(word);
    return stems.find((h) => h.stems.some((s) => w.startsWith(s) && w.length - s.length <= MAX_SUFFIX))?.hint;
  };

  const pieces: Piece[] = [];
  let at = 0;
  for (const match of text.matchAll(WORD)) {
    const hint = hintFor(match[0]);
    if (!hint) continue;
    const gap = text.slice(at, match.index);
    const last = pieces.at(-1);
    if (typeof last === "object" && last.hint === hint && gap.trim() === "") last.text += gap + match[0];
    else {
      if (gap) pieces.push(gap);
      pieces.push({ text: match[0], hint });
    }
    at = match.index + match[0].length;
  }
  if (at < text.length) pieces.push(text.slice(at));
  return pieces;
}
