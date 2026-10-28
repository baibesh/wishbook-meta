"use client";

import { useQuery } from "@tanstack/react-query";
import type { BookStatus } from "@wishbook/shared";
import { AlertTriangle, Sparkles } from "lucide-react";
import { use } from "react";
import { getBook } from "@/lib/api";

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
        <h1 data-testid="book-title" className="text-3xl font-extrabold">
          {book.title}
        </h1>
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
    </div>
  );
}
