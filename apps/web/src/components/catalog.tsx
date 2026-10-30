"use client";

import { useQuery } from "@tanstack/react-query";
import { methodologyText } from "@fabulka/shared";
import { Wand2 } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/i18n/i18n";
import { listTemplates } from "@/lib/api";
import { ErrorNotice } from "./error-notice";

const card = "flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

export function Catalog() {
  const { t, locale } = useI18n();
  const { data: templates, error } = useQuery({ queryKey: ["templates", locale], queryFn: () => listTemplates(locale) });

  if (error) return <ErrorNotice error={error} />;

  return (
    <ul data-testid="catalog" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {templates?.map((book) => (
        <li key={book.slug}>
          <Link href={`/catalog/${book.slug}`} data-testid={`template-${book.slug}`} className={card}>
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- covers are static files of any size
              <img src={book.coverUrl} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <div className="aspect-square w-full bg-border" />
            )}
            <div className="flex flex-col gap-2 p-5">
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-accent">
                  {t("common.years", { min: book.ageMin, max: book.ageMax })}
                </span>
                <span className="rounded-full bg-border px-2.5 py-1 text-muted">{methodologyText(book.methodology, locale).name}</span>
              </div>
              <h2 className="text-xl font-extrabold">{book.title}</h2>
              <p className="text-sm text-muted">{book.summary}</p>
            </div>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href="/create"
          data-testid="create-own"
          className={`${card} h-full items-center justify-center gap-3 border-dashed p-8 text-center`}
        >
          <Wand2 className="size-10 text-accent" />
          <h2 className="text-xl font-extrabold">{t("catalog.own.title")}</h2>
          <p className="text-sm text-muted">{t("catalog.own.text")}</p>
        </Link>
      </li>
    </ul>
  );
}
