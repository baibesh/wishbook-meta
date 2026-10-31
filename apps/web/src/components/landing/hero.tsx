"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CirclePause } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useI18n } from "@/i18n/i18n";
import { getStatus, listExamples, listTemplates } from "@/lib/api";
import { useBookPrice } from "@/lib/use-price";
import { primaryButton, secondaryButton } from "./section";

/** Where each cover of the collage lies: a loose, slightly fanned pile. */
const PILE = [
  "left-0 top-[6%] w-[54%] -rotate-6",
  "right-0 top-0 w-[54%] rotate-6",
  "left-[22%] bottom-0 z-10 w-[58%] -rotate-1",
];

/** The headline, what Fabulka does, the way in, and a pile of catalog covers. */
export function Hero() {
  const { t } = useI18n();
  const { data: examples } = useQuery({ queryKey: ["examples"], queryFn: listExamples });
  const paused = useQuery({ queryKey: ["status"], queryFn: getStatus }).data?.paused === true;
  const price = useBookPrice("template");

  return (
    <section data-testid="hero" className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-48 right-[-10rem] size-[36rem] rounded-full bg-accent/15 blur-3xl" />
      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pt-10 pb-14 sm:pt-16 md:grid-cols-[1.15fr_1fr] md:pb-20">
        <div className="flex flex-col gap-5">
          {paused && (
            // New books are paused: say so before the parent picks a story, and point at the examples.
            <a
              href="#examples"
              data-testid="hero-paused"
              className="flex items-center gap-2 self-start rounded-full border border-accent/40 bg-card px-3 py-1.5 text-sm font-semibold"
            >
              <CirclePause className="size-4 shrink-0 text-accent" />
              {t("form.paused.title")}
            </a>
          )}
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{t("landing.hero.title")}</h1>
          <p className="text-lg text-muted sm:text-xl">{t("landing.hero.lead")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/catalog" data-testid="hero-cta" className={primaryButton}>
              {t("landing.hero.cta")}
              <ArrowRight className="size-5" />
            </Link>
            {Boolean(examples?.length) && (
              <a href="#example" data-testid="hero-example" className={secondaryButton}>
                <BookOpen className="size-5" />
                {t("landing.hero.example")}
              </a>
            )}
          </div>
          <p className="text-sm text-muted">{t("landing.hero.price", { price })}</p>
        </div>
        <Covers />
      </div>
    </section>
  );
}

/** Covers of the first catalog books. They arrive from the API once the page is running. */
function Covers() {
  const { locale } = useI18n();
  const { data: templates } = useQuery({ queryKey: ["templates", locale], queryFn: () => listTemplates(locale) });
  const covers = templates?.filter((book) => book.coverUrl).slice(0, PILE.length) ?? [];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm md:max-w-md">
      {covers.length > 0 && (
        <ul data-testid="hero-covers" className="absolute inset-0">
          {covers.map((book, i) => (
            <motion.li
              key={book.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.12, ease: "easeOut" }}
              className={`absolute ${PILE[i]}`}
            >
              <Link
                href={`/catalog/${book.slug}`}
                aria-label={book.title}
                className="block overflow-hidden rounded-2xl border-4 border-card shadow-xl transition hover:scale-[1.02]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- covers are static files of any size */}
                <img src={book.coverUrl!} alt="" className="aspect-square w-full object-cover" />
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
