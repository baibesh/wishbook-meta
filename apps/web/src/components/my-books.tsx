"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { listMyBooks } from "@/lib/api";
import { ErrorNotice } from "./error-notice";

const STATUS: Record<string, string> = { done: "Готова", failed: "Не получилась" };

export function MyBooks() {
  const books = useQuery({ queryKey: ["my-books"], queryFn: listMyBooks, refetchInterval: 5000 });

  if (books.error) return <ErrorNotice error={books.error} />;
  if (!books.data) return <p className="text-muted">Загружаем…</p>;
  if (!books.data.length) {
    return (
      <div data-testid="my-books-empty" className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border p-10 text-center">
        <BookOpen className="size-10 text-accent" />
        <p className="text-lg font-bold">Здесь появятся ваши книги</p>
        <p className="text-muted">Книги хранятся в этом браузере. Начните с каталога или придумайте свою историю.</p>
        <Link href="/" className="rounded-xl bg-accent px-5 py-3 font-bold text-accent-foreground">
          Выбрать книгу
        </Link>
      </div>
    );
  }
  return (
    <ul data-testid="my-books" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {books.data.map((book) => (
        <li key={book.id}>
          <Link href={`/books/${book.id}`} className="flex gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-accent">
            {book.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- generated files, served by the API
              <img src={book.heroImageUrl} alt="" className="size-20 shrink-0 rounded-xl bg-white object-contain" />
            ) : (
              <div className="size-20 shrink-0 animate-pulse rounded-xl bg-border" />
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate font-bold">{book.title ?? book.childName}</span>
              <span className="text-sm text-muted">{STATUS[book.status] ?? "Создаётся…"}</span>
              <span className="text-xs text-muted">{new Date(book.createdAt).toLocaleDateString("ru-RU")}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
