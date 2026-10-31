"use client";

import { METHODOLOGIES, methodologyText, type MethodologySlug } from "@fabulka/shared";
import { Compass, Globe, Heart, Repeat, School, Sprout } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { Section } from "./section";

const ICONS: Record<MethodologySlug, typeof Heart> = {
  "toddler-routine": Repeat,
  "social-story": School,
  "sel-emotions": Heart,
  "growth-mindset": Sprout,
  "mirrors-windows": Globe,
  "adventure-quest": Compass,
};

/** Every story method a book can follow, with the ages it suits. */
export function Methods() {
  const { t, locale } = useI18n();
  return (
    <Section testId="methods" title={t("landing.methods.title")} lead={t("landing.methods.lead")}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METHODOLOGIES.map((m) => {
          const Icon = ICONS[m.slug];
          const text = methodologyText(m.slug, locale);
          return (
            <li key={m.slug} className="flex gap-4 rounded-3xl border border-border bg-card p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <Icon className="size-5" />
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-extrabold leading-snug">{text.name}</h3>
                <span className="self-start rounded-full bg-border px-2.5 py-0.5 text-xs font-bold text-muted">
                  {t("common.years", { min: m.ageMin, max: m.ageMax })}
                </span>
                <p className="text-sm text-muted">{text.summary}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
