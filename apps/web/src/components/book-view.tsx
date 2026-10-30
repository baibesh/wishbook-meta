"use client";

import { useQuery } from "@tanstack/react-query";
import { COVER_PRICE_KZT, methodology, type BookStatus } from "@wishbook/shared";
import { AlertTriangle, Download, MessageCircleQuestion, Printer, Sparkles } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { getBook } from "@/lib/api";
import { formatKzt } from "@/lib/format";

const STAGE_LABELS: Record<BookStatus, string> = {
  queued: "В очереди",
  story: "Пишем сказку",
  hero: "Рисуем героя",
  pages: "Рисуем страницы",
  pdf: "Собираем книгу",
  done: "Книга готова",
  failed: "Ошибка",
};

const finished = (status: BookStatus | undefined) => status === "done" || status === "failed";

export function BookView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: book, error } = useQuery({
    queryKey: ["book", id],
    queryFn: () => getBook(id),
    refetchInterval: (query) => (finished(query.state.data?.status) ? false : 1000),
  });

  if (error) return <p role="alert" className="text-red-600">{error.message}</p>;
  if (!book) return <p className="text-muted">Загружаем…</p>;

  return (
    <div className="flex flex-col gap-8">
      <section data-testid="book-status" data-status={book.status} className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-lg font-bold">
          {book.status === "failed" ? <AlertTriangle className="size-5 text-red-600" /> : <Sparkles className="size-5 text-accent" />}
          <span data-testid="book-stage">{STAGE_LABELS[book.status]}</span>
          <span className="text-muted">{book.progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-border">
          <div className="h-full bg-accent transition-all" style={{ width: `${book.progress}%` }} />
        </div>
        {book.error && <p role="alert" className="text-red-600">{book.error}</p>}
      </section>

      {book.title && (
        <div className="flex flex-col gap-1">
          <h1 data-testid="book-title" className="text-3xl font-extrabold">
            {book.title}
          </h1>
          <p data-testid="book-methodology" className="text-muted">
            Методика: {methodology(book.methodology).name}
          </p>
        </div>
      )}

      {book.pdfUrl && (
        <div className="flex flex-wrap gap-3">
          <a
            data-testid="download-pdf"
            href={book.pdfUrl}
            download={`${book.title ?? "wishbook"}.pdf`}
            className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-bold text-accent-foreground"
          >
            <Download className="size-5" />
            Скачать PDF
          </a>
          <Link
            data-testid="order-print"
            href={`/books/${book.id}/order`}
            className="flex items-center gap-2 rounded-xl border-2 border-accent px-6 py-3 font-bold text-accent"
          >
            <Printer className="size-5" />
            Заказать печатную книгу — от {formatKzt(COVER_PRICE_KZT.soft)}
          </Link>
        </div>
      )}

      {book.heroImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- generated files, served by the API
        <img data-testid="hero-image" src={book.heroImageUrl} alt="Герой книги" className="w-48 rounded-2xl border border-border" />
      )}

      <ol className="grid gap-6 sm:grid-cols-2">
        {book.pages.map((page) => (
          <li key={page.page} data-testid="book-page" className="overflow-hidden rounded-2xl border border-border bg-card">
            {page.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- generated files, served by the API
              <img src={page.imageUrl} alt={`Иллюстрация к странице ${page.page}`} className="aspect-[3/2] w-full object-cover" />
            ) : (
              <div className="aspect-[3/2] w-full animate-pulse bg-border" />
            )}
            <p className="p-4 leading-relaxed">{page.text}</p>
          </li>
        ))}
      </ol>

      {book.talkQuestions.length > 0 && (
        <section data-testid="talk-questions" className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <MessageCircleQuestion className="size-5 text-accent" />
            Поговорите после чтения
          </h2>
          <ol className="list-decimal space-y-2 pl-6">
            {book.talkQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
