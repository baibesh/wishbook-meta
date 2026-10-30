import type { Language } from '@wishbook/shared';

/** Square picture-book page; 3:2 illustrations fill the top two thirds edge to edge. */
export const PAGE_SIZE_MM = 210;

export interface BookPdfInput {
  title: string;
  childName: string;
  language: Language;
  /** Image paths relative to the HTML file. */
  coverImage: string | null;
  pages: { page: number; text: string; image: string | null }[];
  /** Questions for the parent, printed after the story. */
  talkQuestions: string[];
  /** @font-face rules for Nunito, with absolute file:// URLs. */
  fontCss: string;
}

// Phrased so the name never has to be declined ("для Армана" would need a case ending).
const LABELS: Record<
  Language,
  { madeFor: (name: string) => string; end: string; talk: string }
> = {
  ru: {
    madeFor: (name) => `Специально для тебя, ${name}!`,
    end: 'Конец',
    talk: 'Поговорим?',
  },
  kk: {
    madeFor: (name) => `Арнайы саған, ${name}!`,
    end: 'Соңы',
    talk: 'Әңгімелесейік',
  },
};

export function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
}

/** The whole book as one HTML document that Chromium prints to PDF. */
export function renderBookHtml(book: BookPdfInput): string {
  const labels = LABELS[book.language];
  const image = (src: string | null, cls: string) =>
    src
      ? `<img class="${cls}" src="${escapeHtml(src)}" alt="">`
      : `<div class="${cls} empty"></div>`;

  const pages = book.pages
    .map(
      (p) => `
  <section class="page story">
    ${image(p.image, 'art')}
    <div class="text"><p>${escapeHtml(p.text)}</p></div>
    <div class="folio">${p.page}</div>
  </section>`,
    )
    .join('');

  const talk = book.talkQuestions.length
    ? `
  <section class="page talk">
    <h2>${labels.talk}</h2>
    <ol>${book.talkQuestions.map((q) => `<li>${escapeHtml(q)}</li>`).join('')}</ol>
  </section>`
    : '';

  return `<!doctype html>
<html lang="${book.language}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(book.title)}</title>
<style>
${book.fontCss}
@page { size: ${PAGE_SIZE_MM}mm ${PAGE_SIZE_MM}mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { font-family: 'Nunito', sans-serif; color: #2b2118; background: #fffaf3; }
.page {
  width: ${PAGE_SIZE_MM}mm; height: ${PAGE_SIZE_MM}mm; position: relative;
  overflow: hidden; page-break-after: always; break-after: page;
}
.page:last-child { page-break-after: auto; break-after: auto; }
.empty { background: #eadfce; }

.cover { display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8mm; padding: 16mm; text-align: center; background: #fdf1e2; }
.cover .hero { width: 120mm; height: 120mm; object-fit: contain; border-radius: 8mm; background: #fff; }
.cover h1 { font-size: 26pt; font-weight: 800; line-height: 1.15; }
.cover .for { font-size: 12pt; color: #7a6a5c; }

.story .art { display: block; width: 100%; height: 140mm; object-fit: cover; }
.story .text { height: 70mm; padding: 9mm 16mm 12mm; display: flex; align-items: center; }
.story .text p { font-size: 16pt; line-height: 1.45; }
.story .folio { position: absolute; bottom: 6mm; right: 10mm; font-size: 9pt; color: #b3a493; }

.talk { padding: 24mm 22mm; background: #fffaf3; }
.talk h2 { font-size: 22pt; font-weight: 800; margin-bottom: 10mm; }
.talk ol { padding-left: 8mm; }
.talk li { font-size: 15pt; line-height: 1.4; margin-bottom: 6mm; }

.end { display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6mm; text-align: center; background: #fdf1e2; }
.end h2 { font-size: 30pt; font-weight: 800; }
.end .made { font-size: 9pt; color: #7a6a5c; }
</style>
</head>
<body>
  <section class="page cover">
    ${image(book.coverImage, 'hero')}
    <h1>${escapeHtml(book.title)}</h1>
    <p class="for">${escapeHtml(labels.madeFor(book.childName))}</p>
  </section>
  ${pages}${talk}
  <section class="page end">
    <h2>${labels.end}</h2>
    <p class="made">WishBook · Powered by Meta Muse models</p>
  </section>
</body>
</html>`;
}
