"use client";

import { useQuery } from "@tanstack/react-query";
import { methodology } from "@wishbook/shared";
import { use } from "react";
import { getTemplate } from "@/lib/api";
import { BookForm } from "./book-form";
import { ErrorNotice } from "./error-notice";

export function TemplateView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: template, error } = useQuery({ queryKey: ["template", slug], queryFn: () => getTemplate(slug) });

  if (error) return <ErrorNotice error={error} />;
  if (!template) return <p className="text-muted">Загружаем…</p>;
  const method = methodology(template.methodology);

  return (
    <div className="flex flex-col gap-8">
      <header className="grid items-center gap-6 sm:grid-cols-[14rem_1fr]">
        {template.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- covers are static files of any size
          <img src={template.coverUrl} alt="" className="aspect-square w-56 rounded-3xl border border-border object-cover" />
        )}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold text-accent">
            {template.ageMin}–{template.ageMax} лет · {method.name}
          </p>
          <h1 data-testid="template-title" className="text-4xl font-extrabold leading-tight">
            {template.title}
          </h1>
          <p className="text-lg text-muted">{template.summary}</p>
          <p className="text-sm text-muted">
            {method.summary} Основа: {method.source}.
          </p>
        </div>
      </header>
      <BookForm template={template} />
    </div>
  );
}
