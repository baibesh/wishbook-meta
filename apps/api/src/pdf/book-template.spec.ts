import { escapeHtml, renderBookHtml } from './book-template';

const book = {
  title: 'Айгерим и <звёздная> лошадка',
  childName: 'Айгерим',
  language: 'kk' as const,
  coverImage: 'hero.png',
  pages: [
    { page: 1, text: 'Бірінші бет.', image: 'page-1.png' },
    { page: 2, text: 'Екінші бет.', image: null },
  ],
  talkQuestions: ['Кітапта не болды?', 'Сен не істер едің?'],
  fontCss: '@font-face{}',
};

describe('renderBookHtml', () => {
  const html = renderBookHtml(book);

  it('lays out a cover, the story pages, a talk page and an end page', () => {
    expect(html.match(/class="page /g)).toHaveLength(5);
  });

  it('prints the talk questions in the book language', () => {
    expect(html).toContain('Әңгімелесейік');
    expect(html).toContain('<li>Сен не істер едің?</li>');
  });

  it('leaves the talk page out when there are no questions', () => {
    const plain = renderBookHtml({ ...book, talkQuestions: [] });
    expect(plain).not.toContain('class="page talk"');
  });

  it('escapes story text', () => {
    expect(html).toContain('Айгерим и &lt;звёздная&gt; лошадка');
  });

  it('uses the book language for labels', () => {
    expect(html).toContain('Соңы');
    expect(html).toContain('Арнайы саған, Айгерим!');
    expect(html).toContain('<html lang="kk">');
  });

  it('keeps the layout when an image is missing', () => {
    expect(html).toContain('<img class="art" src="page-1.png"');
    expect(html).toContain('<div class="art empty">');
  });
});

describe('escapeHtml', () => {
  it('escapes quotes and ampersands', () => {
    expect(escapeHtml(`"a" & 'b'`)).toBe('&quot;a&quot; &amp; &#39;b&#39;');
  });
});
