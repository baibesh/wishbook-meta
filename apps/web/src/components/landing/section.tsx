"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * A landing section: an anchor, a heading with an optional lead, and a gentle fade into view. Only
 * the opacity moves, so nothing shifts under a finger that is already tapping.
 */
export function Section({
  id,
  testId,
  title,
  lead,
  children,
}: {
  id?: string;
  testId: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      data-testid={testId}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex scroll-mt-20 flex-col gap-6"
    >
      <header className="flex max-w-2xl flex-col gap-2">
        <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h2>
        {lead && <p className="text-lg text-muted">{lead}</p>}
      </header>
      {children}
    </motion.section>
  );
}

export const primaryButton =
  "flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-lg font-bold text-accent-foreground shadow-sm transition hover:brightness-105";
export const secondaryButton =
  "flex items-center justify-center gap-2 rounded-xl border-2 border-accent px-6 py-3 text-lg font-bold text-accent transition hover:bg-accent/10";
