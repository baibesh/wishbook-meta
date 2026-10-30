import { Global, Injectable, Module } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { StorageService } from '../storage/storage.service';
import {
  PAGE_SIZE_MM,
  renderBookHtml,
  type BookPdfInput,
} from './book-template';

/** Nunito regular and extra-bold, every subset (cyrillic-ext carries ә ғ қ ң ө ұ ү һ і). */
function nunitoCss(): string {
  const root = dirname(require.resolve('@fontsource/nunito/package.json'));
  const files = pathToFileURL(join(root, 'files')).href;
  return ['400.css', '800.css']
    .map((name) => readFileSync(join(root, name), 'utf8'))
    .join('\n')
    .replaceAll('url(./files', `url(${files}`);
}

/** Prints a book to PDF with headless Chromium (Playwright is a renderer here, not a test runner). */
@Injectable()
export class PdfService {
  private readonly fontCss = nunitoCss();

  constructor(private readonly storage: StorageService) {}

  /** Writes book.html and book.pdf next to the book's images; returns the PDF's storage path. */
  async render(
    bookId: string,
    book: Omit<BookPdfInput, 'fontCss'>,
  ): Promise<string> {
    const html = renderBookHtml({ ...book, fontCss: this.fontCss });
    const htmlPath = await this.storage.save(
      `books/${bookId}/book.html`,
      Buffer.from(html),
    );
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      // A file:// page, so the relative image paths resolve against the book folder.
      await page.goto(pathToFileURL(join(this.storage.root, htmlPath)).href, {
        waitUntil: 'load',
      });
      await page.evaluate(() => document.fonts.ready);
      const pdf = await page.pdf({
        width: `${PAGE_SIZE_MM}mm`,
        height: `${PAGE_SIZE_MM}mm`,
        printBackground: true,
        preferCSSPageSize: true,
      });
      return await this.storage.save(`books/${bookId}/book.pdf`, pdf);
    } finally {
      await browser.close();
    }
  }
}

@Global()
@Module({ providers: [PdfService], exports: [PdfService] })
export class PdfModule {}
