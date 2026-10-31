"use client";

import { ChevronDown } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { Section } from "./section";

const QUESTIONS = ["time", "kazakh", "data", "print", "account", "dislike"] as const;

/** What parents ask before making a book, as native disclosure widgets. */
export function Faq() {
  const { t } = useI18n();
  return (
    <Section id="faq" testId="faq" title={t("landing.faq.title")}>
      <div className="flex flex-col gap-3">
        {QUESTIONS.map((q) => (
          <details key={q} className="group rounded-2xl border border-border bg-card px-5 py-4 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
              {t(`landing.faq.${q}.q`)}
              <ChevronDown className="size-5 shrink-0 text-accent transition group-open:rotate-180" />
            </summary>
            <p className="pt-3 text-muted">{t(`landing.faq.${q}.a`)}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
