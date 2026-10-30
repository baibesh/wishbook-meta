"use client";

import { useQuery } from "@tanstack/react-query";
import { methodology } from "@wishbook/shared";
import { Wand2 } from "lucide-react";
import Link from "next/link";
import { listTemplates } from "@/lib/api";
import { ErrorNotice } from "./error-notice";

const card = "flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

export function Catalog() {
  const { data: templates, error } = useQuery({ queryKey: ["templates"], queryFn: listTemplates });

  if (error) return <ErrorNotice error={error} />;

  return (
    <ul data-testid="catalog" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {templates?.map((t) => (
        <li key={t.slug}>
          <Link href={`/catalog/${t.slug}`} data-testid={`template-${t.slug}`} className={card}>
            {t.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- covers are static files of any size
              <img src={t.coverUrl} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <div className="aspect-square w-full bg-border" />
            )}
            <div className="flex flex-col gap-2 p-5">
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-accent">
                  {t.ageMin}–{t.ageMax} лет
                </span>
                <span className="rounded-full bg-border px-2.5 py-1 text-muted">{methodology(t.methodology).name}</span>
              </div>
              <h2 className="text-xl font-extrabold">{t.title}</h2>
              <p className="text-sm text-muted">{t.summary}</p>
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
          <h2 className="text-xl font-extrabold">Своя история</h2>
          <p className="text-sm text-muted">
            Расскажите, о чём книга, выберите методику — сказку напишут с нуля.
          </p>
        </Link>
      </li>
    </ul>
  );
}
