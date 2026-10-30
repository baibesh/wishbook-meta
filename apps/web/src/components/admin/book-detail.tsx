"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { methodology } from "@fabulka/shared";
import { Download, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { adminBook, deleteBook } from "@/lib/admin-api";
import { Badge, BOOK_STATUS, Card, formatDate, formatUsd, ghostButton, PageTitle } from "./ui";

export function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const book = useQuery({ queryKey: ["admin", "book", id], queryFn: () => adminBook(id) });
  const remove = useMutation({ mutationFn: () => deleteBook(id), onSuccess: () => router.replace("/admin/books") });

  if (book.isError) return <p role="alert" className="text-red-600">{book.error.message}</p>;
  if (!book.data) return <p className="text-muted">Загружаем…</p>;
  const b = book.data;
  const facts: [string, string][] = [
    ["Ребёнок", `${b.child.name}, ${b.child.age} лет, ${b.child.gender === "girl" ? "девочка" : "мальчик"}, ${b.child.city}`],
    ["Увлечения", b.child.interests.join(", ")],
    ["Питомец", b.child.pet ?? "—"],
    ["Методика", methodology(b.methodology).name],
    ["Книга каталога", b.template ?? "своя история"],
    ["Тема", b.theme ?? "—"],
    ["Язык", b.language.toUpperCase()],
    ["Страна", b.country ?? "—"],
    ["Расход моделей", formatUsd(b.costUsd)],
    ["Создана", formatDate(b.createdAt)],
  ];

  return (
    <>
      <Link href="/admin/books" className="text-sm font-semibold text-accent">
        ← Все книги
      </Link>
      <PageTitle
        aside={
          <div className="flex flex-wrap gap-2">
            <Link href={`/books/${b.id}`} target="_blank" className={`${ghostButton} flex items-center gap-2`}>
              <ExternalLink className="size-4" />
              Открыть
            </Link>
            {b.pdfUrl && (
              <a href={b.pdfUrl} download className={`${ghostButton} flex items-center gap-2`}>
                <Download className="size-4" />
                PDF для типографии
              </a>
            )}
            <button
              type="button"
              data-testid="delete-book"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm("Удалить книгу, её файлы и заказы? Это нельзя отменить.")) remove.mutate();
              }}
              className={`${ghostButton} flex items-center gap-2 text-red-600`}
            >
              <Trash2 className="size-4" />
              Удалить
            </button>
          </div>
        }
      >
        {b.title ?? "Без названия"}
      </PageTitle>
      <div>
        <Badge tone={BOOK_STATUS[b.status].tone}>{BOOK_STATUS[b.status].label}</Badge>
        {b.demo && <span className="ml-2 text-sm text-muted">создана по демо-коду</span>}
      </div>
      {b.error && <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-sm text-red-600">{b.error}</p>}

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card title="Данные">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {facts.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {b.answers && Object.keys(b.answers).length > 0 && (
            <div className="flex flex-col gap-1 text-sm">
              <p className="font-semibold">Ответы родителя</p>
              {Object.entries(b.answers).map(([key, value]) => (
                <p key={key}>
                  <span className="text-muted">{key}:</span> {value}
                </p>
              ))}
            </div>
          )}
        </Card>
        <Card title="Страницы">
          <ol className="grid gap-4 sm:grid-cols-2">
            {b.pages.map((page) => (
              <li key={page.page} className="overflow-hidden rounded-xl border border-border">
                {page.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- generated files, served by the API
                  <img src={page.imageUrl} alt="" className="aspect-[3/2] w-full object-cover" />
                ) : (
                  <div className="aspect-[3/2] w-full bg-border" />
                )}
                <p className="p-3 text-sm">{page.text}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
