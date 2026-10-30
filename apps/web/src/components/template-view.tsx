"use client";

import { useQuery } from "@tanstack/react-query";
import { methodology, methodologyText } from "@fabulka/shared";
import { use } from "react";
import { useI18n } from "@/i18n/i18n";
import { getTemplate } from "@/lib/api";
import { BookForm } from "./book-form";
import { ErrorNotice } from "./error-notice";

export function TemplateView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t, locale } = useI18n();
  const { data: template, error } = useQuery({ queryKey: ["template", slug, locale], queryFn: () => getTemplate(slug, locale) });

  if (error) return <ErrorNotice error={error} />;
  if (!template) return <p className="text-muted">{t("common.loading")}</p>;
  const method = { ...methodology(template.methodology), ...methodologyText(template.methodology, locale) };

  return (
    <div className="flex flex-col gap-8">
      <header className="grid items-center gap-6 sm:grid-cols-[14rem_1fr]">
        {template.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- covers are static files of any size
          <img src={template.coverUrl} alt="" className="aspect-square w-56 rounded-3xl border border-border object-cover" />
        )}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold text-accent">
            {t("common.years", { min: template.ageMin, max: template.ageMax })} · {method.name}
          </p>
          <h1 data-testid="template-title" className="text-4xl font-extrabold leading-tight">
            {template.title}
          </h1>
          <p className="text-lg text-muted">{template.summary}</p>
          <p className="text-sm text-muted">
            {method.summary} {t("template.basis", { source: method.source })}
          </p>
        </div>
      </header>
      <BookForm template={template} />
    </div>
  );
}
