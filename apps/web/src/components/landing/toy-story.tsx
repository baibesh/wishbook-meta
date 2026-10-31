"use client";

import { ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { Section } from "./section";

/** The toy's way into a real example book: the parent's photo, SAM 3.1's cut-out, Muse Image's drawing. */
export function ToyStory() {
  const { t } = useI18n();
  const steps = [
    { src: "/landing/toy-photo.jpg", label: t("landing.toy.photo"), fit: "object-cover" },
    { src: "/landing/toy-cutout.jpg", label: t("landing.toy.cutout"), fit: "object-contain p-[6%]" },
    { src: "/landing/toy-character.jpg", label: t("landing.toy.character"), fit: "object-contain" },
  ];
  return (
    <Section testId="toy-story" title={t("landing.toy.title")} lead={t("landing.toy.lead")}>
      <ol className="grid grid-cols-3 items-start gap-2 sm:gap-4">
        {steps.map((step, i) => (
          <li key={step.src} className="relative flex flex-col items-center gap-2 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static files */}
            <img
              src={step.src}
              alt={step.label}
              loading="lazy"
              className={`aspect-square w-full rounded-2xl border border-border bg-white shadow-sm ${step.fit}`}
            />
            <span className="text-xs font-semibold text-muted sm:text-sm">{step.label}</span>
            {i < steps.length - 1 && (
              <ArrowRight
                aria-hidden
                className="absolute top-[calc(50%-1.5rem)] -right-3 z-10 size-6 rounded-full bg-accent p-1 text-accent-foreground shadow sm:-right-5 sm:size-7"
              />
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}
