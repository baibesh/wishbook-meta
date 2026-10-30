"use client";

import { useQuery } from "@tanstack/react-query";
import { COVER_PRICE_KZT, methodology, type Book, type BookStatus } from "@wishbook/shared";
import { AlertTriangle, Download, MessageCircleQuestion, Printer, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { use } from "react";
import { getBook } from "@/lib/api";
import { formatKzt } from "@/lib/format";
import { BookReader } from "./book-reader";
import { ErrorNotice } from "./error-notice";

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

  if (error) return <ErrorNotice error={error} />;
  if (!book) return <p className="text-muted">Загружаем…</p>;
  const done = book.status === "done";

  return (
    <div className="flex flex-col gap-8">
      <section data-testid="book-status" data-status={book.status} className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-lg font-bold">
          {book.status === "failed" ? <AlertTriangle className="size-5 text-red-600" /> : <Sparkles className="size-5 text-accent" />}
          <span data-testid="book-stage">{STAGE_LABELS[book.status]}</span>
          {!done && <span className="text-muted">{book.progress}%</span>}
        </div>
        {!done && (
          <div className="h-3 overflow-hidden rounded-full bg-border">
            <motion.div className="h-full bg-accent" animate={{ width: `${book.progress}%` }} transition={{ duration: 0.8 }} />
          </div>
        )}
        {book.error && <p role="alert" className="text-red-600">{book.error}</p>}
      </section>

      {book.title && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
          <h1 data-testid="book-title" className="text-3xl font-extrabold">
            {book.title}
          </h1>
          <p data-testid="book-methodology" className="text-muted">
            Методика: {methodology(book.methodology).name}
          </p>
        </motion.div>
      )}

      {done ? <BookReader book={book} /> : <Progress book={book} />}

      {book.pdfUrl && (
        <div className="flex flex-wrap justify-center gap-3">
          <a
            data-testid="download-pdf"
            href={book.pdfUrl}
            download={`${book.title ?? "book"}.pdf`}
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

      {done && book.talkQuestions.length > 0 && (
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

/** While the book is being made: the hero, then each page as soon as it is drawn. */
function Progress({ book }: { book: Book }) {
  return (
    <div className="flex flex-col gap-6">
      {book.heroImageUrl && (
        <motion.img
          data-testid="hero-image"
          src={book.heroImageUrl}
          alt="Герой книги"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="w-48 rounded-2xl border border-border bg-white"
        />
      )}
      <ol className="grid gap-6 sm:grid-cols-2">
        {book.pages.map((page, i) => (
          <motion.li
            key={page.page}
            data-testid="book-page"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            {page.imageUrl ? (
              <motion.img
                key={page.imageUrl}
                src={page.imageUrl}
                alt={`Иллюстрация к странице ${page.page}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="aspect-[3/2] w-full object-cover"
              />
            ) : (
              <div className="aspect-[3/2] w-full animate-pulse bg-border" />
            )}
            <p className="p-4 leading-relaxed">{page.text}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
